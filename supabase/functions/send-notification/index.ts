import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  send_push?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, message, type, data, send_push = true }: NotificationPayload = await req.json();

    if (!user_id || !title || !message || !type) {
      throw new Error('Missing required fields: user_id, title, message, type');
    }

    console.log('Creating notification for user:', user_id);

    // Create notification in database
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        data: data || {}
      })
      .select()
      .single();

    if (notificationError) {
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    console.log('Notification created:', notification.id);

    if (send_push) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('active', true);

      if (subscriptionError) {
        console.error('Error fetching push subscriptions:', subscriptionError);
      } else if (subscriptions && subscriptions.length > 0) {
        console.log(`Found ${subscriptions.length} push subscription(s) for user`);

        // Send push notifications to all user's devices
        const pushPromises = subscriptions.map(async (subscription) => {
          try {
            const pushPayload = {
              title,
              body: message,
              icon: '/icon-192.png',
              badge: '/badge-72.png',
              data: {
                type,
                notification_id: notification.id,
                ...data
              },
              actions: [
                {
                  action: 'view',
                  title: 'View'
                },
                {
                  action: 'dismiss',
                  title: 'Dismiss'
                }
              ]
            };

            // Note: In a real implementation, you'd use a service like FCM or web-push
            // For now, we'll simulate the push notification
            console.log('Would send push notification:', {
              subscription: subscription.endpoint,
              payload: pushPayload
            });

            return { success: true, subscription_id: subscription.id };
          } catch (error) {
            console.error('Failed to send push notification:', error);
            
            // Mark subscription as inactive if it failed
            await supabase
              .from('push_subscriptions')
              .update({ active: false })
              .eq('id', subscription.id);

            return { success: false, subscription_id: subscription.id, error: error.message };
          }
        });

        const pushResults = await Promise.all(pushPromises);
        console.log('Push notification results:', pushResults);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification_id: notification.id,
        message: 'Notification sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});