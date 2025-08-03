import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NoShowRequest {
  booking_id: string;
  type: 'detected' | 'charge';
  lat?: number;
  lng?: number;
  customer_confirmed?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, type, lat, lng, customer_confirmed }: NoShowRequest = await req.json();

    console.log('Processing no-show action:', { booking_id, type, lat, lng, customer_confirmed });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:profiles!bookings_user_id_fkey(display_name, user_id),
        cleaner:cleaners(user_id, user:profiles!cleaners_user_id_fkey(display_name))
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (type === 'detected') {
      // Record cleaner arrival with GPS coordinates
      const updateData: any = {
        cleaner_arrived_at: new Date().toISOString(),
        customer_confirmed_access: customer_confirmed || false
      };

      if (lat && lng) {
        updateData.cleaner_arrival_lat = lat;
        updateData.cleaner_arrival_lng = lng;
      }

      // Update booking with arrival info
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking_id);

      if (updateError) {
        console.error('Error updating booking arrival:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update booking arrival' }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // If customer didn't confirm access, start no-show timer
      if (!customer_confirmed) {
        // Send notification to customer
        await supabase.functions.invoke('send-notification', {
          body: {
            user_id: booking.user_id,
            title: 'Cleaner Has Arrived',
            message: 'Your cleaner has arrived and is waiting for access. Please confirm their arrival or contact them directly.',
            type: 'cleaner_arrived',
            data: { booking_id },
            send_push: true
          }
        });

        // Send email notification
        const { data: authUser } = await supabase.auth.admin.getUserById(booking.user_id);
        if (authUser?.user?.email) {
          await supabase.functions.invoke('send-email-notification', {
            body: {
              user_id: booking.user_id,
              email: authUser.user.email,
              title: 'Cleaner Has Arrived',
              message: 'Your cleaner has arrived and is waiting for access. Please confirm their arrival or contact them directly.',
              type: 'cleaner_arrived',
              booking_id
            }
          });
        }

        // Schedule no-show charge after 15 minutes (for demo, using shorter time)
        // In production, you'd want to use a proper job queue or cron job
        setTimeout(async () => {
          // Check if customer has confirmed access in the meantime
          const { data: currentBooking } = await supabase
            .from('bookings')
            .select('customer_confirmed_access, no_show_detected')
            .eq('id', booking_id)
            .single();

          if (!currentBooking?.customer_confirmed_access && !currentBooking?.no_show_detected) {
            // Process no-show charge
            await supabase.functions.invoke('handle-no-show', {
              body: {
                booking_id,
                type: 'charge'
              }
            });
          }
        }, 15 * 60 * 1000); // 15 minutes
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Cleaner arrival recorded',
        customer_confirmed: customer_confirmed || false
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else if (type === 'charge') {
      // Process no-show charge
      const oneHourRate = booking.hourly_rate;
      const chargeAmount = oneHourRate;

      // Update booking with no-show info
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          no_show_detected: true,
          no_show_charge_amount: chargeAmount,
          no_show_charged_at: new Date().toISOString()
        })
        .eq('id', booking_id);

      if (updateError) {
        console.error('Error updating booking with no-show charge:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update booking with no-show charge' }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Create payment intent for no-show charge
      const paymentResponse = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(chargeAmount * 100), // Convert to cents
          currency: 'usd',
          customer_id: booking.user_id,
          description: `No-show charge for booking ${booking_id}`,
          booking_id,
          charge_type: 'no_show'
        }
      });

      // Send notifications about no-show charge
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: booking.user_id,
          title: 'No-Show Charge Applied',
          message: `A $${chargeAmount.toFixed(2)} no-show charge has been applied to your booking. You can appeal this charge if you believe it was applied in error.`,
          type: 'no_show_detected',
          data: { booking_id, charge_amount: chargeAmount },
          send_push: true
        }
      });

      // Send email notification
      const { data: authUser } = await supabase.auth.admin.getUserById(booking.user_id);
      if (authUser?.user?.email) {
        await supabase.functions.invoke('send-email-notification', {
          body: {
            user_id: booking.user_id,
            email: authUser.user.email,
            title: 'No-Show Charge Applied',
            message: `A $${chargeAmount.toFixed(2)} no-show charge has been applied to your booking. You can appeal this charge if you believe it was applied in error.`,
            type: 'no_show_detected',
            booking_id
          }
        });
      }

      console.log(`No-show charge of $${chargeAmount} applied to booking:`, booking_id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No-show charge processed',
        charge_amount: chargeAmount,
        payment_response: paymentResponse
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action type' }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in handle-no-show function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);