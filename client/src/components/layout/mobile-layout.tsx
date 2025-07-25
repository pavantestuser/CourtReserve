import { ReactNode, useState } from "react";
import { SideDrawer } from "./side-drawer";
import { BottomNavigation } from "./bottom-navigation";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking/booking-modal";
import { Menu, Bell, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
}

export function MobileLayout({ children, title }: MobileLayoutProps) {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Header */}
      <header className="bg-primary text-white px-4 py-3 shadow-lg relative z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-medium">{title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1 relative"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full text-xs"></span>
            </Button>
            <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-900">
                {user ? getUserInitials(user.fullName) : "??"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg bg-orange-500 hover:bg-orange-600"
        onClick={() => setIsBookingModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />

      {/* Overlay for drawer */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
}
