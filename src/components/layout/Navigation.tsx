import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Home, 
  Calendar, 
  CreditCard, 
  User, 
  Settings, 
  Users, 
  BarChart, 
  Menu,
  LogOut,
  Sparkles,
  MessageSquare,
  Star,
  Search
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const { userRole, loading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || loading) return null;

  const getNavigationItems = () => {
    const baseItems = [
      { icon: Home, label: "Dashboard", path: `/${userRole}` },
      { icon: MessageSquare, label: "Messages", path: `/${userRole}/messages` },
    ];

    switch (userRole) {
      case 'customer':
        return [
          ...baseItems,
          { icon: Calendar, label: "My Bookings", path: "/customer/bookings" },
          { icon: Search, label: "Find Cleaners", path: "/customer/search" },
          { icon: Star, label: "Reviews", path: "/customer/reviews" },
          { icon: CreditCard, label: "Payment", path: "/customer/payment" },
          { icon: User, label: "Profile", path: "/customer/profile" },
        ];
      case 'cleaner':
        return [
          ...baseItems,
          { icon: Calendar, label: "My Jobs", path: "/cleaner/jobs" },
          { icon: BarChart, label: "Earnings", path: "/cleaner/earnings" },
          { icon: User, label: "Profile", path: "/cleaner/profile" },
          { icon: Settings, label: "Settings", path: "/cleaner/settings" },
        ];
      case 'admin':
        return [
          ...baseItems,
          { icon: Users, label: "User Management", path: "/admin/users" },
          { icon: CreditCard, label: "Payments", path: "/admin/payments" },
          { icon: BarChart, label: "Analytics", path: "/admin/analytics" },
          { icon: Settings, label: "Platform Settings", path: "/admin/settings" },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-2 p-4 border-b">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-semibold">CleanerConnect</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {userRole}
            </Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate(item.path)}
            >
              <Icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        <div className="text-sm text-muted-foreground">
          {user.email}
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>Navigate through the application</SheetDescription>
        </SheetHeader>
        <NavContent />
      </SheetContent>
    </Sheet>
  );
};