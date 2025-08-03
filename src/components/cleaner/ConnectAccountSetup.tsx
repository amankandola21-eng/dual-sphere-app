import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Shield,
  ArrowRight,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ConnectAccountSetupProps {
  onSetupComplete?: () => void;
}

export const ConnectAccountSetup = ({ onSetupComplete }: ConnectAccountSetupProps) => {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<'none' | 'pending' | 'complete'>('none');
  const { user } = useAuth();
  const { toast } = useToast();

  // Check current Stripe Connect status
  const checkConnectStatus = async () => {
    if (!user) return;

    try {
      const { data: cleaner, error } = await supabase
        .from('cleaners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // For now, assume setup is needed since stripe_account_id field doesn't exist yet
      // This will be updated when the migration is applied
      setAccountStatus('none');
    } catch (error) {
      console.error('Error checking Connect status:', error);
      setAccountStatus('none');
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkConnectStatus();
  }, [user]);

  const handleSetupConnect = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account');

      if (error) throw error;

      if (data?.url) {
        // Open Stripe Connect onboarding in the same window
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error setting up Connect account:', error);
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to start Stripe setup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking payment setup status...</p>
        </CardContent>
      </Card>
    );
  }

  if (accountStatus === 'complete') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <CardTitle className="text-green-900">Payment Setup Complete!</CardTitle>
              <p className="text-sm text-green-700 mt-1">You're ready to receive payments</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Stripe Account Connected</span>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <DollarSign className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>How payments work:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Customer pays through our app</li>
                <li>• Money is held securely in escrow</li>
                <li>• Funds released to your bank after job completion</li>
                <li>• Automatic deposits within 2-7 business days</li>
              </ul>
            </AlertDescription>
          </Alert>

          {onSetupComplete && (
            <Button onClick={onSetupComplete} className="w-full">
              Continue to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Setup Required
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set up secure payments to start earning money as a cleaner
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Secure & Protected</h4>
                <p className="text-sm text-muted-foreground">
                  Bank-level security with fraud protection and encrypted transactions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Fast Payments</h4>
                <p className="text-sm text-muted-foreground">
                  Get paid automatically after job completion, funds in your bank within days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Easy Tax Management</h4>
                <p className="text-sm text-muted-foreground">
                  Automatic 1099 forms and detailed earning reports for tax season
                </p>
              </div>
            </div>
          </div>

          {/* Setup Process */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Quick 5-minute setup:</strong>
              <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                <li>Verify your identity with a government ID</li>
                <li>Add your bank account information</li>
                <li>Provide your tax information (SSN/EIN)</li>
                <li>Start accepting payments immediately!</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Setup Button */}
          <Button 
            onClick={handleSetupConnect}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up your account...
              </>
            ) : (
              <>
                Set Up Payments
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Powered by <strong>Stripe</strong> • Used by millions of businesses worldwide
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            What happens next?
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• You'll be redirected to Stripe's secure setup page</p>
            <p>• Complete the verification process (takes 5-10 minutes)</p>
            <p>• Return automatically to our app when done</p>
            <p>• Start accepting bookings and earning money!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};