import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

export const useNotificationService = () => {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleNewNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleNewNotification = (notification: any) => {
    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
    });

    // Play notification sound (if enabled)
    playNotificationSound();

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: notification.data
      });
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const sendNotification = async (
    targetUserId: string,
    title: string,
    message: string,
    type: string,
    data?: any
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          user_id: targetUserId,
          title,
          message,
          type,
          data,
          send_push: true
        }
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }
  };

  // Specific notification helpers
  const notifyBookingUpdate = async (
    bookingId: string,
    customerId: string,
    cleanerId: string,
    status: string
  ) => {
    const statusMessages = {
      confirmed: 'Your booking has been confirmed!',
      in_progress: 'Your cleaner has started the job',
      completed: 'Your cleaning service is complete',
      cancelled: 'Your booking has been cancelled'
    };

    const message = statusMessages[status as keyof typeof statusMessages] || 'Booking status updated';

    // Notify customer
    await sendNotification(
      customerId,
      'Booking Update',
      message,
      'booking',
      { booking_id: bookingId, status }
    );

    // Notify cleaner if different from customer
    if (cleanerId && cleanerId !== customerId) {
      const cleanerMessage = status === 'confirmed' 
        ? 'New booking confirmed - check your schedule!'
        : `Booking status: ${status}`;
        
      await sendNotification(
        cleanerId,
        'Job Update',
        cleanerMessage,
        'booking',
        { booking_id: bookingId, status }
      );
    }
  };

  const notifyNewMessage = async (
    senderId: string,
    receiverId: string,
    bookingId: string,
    senderName: string
  ) => {
    await sendNotification(
      receiverId,
      'New Message',
      `You have a new message from ${senderName}`,
      'message',
      { booking_id: bookingId, sender_id: senderId }
    );
  };

  const notifyPaymentUpdate = async (
    userId: string,
    amount: number,
    type: 'received' | 'released' | 'pending'
  ) => {
    const messages = {
      received: `Payment of $${amount} received!`,
      released: `Payment of $${amount} has been released`,
      pending: `Payment of $${amount} is being processed`
    };

    await sendNotification(
      userId,
      'Payment Update',
      messages[type],
      'payment',
      { amount, type }
    );
  };

  const notifyReviewReceived = async (
    cleanerId: string,
    customerName: string,
    rating: number
  ) => {
    await sendNotification(
      cleanerId,
      'New Review',
      `${customerName} left you a ${rating}-star review!`,
      'review',
      { rating, customer_name: customerName }
    );
  };

  return {
    sendNotification,
    notifyBookingUpdate,
    notifyNewMessage,
    notifyPaymentUpdate,
    notifyReviewReceived
  };
};