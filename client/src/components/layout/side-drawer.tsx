import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Settings,
  Users,
  TrendingUp,
  LogOut,
  User
} from "lucide-react";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  return (
    <div
      className={`fixed top-0 left-0 w-64 h-full bg-white z-40 shadow-lg transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* User Profile Section */}
      <div className="p-4 bg-primary text-white">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-300 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-blue-900">
              {user ? getUserInitials(user.fullName) : "??"}
            </span>
          </div>
          <div>
            <h3 className="font-medium">{user?.fullName || "User"}</h3>
            <p className="text-sm opacity-90 capitalize">{user?.role || "Student"}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="py-4">
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-gray-700 hover:bg-gray-100"
          onClick={() => handleNavigation("/")}
        >
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Dashboard
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-gray-700 hover:bg-gray-100"
          onClick={() => handleNavigation("/bookings")}
        >
          <Calendar className="mr-3 h-5 w-5" />
          My Bookings
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-gray-700 hover:bg-gray-100"
          onClick={() => handleNavigation("/tracking")}
        >
          <BarChart3 className="mr-3 h-5 w-5" />
          Sports Tracking
        </Button>

        {user?.role === "admin" && (
          <>
            <Separator className="my-4" />
            <p className="px-4 text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
              Admin Panel
            </p>
            
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-gray-700 hover:bg-gray-100"
              onClick={() => handleNavigation("/admin")}
            >
              <Settings className="mr-3 h-5 w-5" />
              Admin Dashboard
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <Users className="mr-3 h-5 w-5" />
              Manage Courts
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <TrendingUp className="mr-3 h-5 w-5" />
              Analytics
            </Button>
          </>
        )}

        <Separator className="my-4" />
        
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-gray-700 hover:bg-gray-100"
        >
          <User className="mr-3 h-5 w-5" />
          Profile
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-gray-700 hover:bg-gray-100"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </nav>
    </div>
  );
}
