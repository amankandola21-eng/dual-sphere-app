import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeTrackingProps {
  booking: {
    id: string;
    hourly_rate: number;
    estimated_hours: number;
    total_price: number;
    actual_start_time?: string;
    actual_end_time?: string;
    actual_hours_worked?: number;
    final_amount?: number;
    status: string;
    customer?: {
      display_name: string;
    };
  };
  onTimeUpdated: () => void;
}

export const TimeTracking = ({ booking, onTimeUpdated }: TimeTrackingProps) => {
  const [isWorking, setIsWorking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if work is already in progress
    if (booking.actual_start_time && !booking.actual_end_time) {
      setIsWorking(true);
      setStartTime(new Date(booking.actual_start_time));
    }
  }, [booking]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWorking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - startTime.getTime()) / 1000; // seconds
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorking, startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(2);
  };

  const calculateCurrentAmount = () => {
    if (!isWorking || !startTime) return booking.total_price;
    const hoursWorked = elapsedTime / 3600;
    return booking.hourly_rate * hoursWorked;
  };

  const handleStartWork = async () => {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('bookings')
        .update({
          actual_start_time: now,
          status: 'in_progress'
        })
        .eq('id', booking.id);

      if (error) throw error;

      setIsWorking(true);
      setStartTime(new Date(now));
      setElapsedTime(0);
      
      toast({
        title: "Work Started",
        description: "Time tracking has begun for this booking.",
      });
      
      onTimeUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start work timer",
        variant: "destructive",
      });
    }
  };

  const handleEndWork = async () => {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('bookings')
        .update({
          actual_end_time: now,
          status: 'completed'
        })
        .eq('id', booking.id);

      if (error) throw error;

      setIsWorking(false);
      
      toast({
        title: "Work Completed",
        description: "Time tracking ended. Final billing amount calculated.",
      });
      
      onTimeUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to end work timer",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isCompleted = booking.actual_start_time && booking.actual_end_time;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking & Pro-Rated Billing
          </CardTitle>
          {isWorking && (
            <Badge variant="default" className="bg-green-600">
              <Play className="h-3 w-3 mr-1" />
              Working
            </Badge>
          )}
          {isCompleted && (
            <Badge variant="secondary">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Estimated vs Actual</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated:</span>
                  <span>{booking.estimated_hours}h @ ${booking.hourly_rate}/hr = ${booking.total_price.toFixed(2)}</span>
                </div>
                {isCompleted && booking.actual_hours_worked && booking.final_amount && (
                  <div className="flex justify-between font-medium text-green-700">
                    <span>Actual:</span>
                    <span>{booking.actual_hours_worked.toFixed(2)}h @ ${booking.hourly_rate}/hr = ${booking.final_amount.toFixed(2)}</span>
                  </div>
                )}
                {isWorking && (
                  <div className="flex justify-between text-blue-700">
                    <span>Current:</span>
                    <span>{formatHours(elapsedTime)}h @ ${booking.hourly_rate}/hr = ${calculateCurrentAmount().toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {booking.actual_start_time && (
              <div className="space-y-2">
                <h4 className="font-medium">Work Session</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{formatDateTime(booking.actual_start_time)}</span>
                  </div>
                  {booking.actual_end_time && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ended:</span>
                      <span>{formatDateTime(booking.actual_end_time)}</span>
                    </div>
                  )}
                  {isWorking && (
                    <div className="flex justify-between text-blue-700 font-medium">
                      <span>Elapsed:</span>
                      <span>{formatTime(elapsedTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {isCompleted && booking.final_amount && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">Work Completed</p>
                    <p className="text-green-700 mt-1">
                      Customer will be charged ${booking.final_amount.toFixed(2)} for {booking.actual_hours_worked?.toFixed(2)} hours of work.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isWorking && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Work in Progress</p>
                    <p className="text-blue-700 mt-1">
                      Time is being tracked. Customer will be charged for exact time worked.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!booking.actual_start_time && booking.status === 'confirmed' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Ready to Start</p>
                    <p className="text-yellow-700 mt-1">
                      Start the timer when you begin cleaning to track exact work time.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {booking.status === 'confirmed' && !isCompleted && (
          <div className="flex gap-3 pt-4 border-t">
            {!isWorking ? (
              <Button 
                onClick={handleStartWork}
                className="flex-1"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Work Timer
              </Button>
            ) : (
              <Button 
                onClick={handleEndWork}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <Square className="h-4 w-4 mr-2" />
                End Work & Calculate Final Bill
              </Button>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="text-xs text-muted-foreground bg-secondary p-3 rounded-md">
            <p><strong>Pro-Rated Billing:</strong> The customer has been charged for the exact time worked ({booking.actual_hours_worked?.toFixed(2)} hours) at your hourly rate of ${booking.hourly_rate}. No rounding up or down - fair billing for everyone!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};