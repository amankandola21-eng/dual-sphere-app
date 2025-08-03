import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
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

    const { bookingId } = await req.json();
    if (!bookingId) throw new Error("Booking ID is required");

    logStep("User authenticated", { userId: user.id, email: user.email, bookingId });

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, cleaners!cleaners_id_fkey(stripe_account_id)')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found or access denied");
    }

    if (!booking.cleaners?.stripe_account_id) {
      throw new Error("Cleaner has not set up their Stripe Connect account");
    }

    logStep("Booking retrieved", { 
      bookingId: booking.id, 
      totalPrice: booking.total_price,
      cleanerAccountId: booking.cleaners.stripe_account_id 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Calculate platform fee (our commission)
    const applicationFeeAmount = Math.round(booking.platform_commission * 100); // Convert to cents
    const totalAmount = Math.round(booking.total_price * 100); // Convert to cents

    // Create payment intent with transfer to cleaner
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: booking.cleaners.stripe_account_id,
      },
      metadata: {
        booking_id: bookingId,
        user_id: user.id,
        cleaner_id: booking.cleaner_id,
      },
    });

    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      applicationFee: applicationFeeAmount 
    });

    // Update booking with payment intent ID and set status to payment_pending
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        stripe_payment_intent_id: paymentIntent.id,
        status: 'payment_pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      logStep("Error updating booking", { error: updateError });
      throw new Error("Failed to update booking with payment intent");
    }

    logStep("Booking updated with payment intent");

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment-intent", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});