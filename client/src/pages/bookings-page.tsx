import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, DollarSign } from "lucide-react";
import { Booking, Court } from "@shared/schema";

interface BookingWithCourt extends Booking {
  court?: Court;
}

export default function BookingsPage() {
  const { data: bookings, isLoading } = useQuery<BookingWithCourt[]>({
    queryKey: ["/api/bookings"],
  });

  const upcomingBookings = bookings?.filter(booking => {
    const bookingDate = new Date(`${booking.date}T${booking.startTime}`);
    return bookingDate > new Date() && booking.status === "confirmed";
  }) || [];

  const pastBookings = bookings?.filter(booking => {
    const bookingDate = new Date(`${booking.date}T${booking.startTime}`);
    return bookingDate <= new Date() || booking.status === "completed";
  }) || [];

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const BookingCard = ({ booking }: { booking: BookingWithCourt }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">
                {getCourtIcon(booking.court?.type || "")}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {booking.court?.name || "Unknown Court"}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {booking.court?.location}
              </div>
            </div>
          </div>
          {getStatusBadge(booking.status)}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(booking.date)}
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-1" />
            ${booking.totalAmount}
          </div>
          {booking.status === "confirmed" && (
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MobileLayout title="My Bookings">
      <div className="p-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No upcoming bookings</h3>
                  <p className="text-gray-500 mb-4">
                    Book a court to see your upcoming reservations here.
                  </p>
                  <Button>Browse Courts</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : pastBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No past bookings</h3>
                  <p className="text-gray-500">
                    Your completed bookings will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
