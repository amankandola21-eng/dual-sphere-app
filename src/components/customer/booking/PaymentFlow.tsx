import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe('pk_live_51PrRTk00ji3SwsifQukvn2dU1PP42Itfg23I4SsVsZw1Aqm5ZgDyThPctYcrKvwgoRa1EI51jwwHKxtrerdPAQi100bb7QXaOv');

interface PaymentFlowProps {
  bookingId: string;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

const PaymentForm = ({ bookingId, amount, onPaymentSuccess, onPaymentError }: PaymentFlowProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  const createPaymentIntent = async () => {
    try {
      setProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { bookingId }
      });

      if (error) throw error;

      setClientSecret(data.client_secret);
      return data.client_secret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      onPaymentError(error instanceof Error ? error.message : 'Failed to create payment intent');
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      let secret = clientSecret;
      if (!secret) {
        secret = await createPaymentIntent();
        if (!secret) return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        onPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment status in our backend
        await supabase.functions.invoke('confirm-payment', {
          body: { payment_intent_id: paymentIntent.id }
        });

        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed and payment is being held securely.",
        });
        
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
            <Shield className="h-4 w-4" />
            Escrow Protection
          </div>
          <p className="text-blue-600 text-xs">
            Your payment is held securely until the service is completed to your satisfaction.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Service Amount:</span>
            <span className="font-medium">${amount.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>${amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Funds will be automatically released to the cleaner 24 hours after service completion, 
              unless you request a refund or report an issue.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            disabled={!stripe || processing}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export const PaymentFlow = (props: PaymentFlowProps) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};