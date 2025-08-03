import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-PAYMENT] ${step}${detailsStr}`);
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

    const { payment_intent_id } = await req.json();
    if (!payment_intent_id) throw new Error("Payment Intent ID is required");

    logStep("User authenticated", { userId: user.id, paymentIntentId: payment_intent_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve payment intent to check status
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    logStep("Payment intent retrieved", { 
      status: paymentIntent.status,
      amount: paymentIntent.amount 
    });

    // Get booking associated with this payment intent
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('stripe_payment_intent_id', payment_intent_id)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found for this payment intent");
    }

    let newStatus = booking.status;
    let paymentStatus = booking.payment_status;

    // Update booking based on payment intent status
    if (paymentIntent.status === 'succeeded') {
      newStatus = 'confirmed';
      paymentStatus = 'paid';
      logStep("Payment succeeded, updating booking to confirmed");
    } else if (paymentIntent.status === 'requires_payment_method') {
      newStatus = 'payment_failed';
      paymentStatus = 'failed';
      logStep("Payment failed, updating booking status");
    } else if (paymentIntent.status === 'processing') {
      newStatus = 'payment_processing';
      paymentStatus = 'processing';
      logStep("Payment processing");
    }

    // Update booking status
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        status: newStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      logStep("Error updating booking", { error: updateError });
      throw new Error("Failed to update booking status");
    }

    logStep("Booking updated successfully", { 
      bookingId: booking.id,
      newStatus,
      paymentStatus 
    });

    return new Response(JSON.stringify({ 
      success: true,
      payment_status: paymentIntent.status,
      booking_status: newStatus
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in confirm-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});