import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Clock, Volume, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPreferences {
  id?: string;
  user_id: string;
  booking_updates: boolean;
  payment_notifications: boolean;
  message_notifications: boolean;
  marketing_notifications: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const defaultPreferences: Partial<NotificationPreferences> = {
  booking_updates: true,
  payment_notifications: true,
  message_notifications: true,
  marketing_notifications: false,
  push_enabled: true,
  email_enabled: true,
  quiet_hours_start: '22:00:00',
  quiet_hours_end: '08:00:00'
};

export const NotificationPreferencesPanel = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences for new users
        const newPreferences: NotificationPreferences = {
          user_id: user!.id,
          ...defaultPreferences
        } as NotificationPreferences;
        
        const { data: created, error: createError } = await supabase
          .from('notification_preferences')
          .insert(newPreferences)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(created);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          booking_updates: preferences.booking_updates,
          payment_notifications: preferences.payment_notifications,
          message_notifications: preferences.message_notifications,
          marketing_notifications: preferences.marketing_notifications,
          push_enabled: preferences.push_enabled,
          email_enabled: preferences.email_enabled,
          quiet_hours_start: preferences.quiet_hours_start,
          quiet_hours_end: preferences.quiet_hours_end
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Remove seconds
  };

  const parseTime = (timeString: string) => {
    return timeString.length === 5 ? `${timeString}:00` : timeString;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Unable to load notification preferences.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Methods */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Methods</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications on your device
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Types</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Booking Updates</Label>
              <p className="text-sm text-muted-foreground">
                Notifications about booking confirmations, changes, and status updates
              </p>
            </div>
            <Switch
              checked={preferences.booking_updates}
              onCheckedChange={(checked) => updatePreference('booking_updates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Payment Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Payment confirmations, receipts, and billing updates
              </p>
            </div>
            <Switch
              checked={preferences.payment_notifications}
              onCheckedChange={(checked) => updatePreference('payment_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Message Notifications</Label>
              <p className="text-sm text-muted-foreground">
                New messages from customers or cleaners
              </p>
            </div>
            <Switch
              checked={preferences.message_notifications}
              onCheckedChange={(checked) => updatePreference('message_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Marketing Communications</Label>
              <p className="text-sm text-muted-foreground">
                Promotional offers, tips, and product updates
              </p>
            </div>
            <Switch
              checked={preferences.marketing_notifications}
              onCheckedChange={(checked) => updatePreference('marketing_notifications', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h3 className="text-lg font-medium">Quiet Hours</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Set times when you don't want to receive notifications
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">Start Time</Label>
              <Input
                id="quiet-start"
                type="time"
                value={formatTime(preferences.quiet_hours_start)}
                onChange={(e) => updatePreference('quiet_hours_start', parseTime(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">End Time</Label>
              <Input
                id="quiet-end"
                type="time"
                value={formatTime(preferences.quiet_hours_end)}
                onChange={(e) => updatePreference('quiet_hours_end', parseTime(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={savePreferences}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};