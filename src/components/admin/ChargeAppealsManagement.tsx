import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, FileText, User, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Appeal {
  id: string;
  booking_id: string;
  customer_id: string;
  appeal_reason: string;
  appeal_description: string;
  status: string;
  admin_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  booking?: {
    no_show_charge_amount: number;
    scheduled_date: string;
    scheduled_time: string;
  } | null;
  customer?: {
    display_name: string;
  } | null;
}

export const ChargeAppealsManagement = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      const { data, error } = await supabase
        .from('charge_appeals')
        .select(`
          *,
          booking:bookings!charge_appeals_booking_id_fkey(
            no_show_charge_amount,
            scheduled_date,
            scheduled_time
          ),
          customer:profiles!charge_appeals_customer_id_fkey(
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppeals((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch appeals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppealDecision = async (appealId: string, decision: 'approved' | 'rejected') => {
    const notes = adminNotes[appealId];
    if (!notes?.trim()) {
      toast({
        title: "Admin Notes Required",
        description: "Please provide admin notes explaining your decision.",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(appealId);
    try {
      const { error } = await supabase
        .from('charge_appeals')
        .update({
          status: decision,
          admin_notes: notes,
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', appealId);

      if (error) throw error;

      // Find the appeal to get customer info
      const appeal = appeals.find(a => a.id === appealId);
      if (appeal) {
        // Send notification to customer
        await supabase.functions.invoke('send-notification', {
          body: {
            user_id: appeal.customer_id,
            title: `Appeal ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
            message: decision === 'approved' 
              ? 'Your no-show charge appeal has been approved. The charge will be refunded.'
              : 'Your no-show charge appeal has been reviewed and rejected.',
            type: 'appeal_resolved',
            data: { 
              appeal_id: appealId, 
              booking_id: appeal.booking_id,
              decision 
            },
            send_push: true
          }
        });
      }

      toast({
        title: "Appeal Processed",
        description: `Appeal has been ${decision}.`,
      });
      
      fetchAppeals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process appeal",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      'was_present': 'Was Present',
      'cleaner_late': 'Cleaner Late',
      'cleaner_no_show': 'Cleaner No-Show',
      'emergency': 'Emergency',
      'miscommunication': 'Miscommunication',
      'technical_issue': 'Technical Issue',
      'other': 'Other'
    };
    return reasonMap[reason] || reason;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatBookingDate = (appeal: Appeal) => {
    if (!appeal.booking) return '';
    const date = new Date(appeal.booking.scheduled_date);
    return `${date.toLocaleDateString()} at ${appeal.booking.scheduled_time}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Charge Appeals Management</h2>
        <Badge variant="secondary">
          {appeals.filter(a => a.status === 'pending').length} Pending
        </Badge>
      </div>

      {appeals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No appeals to review at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appeals.map((appeal) => (
            <Card key={appeal.id} className={appeal.status === 'pending' ? 'border-yellow-200' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5" />
                    Appeal #{appeal.id.slice(0, 8)}
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(appeal.status)}>
                    {appeal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Customer:</span>
                      <span>{appeal.customer?.display_name || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Booking Date:</span>
                      <span>{formatBookingDate(appeal)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Charge Amount:</span>
                      <span>${appeal.booking?.no_show_charge_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Reason:</span>
                      <span>{getReasonLabel(appeal.appeal_reason)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Submitted:</span>
                      <span>{formatDate(appeal.created_at)}</span>
                    </div>
                    
                    {appeal.resolved_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Resolved:</span>
                        <span>{formatDate(appeal.resolved_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-medium text-sm">Customer Description:</span>
                  <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">
                    {appeal.appeal_description}
                  </p>
                </div>

                {appeal.admin_notes && (
                  <div className="space-y-2">
                    <span className="font-medium text-sm">Admin Notes:</span>
                    <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                      {appeal.admin_notes}
                    </p>
                  </div>
                )}

                {appeal.status === 'pending' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Admin Notes (Required)
                      </label>
                      <Textarea
                        placeholder="Provide detailed notes explaining your decision..."
                        value={adminNotes[appeal.id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({
                          ...prev,
                          [appeal.id]: e.target.value
                        }))}
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleAppealDecision(appeal.id, 'approved')}
                        disabled={processingId === appeal.id || !adminNotes[appeal.id]?.trim()}
                        className="flex-1"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Appeal
                      </Button>
                      <Button 
                        onClick={() => handleAppealDecision(appeal.id, 'rejected')}
                        disabled={processingId === appeal.id || !adminNotes[appeal.id]?.trim()}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Appeal
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};