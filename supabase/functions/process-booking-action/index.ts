import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingActionRequest {
  booking_id: string;
  action: 'accept' | 'decline';
  declined_reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, action, declined_reason }: BookingActionRequest = await req.json();

    console.log('Processing booking action:', { booking_id, action });

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

    // Update booking based on action
    let updateData: any = {};
    let newStatus = booking.status;

    if (action === 'accept') {
      updateData = {
        status: 'confirmed',
        accepted_at: new Date().toISOString()
      };
      newStatus = 'confirmed';
    } else if (action === 'decline') {
      updateData = {
        status: 'cancelled',
        declined_at: new Date().toISOString(),
        declined_reason: declined_reason || 'No reason provided'
      };
      newStatus = 'cancelled';
    }

    // Update the booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking_id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update booking' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send notifications to customer
    const notificationType = action === 'accept' ? 'booking_accepted' : 'booking_declined';
    const notificationTitle = action === 'accept' 
      ? 'Booking Confirmed!' 
      : 'Booking Declined';
    const notificationMessage = action === 'accept'
      ? `Your cleaning service has been confirmed by ${booking.cleaner?.user?.display_name || 'the cleaner'}.`
      : `Your booking request has been declined. ${declined_reason ? `Reason: ${declined_reason}` : ''}`;

    // Send push notification
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: booking.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        data: { booking_id },
        send_push: true
      }
    });

    // Send email notification
    if (booking.customer?.user_id) {
      // Get customer email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(booking.customer.user_id);
      
      if (authUser?.user?.email) {
        await supabase.functions.invoke('send-email-notification', {
          body: {
            user_id: booking.user_id,
            email: authUser.user.email,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            booking_id
          }
        });
      }
    }

    console.log(`Booking ${action}ed successfully:`, booking_id);

    return new Response(JSON.stringify({ 
      success: true, 
      booking_id,
      action,
      new_status: newStatus
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in process-booking-action function:", error);
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