import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingModal } from "@/components/booking/booking-modal";
import { MapPin } from "lucide-react";
import { Court } from "@shared/schema";

interface CourtCardProps {
  court: Court;
}

export function CourtCard({ court }: CourtCardProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const getCourtIcon = (type: string) => {
    switch (type) {
      case "tennis":
        return "🎾";
      case "basketball":
        return "🏀";
      case "football":
        return "⚽";
      default:
        return "🏟️";
    }
  };

  const getCourtColor = (type: string) => {
    switch (type) {
      case "tennis":
        return "bg-green-500";
      case "basketball":
        return "bg-orange-500";
      case "football":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Generate some available slots for display (in a real app, this would come from the API)
  const availableSlots = ["2:00 PM", "3:00 PM", "4:00 PM"];

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${getCourtColor(court.type)} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xl">
                  {getCourtIcon(court.type)}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{court.name}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {court.location}
                </div>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {availableSlots.length} slots
            </Badge>
          </div>

          {/* Next Available Slots */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Next available:</p>
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((time, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-blue-50"
                  onClick={() => setIsBookingModalOpen(true)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                ${court.hourlyRate}/hour
              </span>
              <Button 
                size="sm"
                onClick={() => setIsBookingModalOpen(true)}
              >
                Book Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedCourt={court}
      />
    </>
  );
}
