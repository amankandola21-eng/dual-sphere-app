import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Calendar, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Chat } from "./Chat";

interface Conversation {
  booking_id: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  booking_date: string;
  booking_status: string;
}

export const MessagesList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<{
    bookingId: string;
    otherUserId: string;
    otherUserName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      // Get user's bookings with message info
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_date,
          status,
          user_id,
          cleaner_id,
          customer:profiles!bookings_user_id_fkey(display_name),
          cleaner_profile:profiles!bookings_cleaner_id_fkey(display_name)
        `)
        .or(`user_id.eq.${user?.id},cleaner_id.eq.${user?.id}`);

      if (error) throw error;

      // Get latest messages for each booking
      const conversationsData = await Promise.all(
        bookings.map(async (booking) => {
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('booking_id', booking.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('booking_id', booking.id)
            .eq('receiver_id', user?.id)
            .is('read_at', null);

          const isCustomer = booking.user_id === user?.id;
          const otherUserId = isCustomer ? booking.cleaner_id : booking.user_id;
          const otherUserName = isCustomer ? 
            (booking.cleaner_profile as any)?.display_name || 'Cleaner' :
            (booking.customer as any)?.display_name || 'Customer';

          return {
            booking_id: booking.id,
            other_user_id: otherUserId,
            other_user_name: otherUserName,
            last_message: latestMessage?.content || 'No messages yet',
            last_message_time: latestMessage?.created_at || booking.scheduled_date,
            unread_count: unreadCount || 0,
            booking_date: booking.scheduled_date,
            booking_status: booking.status
          };
        })
      );

      setConversations(conversationsData.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      ));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (bookingId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .eq('receiver_id', user?.id)
        .is('read_at', null);
      
      fetchConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  if (selectedChat) {
    return (
      <Chat
        bookingId={selectedChat.bookingId}
        otherUserId={selectedChat.otherUserId}
        otherUserName={selectedChat.otherUserName}
        onBack={() => setSelectedChat(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Messages</span>
        </CardTitle>
        <CardDescription>Your booking conversations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a booking to chat with cleaners or customers</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.booking_id}
              className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedChat({
                  bookingId: conversation.booking_id,
                  otherUserId: conversation.other_user_id,
                  otherUserName: conversation.other_user_name
                });
                markAsRead(conversation.booking_id);
              }}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {conversation.other_user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{conversation.other_user_name}</h3>
                    <div className="flex items-center space-x-2">
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.last_message_time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {conversation.last_message}
                  </p>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(conversation.booking_date).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {conversation.booking_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};