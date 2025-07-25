import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { CourtCard } from "@/components/courts/court-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, TrendingUp, Star } from "lucide-react";
import { Court, Booking } from "@shared/schema";

interface BookingWithCourt extends Booking {
  court?: Court;
}

export default function HomePage() {
  const { user } = useAuth();

  const { data: courts, isLoading: courtsLoading } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithCourt[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: sportsTracking } = useQuery({
    queryKey: ["/api/sports-tracking"],
  });

  const upcomingBookings = bookings?.filter(booking => {
    const bookingDate = new Date(`${booking.date}T${booking.startTime}`);
    return bookingDate > new Date() && booking.status === "confirmed";
  }) || [];

  const recentBookings = bookings?.slice(0, 3) || [];

  // Calculate weekly hours from sports tracking
  const weeklyHours = sportsTracking?.reduce((total: number, track: any) => {
    const trackDate = new Date(track.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (trackDate >= weekAgo) {
      return total + (track.duration / 60); // Convert minutes to hours
    }
    return total;
  }, 0) || 0;

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

  return (
    <MobileLayout title="SportsFacility">
      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {upcomingBookings.length}
                  </p>
                  <p className="text-sm text-gray-600">Upcoming</p>
                </div>
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(weeklyHours)}h
                  </p>
                  <p className="text-sm text-gray-600">This Week</p>
                </div>
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Courts Today */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Available Courts Today</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </div>

          {courtsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {courts?.slice(0, 3).map((court) => (
                <CourtCard key={court.id} court={court} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Bookings */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h2>
          
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No bookings yet</p>
                <p className="text-sm text-gray-400">Book your first court to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">
                            {getCourtIcon(booking.court?.type || "")}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {booking.court?.name || "Unknown Court"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {booking.date}, {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {user?.role === "admin" && (
          <section>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Admin Panel</h3>
                    <p className="text-sm text-gray-600">
                      Manage courts, view analytics, and monitor bookings
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <Button className="w-full mt-4">
                  Go to Admin Dashboard
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </MobileLayout>
  );
}
