import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Smartphone, TestTube, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  booking_updates: boolean;
  payment_notifications: boolean;
  message_notifications: boolean;
  marketing_notifications: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isSupported,
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    booking_updates: true,
    payment_notifications: true,
    message_notifications: true,
    marketing_notifications: false,
    push_enabled: true,
    email_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setPreferences(data as any);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    setSaving(true);
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      const { error } = await supabase
        .from('notification_preferences' as any)
        .upsert({
          user_id: user.id,
          ...updatedPreferences
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (permission === 'default') {
        const granted = await requestPermission();
        if (granted) {
          await savePreferences({ push_enabled: true });
        }
      } else if (permission === 'granted') {
        await savePreferences({ push_enabled: true });
      } else {
        toast({
          title: "Permission Required",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
      }
    } else {
      if (subscription) {
        await unsubscribe();
      }
      await savePreferences({ push_enabled: false });
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-500">Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Not Set</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Push Notifications</span>
          </CardTitle>
          <CardDescription>
            Get instant notifications on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Browser Support</Label>
              <p className="text-sm text-muted-foreground">
                {isSupported ? 'Push notifications are supported' : 'Not supported in this browser'}
              </p>
            </div>
            <Badge variant={isSupported ? "default" : "destructive"}>
              {isSupported ? 'Supported' : 'Not Supported'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Permission Status</Label>
              <p className="text-sm text-muted-foreground">
                Current browser permission level
              </p>
            </div>
            {getPermissionBadge()}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Active Subscription</Label>
              <p className="text-sm text-muted-foreground">
                {subscription ? 'Device is registered for notifications' : 'Not registered'}
              </p>
            </div>
            <Badge variant={subscription ? "default" : "outline"}>
              {subscription ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={sendTestNotification}
              disabled={!subscription || permission !== 'granted'}
              variant="outline"
              size="sm"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Send Test
            </Button>
            
            {subscription && (
              <Button
                onClick={unsubscribe}
                variant="outline"
                size="sm"
              >
                <BellOff className="h-4 w-4 mr-2" />
                Unsubscribe
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Push Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-enabled">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications on your device
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={preferences.push_enabled && permission === 'granted'}
              onCheckedChange={handlePushToggle}
              disabled={saving || !isSupported}
            />
          </div>

          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-enabled">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => savePreferences({ email_enabled: checked })}
              disabled={saving}
            />
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <h4 className="font-medium">Notification Types</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="booking-updates">Booking Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Status changes, confirmations, cancellations
                </p>
              </div>
              <Switch
                id="booking-updates"
                checked={preferences.booking_updates}
                onCheckedChange={(checked) => savePreferences({ booking_updates: checked })}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="payment-notifications">Payment Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Payment confirmations, earnings updates
                </p>
              </div>
              <Switch
                id="payment-notifications"
                checked={preferences.payment_notifications}
                onCheckedChange={(checked) => savePreferences({ payment_notifications: checked })}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="message-notifications">Message Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  New messages from customers or cleaners
                </p>
              </div>
              <Switch
                id="message-notifications"
                checked={preferences.message_notifications}
                onCheckedChange={(checked) => savePreferences({ message_notifications: checked })}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="marketing-notifications">Marketing & Updates</Label>
                <p className="text-sm text-muted-foreground">
                  New features, tips, and promotional content
                </p>
              </div>
              <Switch
                id="marketing-notifications"
                checked={preferences.marketing_notifications}
                onCheckedChange={(checked) => savePreferences({ marketing_notifications: checked })}
                disabled={saving}
              />
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h4 className="font-medium">Quiet Hours</h4>
            <p className="text-sm text-muted-foreground">
              No notifications will be sent during these hours
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start">Start Time</Label>
                <Select
                  value={preferences.quiet_hours_start}
                  onValueChange={(value) => savePreferences({ quiet_hours_start: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quiet-end">End Time</Label>
                <Select
                  value={preferences.quiet_hours_end}
                  onValueChange={(value) => savePreferences({ quiet_hours_end: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile App Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Mobile App Notifications</span>
          </CardTitle>
          <CardDescription>
            For mobile push notifications, install the mobile app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • <strong>iOS/Android:</strong> Once you export to GitHub and build the mobile app, 
              native push notifications will work automatically
            </p>
            <p>
              • <strong>Web App:</strong> Push notifications work in supported browsers when the app is installed as a PWA
            </p>
            <p>
              • <strong>Background:</strong> Mobile app notifications work even when the app is closed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};