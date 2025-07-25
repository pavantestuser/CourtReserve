import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { CourtManagement } from "@/components/admin/court-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Users, 
  Plus,
  Settings,
  MapPin
} from "lucide-react";
import { useLocation } from "wouter";

interface AdminAnalytics {
  totalBookingsToday: number;
  totalCourts: number;
  activeCourts: number;
  utilizationRate: number;
  courtStats: Array<{
    id: string;
    name: string;
    type: string;
    location: string;
    isActive: boolean;
    todayBookings: number;
    utilization: number;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-admin users
  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: analytics, isLoading } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
  });

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

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return "text-green-600";
    if (utilization >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  return (
    <MobileLayout title="Admin Panel">
      <div className="p-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Admin Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {isLoading ? <Skeleton className="h-8 w-12" /> : analytics?.totalBookingsToday || 0}
                      </p>
                      <p className="text-sm text-gray-600">Today's Bookings</p>
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
                        {isLoading ? <Skeleton className="h-8 w-12" /> : `${analytics?.utilizationRate || 0}%`}
                      </p>
                      <p className="text-sm text-gray-600">Utilization</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button className="flex flex-col items-center space-y-2 h-auto py-4">
                    <Plus className="h-6 w-6" />
                    <span className="text-sm font-medium">Add Court</span>
                  </Button>
                  <Button variant="secondary" className="flex flex-col items-center space-y-2 h-auto py-4">
                    <Settings className="h-6 w-6" />
                    <span className="text-sm font-medium">Manage Slots</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Court Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Court Status</CardTitle>
                  <Button variant="ghost" size="sm">
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics?.courtStats.map((court) => (
                      <div key={court.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{getCourtIcon(court.type)}</span>
                            <div>
                              <h3 className="font-medium text-gray-900">{court.name}</h3>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-3 w-3 mr-1" />
                                {court.location}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(court.isActive)}
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Today's Bookings: <span className="font-medium text-gray-900">{court.todayBookings}/12</span>
                          </span>
                          <span className={`font-medium ${getUtilizationColor(court.utilization)}`}>
                            {court.utilization}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courts">
            <CourtManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Usage Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium text-gray-900 mb-3">Peak Hours Today</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">2:00 PM - 3:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={95} className="w-24 h-2" />
                      <span className="text-sm font-medium text-gray-900">95%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">4:00 PM - 5:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={87} className="w-24 h-2" />
                      <span className="text-sm font-medium text-gray-900">87%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">6:00 PM - 7:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={82} className="w-24 h-2" />
                      <span className="text-sm font-medium text-gray-900">82%</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" className="w-full mt-4">
                  View Full Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.activeCourts || 0}
                      </p>
                      <p className="text-sm text-gray-600">Active Courts</p>
                    </div>
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.totalCourts || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Courts</p>
                    </div>
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
