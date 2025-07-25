import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Trophy, Target, Calendar } from "lucide-react";
import { SportsTracking } from "@shared/schema";

export default function TrackingPage() {
  const { data: trackingData, isLoading } = useQuery<SportsTracking[]>({
    queryKey: ["/api/sports-tracking"],
  });

  // Calculate statistics
  const totalHours = trackingData?.reduce((sum, track) => sum + (track.duration / 60), 0) || 0;
  const totalSessions = trackingData?.length || 0;
  
  const sportStats = trackingData?.reduce((acc, track) => {
    const sport = track.courtType;
    if (!acc[sport]) {
      acc[sport] = { sessions: 0, hours: 0 };
    }
    acc[sport].sessions += 1;
    acc[sport].hours += track.duration / 60;
    return acc;
  }, {} as Record<string, { sessions: number; hours: number }>) || {};

  const favoriteSport = Object.entries(sportStats).sort((a, b) => b[1].hours - a[1].hours)[0];

  // Weekly activity (last 7 days)
  const weeklyData = trackingData?.filter(track => {
    const trackDate = new Date(track.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return trackDate >= weekAgo;
  }) || [];

  const weeklyHours = weeklyData.reduce((sum, track) => sum + (track.duration / 60), 0);

  const getSportIcon = (sport: string) => {
    switch (sport) {
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

  const getSportColor = (sport: string) => {
    switch (sport) {
      case "tennis":
        return "bg-green-100 text-green-800";
      case "basketball":
        return "bg-orange-100 text-orange-800";
      case "football":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <MobileLayout title="Sports Tracking">
      <div className="p-4 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(totalHours)}h
                  </p>
                  <p className="text-sm text-gray-600">Total Hours</p>
                </div>
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalSessions}
                  </p>
                  <p className="text-sm text-gray-600">Sessions</p>
                </div>
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Activity Goal</span>
                <span className="text-sm font-medium">{Math.round(weeklyHours)}/5 hours</span>
              </div>
              <Progress value={(weeklyHours / 5) * 100} className="h-2" />
              <p className="text-xs text-gray-500">
                {weeklyHours >= 5 
                  ? "🎉 Great job! You've reached your weekly goal!" 
                  : `${Math.max(0, 5 - weeklyHours).toFixed(1)} hours to reach your goal`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sports Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sports Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : Object.keys(sportStats).length === 0 ? (
              <div className="text-center py-6">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No sports activity yet</p>
                <p className="text-sm text-gray-400">Book a court to start tracking!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(sportStats)
                  .sort((a, b) => b[1].hours - a[1].hours)
                  .map(([sport, stats]) => (
                    <div key={sport} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getSportIcon(sport)}</span>
                        <div>
                          <h4 className="font-medium capitalize">{sport}</h4>
                          <p className="text-sm text-gray-600">
                            {stats.sessions} sessions • {Math.round(stats.hours * 10) / 10}h total
                          </p>
                        </div>
                      </div>
                      {favoriteSport && favoriteSport[0] === sport && (
                        <Badge className={getSportColor(sport)}>
                          Favorite
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : trackingData?.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trackingData?.slice(0, 5).map((track) => (
                  <div key={track.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getSportIcon(track.courtType)}</span>
                      <div>
                        <p className="font-medium capitalize">{track.courtType}</p>
                        <p className="text-sm text-gray-600">{formatDate(track.date)}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {Math.round(track.duration / 60 * 10) / 10}h
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
