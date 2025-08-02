import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Sparkles, Users, Shield, Clock, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-between items-start">
            <div></div>
            {user && (
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
          
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">CleanerConnect</h1>
            <p className="text-muted-foreground">Professional cleaning at your fingertips</p>
            {user && (
              <p className="text-sm text-primary font-medium mt-2">
                Welcome back, {user.email}!
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Trusted Cleaners</h3>
                  <p className="text-sm text-muted-foreground">Background-checked professionals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Flexible Scheduling</h3>
                  <p className="text-sm text-muted-foreground">Book same-day or in advance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Secure Payments</h3>
                  <p className="text-sm text-muted-foreground">Pay after job completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Our Services</CardTitle>
            <CardDescription>Choose from our range of cleaning options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Standard Cleaning</Badge>
              <Badge variant="secondary">Deep Cleaning</Badge>
              <Badge variant="secondary">Move In/Out</Badge>
              <Badge variant="secondary">Post Construction</Badge>
              <Badge variant="secondary">Rental Turnover</Badge>
            </div>
          </CardContent>
        </Card>

        {/* CTA Buttons */}
        <div className="space-y-3">
          {user ? (
            <Button 
              onClick={() => navigate("/customer")}
              className="w-full h-12 text-lg"
              size="lg"
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => navigate("/auth")}
                className="w-full h-12 text-lg"
                size="lg"
              >
                Sign In / Sign Up
              </Button>
              <Button 
                onClick={() => navigate("/customer")}
                variant="outline"
                className="w-full h-12 text-lg"
                size="lg"
              >
                Browse as Guest
              </Button>
            </>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12">
              I'm a Cleaner
            </Button>
            <Button variant="outline" className="h-12">
              Admin Portal
            </Button>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By using CleanerConnect, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Index;
