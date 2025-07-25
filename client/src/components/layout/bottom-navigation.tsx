import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  User 
} from "lucide-react";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    {
      path: "/",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/bookings",
      icon: Calendar,
      label: "Bookings",
    },
    {
      path: "/tracking",
      icon: BarChart3,
      label: "Tracking",
    },
    {
      path: "/profile",
      icon: User,
      label: "Profile",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={`flex flex-col items-center justify-center space-y-1 h-full rounded-none ${
                active ? "text-primary" : "text-gray-400"
              }`}
              onClick={() => setLocation(item.path)}
            >
              <Icon className="h-5 w-5" />
              <span className={`text-xs ${active ? "font-medium" : ""}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
