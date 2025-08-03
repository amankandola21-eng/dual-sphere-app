import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings,
  DollarSign,
  Percent,
  Clock,
  Mail,
  Save,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PlatformSettings {
  commission_rate: number;
  auto_release_hours: number;
  platform_email: string;
  max_hourly_rate: number;
  min_hourly_rate: number;
  booking_buffer_hours: number;
}

export const AdminPlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    commission_rate: 5.0,
    auto_release_hours: 24,
    platform_email: 'support@cleanconnect.com',
    max_hourly_rate: 200,
    min_hourly_rate: 15,
    booking_buffer_hours: 2
  });
  
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings>(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      // Convert array to object
      const settingsMap = data?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>) || {};

      const loadedSettings: PlatformSettings = {
        commission_rate: parseFloat(settingsMap.commission_rate || '5.0'),
        auto_release_hours: parseInt(settingsMap.auto_release_hours || '24'),
        platform_email: settingsMap.platform_email || 'support@cleanconnect.com',
        max_hourly_rate: parseFloat(settingsMap.max_hourly_rate || '200'),
        min_hourly_rate: parseFloat(settingsMap.min_hourly_rate || '15'),
        booking_buffer_hours: parseInt(settingsMap.booking_buffer_hours || '2')
      };

      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load platform settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update each setting
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value.toString(),
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }));

      // Use upsert to insert or update settings
      for (const setting of settingsArray) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert(setting, { 
            onConflict: 'setting_key',
            ignoreDuplicates: false 
          });

        if (error) throw error;
      }

      setOriginalSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Platform settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save platform settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    toast({
      title: "Settings Reset",
      description: "Changes have been reverted to last saved values.",
    });
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading platform settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Settings</h2>
          <p className="text-muted-foreground">Configure platform-wide settings and policies</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="commission_rate">
                Platform Commission Rate (%)
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={settings.commission_rate}
                  onChange={(e) => setSettings({...settings, commission_rate: parseFloat(e.target.value)})}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Percentage taken from each booking as platform fee
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_hourly_rate">Min Hourly Rate ($)</Label>
                <Input
                  id="min_hourly_rate"
                  type="number"
                  min="10"
                  max="50"
                  value={settings.min_hourly_rate}
                  onChange={(e) => setSettings({...settings, min_hourly_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_hourly_rate">Max Hourly Rate ($)</Label>
                <Input
                  id="max_hourly_rate"
                  type="number"
                  min="50"
                  max="500"
                  value={settings.max_hourly_rate}
                  onChange={(e) => setSettings({...settings, max_hourly_rate: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Operational Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="auto_release_hours">
                Auto-Release Payment (Hours)
              </Label>
              <Input
                id="auto_release_hours"
                type="number"
                min="1"
                max="168"
                value={settings.auto_release_hours}
                onChange={(e) => setSettings({...settings, auto_release_hours: parseInt(e.target.value)})}
              />
              <p className="text-sm text-muted-foreground">
                Hours after job completion before payment is automatically released
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking_buffer_hours">
                Booking Buffer (Hours)
              </Label>
              <Input
                id="booking_buffer_hours"
                type="number"
                min="1"
                max="48"
                value={settings.booking_buffer_hours}
                onChange={(e) => setSettings({...settings, booking_buffer_hours: parseInt(e.target.value)})}
              />
              <p className="text-sm text-muted-foreground">
                Minimum hours in advance that bookings can be made
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform_email">
                Platform Support Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="platform_email"
                  type="email"
                  value={settings.platform_email}
                  onChange={(e) => setSettings({...settings, platform_email: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Preview */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Current Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>• Platform takes <strong>{settings.commission_rate}%</strong> commission on each booking</p>
          <p>• Cleaners can charge between <strong>${settings.min_hourly_rate} - ${settings.max_hourly_rate}</strong> per hour</p>
          <p>• Payments auto-release after <strong>{settings.auto_release_hours} hours</strong> of job completion</p>
          <p>• Bookings require <strong>{settings.booking_buffer_hours} hours</strong> advance notice</p>
          <p>• Support inquiries go to <strong>{settings.platform_email}</strong></p>
        </CardContent>
      </Card>

      {/* Warning */}
      {hasChanges && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">Unsaved Changes</p>
                <p className="text-yellow-700 text-sm">
                  You have unsaved changes. Remember to save before leaving this page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};