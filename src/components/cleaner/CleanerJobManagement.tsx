import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign,
  Phone,
  MessageCircle,
  CheckCircle,
  PlayCircle,
  AlertCircle,
  Navigation
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_hours: number;
  hourly_rate: number;
  total_price: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  special_instructions?: string;
}

export const CleanerJobManagement = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobs = async () => {
    if (!user) return;

    try {
      // Get cleaner ID first
      const { data: cleaner, error: cleanerError } = await supabase
        .from('cleaners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (cleanerError || !cleaner) {
        throw new Error('Cleaner profile not found');
      }

      // Fetch jobs for this cleaner
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          scheduled_date,
          scheduled_time,
          estimated_hours,
          hourly_rate,
          total_price,
          address_line1,
          address_line2,
          city,
          postal_code,
          special_instructions
        `)
        .eq('cleaner_id', cleaner.id)
        .in('status', ['confirmed', 'in_progress', 'completed'])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    setActionLoading(jobId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Job marked as ${newStatus.replace('_', ' ')}`,
      });

      fetchJobs(); // Refresh jobs
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getJobActions = (job: Job) => {
    const actions = [];

    if (job.status === 'confirmed') {
      actions.push(
        <Button
          key="start"
          size="sm"
          onClick={() => updateJobStatus(job.id, 'in_progress')}
          disabled={actionLoading === job.id}
        >
          <PlayCircle className="h-4 w-4 mr-1" />
          Start Job
        </Button>
      );
    }

    if (job.status === 'in_progress') {
      actions.push(
        <Button
          key="complete"
          size="sm"
          onClick={() => updateJobStatus(job.id, 'completed')}
          disabled={actionLoading === job.id}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Complete Job
        </Button>
      );
    }

    return actions;
  };

  const openNavigation = (address: string, city: string, postalCode: string) => {
    const fullAddress = `${address}, ${city} ${postalCode}`;
    const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}`;
    window.open(mapsUrl, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading your jobs...</p>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Jobs Yet</h3>
          <p className="text-muted-foreground">
            Once customers book your services, they'll appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Jobs</h2>
        <p className="text-muted-foreground">Manage your cleaning appointments</p>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      Customer Booking
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(job.scheduled_date).toLocaleDateString()} at {job.scheduled_time}
                    </p>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${job.total_price.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    ${job.hourly_rate}/hr × {job.estimated_hours}h
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{job.address_line1}</p>
                  {job.address_line2 && <p className="text-sm">{job.address_line2}</p>}
                  <p className="text-sm text-muted-foreground">
                    {job.city}, {job.postal_code}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openNavigation(job.address_line1, job.city, job.postal_code)}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Duration: {job.estimated_hours} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Rate: ${job.hourly_rate}/hour</span>
                </div>
              </div>

              {/* Special Instructions */}
              {job.special_instructions && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Special Instructions:</strong> {job.special_instructions}
                  </AlertDescription>
                </Alert>
              )}

              {/* Payment Status for Completed Jobs */}
              {job.status === 'completed' && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    Payment is being processed and will be deposited to your bank account within 2-7 business days.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {getJobActions(job)}
                
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  Contact
                </Button>
                
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};