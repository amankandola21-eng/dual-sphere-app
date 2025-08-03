import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RELEASE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { bookingId, releaseType = 'full' } = await req.json();
    if (!bookingId) throw new Error("Booking ID is required");

    logStep("User authenticated", { userId: user.id, email: user.email, bookingId, releaseType });

    // Get booking details with payment info
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Check if user has permission to release (customer or admin or auto-release)
    const isCustomer = booking.user_id === user.id;
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    const isAdmin = userRole?.role === 'admin';
    const isAutoRelease = booking.status === 'auto_release_pending';

    if (!isCustomer && !isAdmin && !isAutoRelease) {
      throw new Error("Unauthorized to release payment for this booking");
    }

    if (booking.payment_status === 'released') {
      throw new Error("Payment has already been released");
    }

    if (!booking.stripe_payment_intent_id) {
      throw new Error("No payment intent found for this booking");
    }

    logStep("Booking validation passed", { 
      status: booking.status,
      paymentStatus: booking.payment_status,
      paymentIntentId: booking.stripe_payment_intent_id
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // For Stripe Connect, payments are automatically transferred when payment intent is confirmed
    // We just need to update our records to reflect the release
    
    // Record the payment release
    const { error: releaseError } = await supabaseClient
      .from('payment_releases')
      .insert({
        booking_id: bookingId,
        released_by: user.id,
        release_type: releaseType,
        amount_released: booking.cleaner_earnings,
        stripe_transfer_id: `auto_${booking.stripe_payment_intent_id}`, // Auto transfer via Connect
        created_at: new Date().toISOString()
      });

    if (releaseError) {
      logStep("Error recording payment release", { error: releaseError });
      throw new Error("Failed to record payment release");
    }

    // Update booking status
    const newStatus = booking.status === 'auto_release_pending' ? 'completed' : 'payment_released';
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        payment_status: 'released',
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      logStep("Error updating booking", { error: updateError });
      throw new Error("Failed to update booking status");
    }

    logStep("Payment released successfully", { 
      bookingId,
      amountReleased: booking.cleaner_earnings,
      newStatus 
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Payment released successfully",
      amount_released: booking.cleaner_earnings
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in release-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});