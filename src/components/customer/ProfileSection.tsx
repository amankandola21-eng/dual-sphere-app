import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, CreditCard, Bell, Star, Settings } from "lucide-react";

const ProfileSection = () => {
  // Mock user data - in real app this would come from Supabase auth
  const user = {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    avatar: "",
    rating: 5.0,
    totalBookings: 0,
  };

  return (
    <div className="space-y-4">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>
                {user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="text-xs">{user.rating} • {user.totalBookings} bookings</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={user.phone} type="tel" />
            </div>
          </div>

          <Button className="w-full">Update Profile</Button>
        </CardContent>
      </Card>

      {/* Saved Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Saved Addresses
          </CardTitle>
          <CardDescription>Manage your frequently used addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Home</span>
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      123 Main St, New York, NY 10001
                    </p>
                  </div>
                  <Button size="sm" variant="outline">Edit</Button>
                </div>
              </CardContent>
            </Card>
            
            <Button variant="outline" className="w-full">
              <MapPin className="h-4 w-4 mr-2" />
              Add New Address
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your payment options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Payments are processed securely and held for 24 hours after service completion
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Bell className="h-4 w-4 mr-2" />
            Notification Preferences
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <User className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
          <Button variant="destructive" className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSection;