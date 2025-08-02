import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MapPin, Clock, Star } from "lucide-react";
import BookingFlow from "@/components/customer/BookingFlow";
import BookingHistory from "@/components/customer/BookingHistory";
import ProfileSection from "@/components/customer/ProfileSection";

const CustomerDashboard = () => {
  const [showBookingFlow, setShowBookingFlow] = useState(false);

  if (showBookingFlow) {
    return <BookingFlow onBack={() => setShowBookingFlow(false)} />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">CleanerConnect</h1>
          <p className="text-muted-foreground">Professional cleaning at your fingertips</p>
        </div>

        {/* Quick Book Button */}
        <Button 
          onClick={() => setShowBookingFlow(true)}
          className="w-full h-16 text-lg"
          size="lg"
        >
          <Plus className="mr-2 h-6 w-6" />
          Book a Cleaner
        </Button>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">5.0</p>
                  <p className="text-xs text-muted-foreground">Your Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Your scheduled cleaning appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">No upcoming bookings</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <BookingHistory />
          </TabsContent>
          
          <TabsContent value="profile">
            <ProfileSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDashboard;