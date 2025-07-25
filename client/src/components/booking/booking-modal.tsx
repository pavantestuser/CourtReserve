import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, MapPin, DollarSign } from "lucide-react";
import { Court, TimeSlot } from "@shared/schema";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourt?: Court;
}

export function BookingModal({ isOpen, onClose, selectedCourt }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  const { data: courts, isLoading: courtsLoading } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
    enabled: !selectedCourt,
  });

  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery<TimeSlot[]>({
    queryKey: ["/api/courts", selectedCourt?.id || courts?.[0]?.id, "timeslots"],
    queryParams: { date: selectedDate },
    enabled: !!(selectedCourt?.id || courts?.[0]?.id) && !!selectedDate,
  });

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const res = await apiRequest("POST", "/api/bookings", bookingData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sports-tracking"] });
      toast({
        title: "Booking confirmed!",
        description: "Your court has been successfully booked.",
      });
      onClose();
      setSelectedTimeSlot(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentCourt = selectedCourt || courts?.[0];

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (slot.isAvailable) {
      setSelectedTimeSlot(slot);
    }
  };

  const handleConfirmBooking = () => {
    if (!currentCourt || !selectedTimeSlot || !user) {
      toast({
        title: "Error",
        description: "Please select a court and time slot.",
        variant: "destructive",
      });
      return;
    }

    // Calculate total amount (assuming hourly rate)
    const startTime = new Date(`${selectedDate}T${selectedTimeSlot.startTime}`);
    const endTime = new Date(`${selectedDate}T${selectedTimeSlot.endTime}`);
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const totalAmount = (parseFloat(currentCourt.hourlyRate) * hours).toFixed(2);

    bookingMutation.mutate({
      courtId: currentCourt.id,
      timeSlotId: selectedTimeSlot.id,
      date: selectedDate,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      totalAmount,
    });
  };

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

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const generateTimeSlots = () => {
    // Generate default time slots if none exist
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      slots.push({
        id: `slot-${hour}`,
        courtId: currentCourt?.id || '',
        date: selectedDate,
        startTime,
        endTime,
        isAvailable: Math.random() > 0.3, // Randomly available for demo
        createdAt: new Date(),
      });
    }
    return slots;
  };

  const displayTimeSlots = timeSlots?.length ? timeSlots : generateTimeSlots();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Book Court</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Court Info */}
          {currentCourt && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">
                      {getCourtIcon(currentCourt.type)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {currentCourt.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {currentCourt.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${currentCourt.hourlyRate}/hour
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Date Selection */}
          <div>
            <Label htmlFor="booking-date" className="text-sm font-medium text-gray-700 mb-2 block">
              Select Date
            </Label>
            <Input
              id="booking-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>

          {/* Time Slots */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Available Time Slots
            </Label>
            {timeSlotsLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {displayTimeSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={selectedTimeSlot?.id === slot.id ? "default" : "outline"}
                    className={`p-3 h-auto flex flex-col ${
                      !slot.isAvailable 
                        ? "opacity-50 cursor-not-allowed bg-red-50 text-red-600" 
                        : ""
                    }`}
                    onClick={() => handleTimeSlotSelect(slot)}
                    disabled={!slot.isAvailable}
                  >
                    <div className="font-medium text-sm">
                      {formatTime(slot.startTime)}
                    </div>
                    <div className="text-xs opacity-75">
                      {slot.isAvailable ? "1 hour" : "Booked"}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Booking Summary */}
          {selectedTimeSlot && currentCourt && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Court:</span>
                    <span className="text-gray-900">{currentCourt.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="text-gray-900">
                      {new Date(selectedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="text-gray-900">
                      {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-medium">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">${currentCourt.hourlyRate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleConfirmBooking}
              disabled={!selectedTimeSlot || bookingMutation.isPending}
            >
              {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
