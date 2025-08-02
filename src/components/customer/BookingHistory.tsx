import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Star, RotateCcw } from "lucide-react";

const BookingHistory = () => {
  // Mock data - in real app this would come from Supabase
  const pastBookings = [];

  if (pastBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
          <CardDescription>Your past cleaning appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold">No bookings yet</h3>
              <p className="text-sm text-muted-foreground">
                Your completed bookings will appear here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking History</CardTitle>
        <CardDescription>Your past cleaning appointments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pastBookings.map((booking: any) => (
          <Card key={booking.id}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm">{booking.serviceType}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <CalendarDays className="h-3 w-3" />
                      {booking.date}
                    </div>
                  </div>
                  <Badge variant={booking.status === "completed" ? "default" : "destructive"}>
                    {booking.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {booking.address}
                </div>

                {booking.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < booking.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Cleaner: {booking.cleanerName}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-sm">${booking.total}</span>
                  <Button size="sm" variant="outline">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Rebook
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default BookingHistory;