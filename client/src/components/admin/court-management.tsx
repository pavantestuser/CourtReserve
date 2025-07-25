import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourtSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Edit, MapPin, DollarSign, Users } from "lucide-react";
import { Court } from "@shared/schema";

type CourtForm = z.infer<typeof insertCourtSchema>;

export function CourtManagement() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  const { data: courts, isLoading } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const form = useForm<CourtForm>({
    resolver: zodResolver(insertCourtSchema),
    defaultValues: {
      name: "",
      type: "",
      location: "",
      description: "",
      hourlyRate: "",
      capacity: 1,
      isActive: true,
    },
  });

  const createCourtMutation = useMutation({
    mutationFn: async (courtData: CourtForm) => {
      const res = await apiRequest("POST", "/api/courts", courtData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      toast({
        title: "Court created successfully",
        description: "The new court has been added to the system.",
      });
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create court",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCourtMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourtForm> }) => {
      const res = await apiRequest("PUT", `/api/courts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      toast({
        title: "Court updated successfully",
        description: "The court information has been updated.",
      });
      setEditingCourt(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update court",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CourtForm) => {
    if (editingCourt) {
      updateCourtMutation.mutate({ id: editingCourt.id, data });
    } else {
      createCourtMutation.mutate(data);
    }
  };

  const handleEdit = (court: Court) => {
    setEditingCourt(court);
    form.reset({
      name: court.name,
      type: court.type,
      location: court.location,
      description: court.description || "",
      hourlyRate: court.hourlyRate,
      capacity: court.capacity,
      isActive: court.isActive,
    });
    setIsAddModalOpen(true);
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

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Court Management</h2>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCourt(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Court
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourt ? "Edit Court" : "Add New Court"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Court Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g., Tennis Court A"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Sport Type</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value) => form.setValue("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tennis">Tennis</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="badminton">Badminton</SelectItem>
                    <SelectItem value="volleyball">Volleyball</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.type.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  placeholder="e.g., Sports Complex - Level 1"
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  {...form.register("hourlyRate")}
                  placeholder="25.00"
                />
                {form.formState.errors.hourlyRate && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.hourlyRate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...form.register("capacity", { valueAsNumber: true })}
                  placeholder="4"
                />
                {form.formState.errors.capacity && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.capacity.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Court description..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...form.register("isActive")}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createCourtMutation.isPending || updateCourtMutation.isPending}
                >
                  {editingCourt ? "Update" : "Create"} Court
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {courts?.map((court) => (
            <Card key={court.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
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
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(court.isActive)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(court)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    ${court.hourlyRate}/hour
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    Capacity: {court.capacity}
                  </div>
                </div>

                {court.description && (
                  <p className="text-sm text-gray-600 mt-2">{court.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
