import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    checkSupport();
    checkPermission();
  }, []);

  useEffect(() => {
    if (user && permission === 'granted') {
      registerServiceWorker();
    }
  }, [user, permission]);

  const checkSupport = () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (!supported) {
      console.warn('Push notifications are not supported in this browser');
    }
  };

  const checkPermission = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Permission Granted",
          description: "You'll now receive push notifications",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "You won't receive push notifications",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const registerServiceWorker = async () => {
    if (!user) return;

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Subscribe to push notifications
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertVapidKey(getVapidPublicKey())
      });

      console.log('Push subscription:', sub);
      setSubscription(sub);

      // Save subscription to database
      await savePushSubscription(sub);

    } catch (error) {
      console.error('Error registering service worker:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to register for push notifications",
        variant: "destructive",
      });
    }
  };

  const savePushSubscription = async (sub: PushSubscription) => {
    if (!user) return;

    try {
      const subscriptionData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh_key: sub.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))) : null,
        auth_key: sub.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))) : null,
        device_type: 'web',
        device_name: navigator.platform,
        user_agent: navigator.userAgent
      };

      const { error } = await supabase
        .from('push_subscriptions' as any)
        .upsert(subscriptionData, { 
          onConflict: 'user_id,endpoint',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      console.log('Push subscription saved to database');
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  };

  const unsubscribe = async () => {
    if (!subscription || !user) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Remove from database
      await supabase
        .from('push_subscriptions' as any)
        .update({ active: false })
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      toast({
        title: "Unsubscribed",
        description: "You won't receive push notifications anymore",
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe from push notifications",
        variant: "destructive",
      });
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          user_id: user.id,
          title: 'Test Notification',
          message: 'This is a test push notification from CleanerConnect!',
          type: 'test',
          send_push: true
        }
      });

      if (error) throw error;

      toast({
        title: "Test Sent",
        description: "Test notification sent successfully",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const getVapidPublicKey = () => {
    // In a real app, this would come from environment variables
    // For now, using a placeholder key
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIm5IuJNy6KEF0-VqWpIGK2vMCJJWHu0L7Qy6g0ggT0xvSYM7vA6w';
  };

  const convertVapidKey = (vapidKey: string) => {
    const padding = '='.repeat((4 - vapidKey.length % 4) % 4);
    const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    sendTestNotification
  };
};