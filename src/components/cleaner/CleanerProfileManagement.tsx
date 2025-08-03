import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Star, 
  DollarSign,
  Clock,
  Save,
  Camera,
  Shield,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CleanerProfile {
  id: string;
  hourly_rate: number;
  bio: string;
  experience_years: number;
  available: boolean;
  rating: number;
  total_jobs: number;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const CleanerProfileManagement = () => {
  const [profile, setProfile] = useState<CleanerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    hourly_rate: 25,
    bio: '',
    experience_years: 0,
    available: true
  });

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select(`
          id,
          hourly_rate,
          bio,
          experience_years,
          available,
          rating,
          total_jobs,
          profiles!cleaners_user_id_fkey(display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.profiles?.display_name || '',
          hourly_rate: data.hourly_rate,
          bio: data.bio || '',
          experience_years: data.experience_years || 0,
          available: data.available
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update cleaners table
      const { error: cleanerError } = await supabase
        .from('cleaners')
        .update({
          hourly_rate: formData.hourly_rate,
          bio: formData.bio,
          experience_years: formData.experience_years,
          available: formData.available,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (cleanerError) throw cleanerError;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        display_name: profile.profiles?.display_name || '',
        hourly_rate: profile.hourly_rate,
        bio: profile.bio || '',
        experience_years: profile.experience_years || 0,
        available: profile.available
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Profile Found</h3>
          <p className="text-muted-foreground">
            Please contact support to set up your cleaner profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Management</h2>
          <p className="text-muted-foreground">Manage your cleaner profile and settings</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={profile.profiles?.avatar_url} />
                <AvatarFallback className="text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{profile.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Jobs</span>
                <span className="font-medium">{profile.total_jobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={profile.available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {profile.available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              {isEditing ? (
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  placeholder="Enter your display name"
                />
              ) : (
                <p className="text-sm p-2 border rounded-md bg-gray-50">
                  {profile.profiles?.display_name || 'Not set'}
                </p>
              )}
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Hourly Rate
              </Label>
              {isEditing ? (
                <Input
                  id="hourly_rate"
                  type="number"
                  min="15"
                  max="200"
                  step="0.50"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                />
              ) : (
                <p className="text-sm p-2 border rounded-md bg-gray-50">
                  ${profile.hourly_rate}/hour
                </p>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="experience_years">
                <Briefcase className="h-4 w-4 inline mr-1" />
                Years of Experience
              </Label>
              {isEditing ? (
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value)})}
                />
              ) : (
                <p className="text-sm p-2 border rounded-md bg-gray-50">
                  {profile.experience_years} years
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell customers about yourself, your experience, and what makes you special..."
                  rows={4}
                />
              ) : (
                <p className="text-sm p-3 border rounded-md bg-gray-50 min-h-[100px]">
                  {profile.bio || 'No bio provided'}
                </p>
              )}
            </div>

            {/* Availability */}
            <div className="space-y-2">
              <Label>
                <Clock className="h-4 w-4 inline mr-1" />
                Availability
              </Label>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({...formData, available: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="available" className="text-sm">
                    Available for new bookings
                  </Label>
                </div>
              ) : (
                <p className="text-sm p-2 border rounded-md bg-gray-50">
                  {profile.available ? 'Available for new bookings' : 'Currently unavailable'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Security */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Account Security</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your profile is verified and secure. Payment setup is complete and ready to receive payments.
              </p>
              <Button variant="outline" size="sm" className="mt-3 border-blue-300 text-blue-700">
                Manage Payment Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};