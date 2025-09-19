"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collectorService } from '@/lib/collectorService';
import {
  CollectionArea,
  CollectionSchedule,
  CollectionRoute,
  CollectionLog,
  CollectorStats,
  DAYS_OF_WEEK,
  COLLECTION_STATUSES
} from '@/types/collector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, Users, Weight, Route, Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function CollectorUI() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CollectorStats | null>(null);
  const [areas, setAreas] = useState<CollectionArea[]>([]);
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [routes, setRoutes] = useState<CollectionRoute[]>([]);
  const [logs, setLogs] = useState<CollectionLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      loadCollectorData();
    }
  }, [user]);

  const loadCollectorData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [statsResult, areasResult, schedulesResult, routesResult, logsResult] = await Promise.all([
        collectorService.getCollectorStats(user.id),
        collectorService.getCollectorAreas(user.id),
        collectorService.getCollectorSchedules(user.id),
        collectorService.getCollectorRoutes(user.id),
        collectorService.getCollectorLogs(user.id, selectedDate)
      ]);

      if (statsResult.data) setStats(statsResult.data);
      if (areasResult.data) setAreas(areasResult.data);
      if (schedulesResult.data) setSchedules(schedulesResult.data);
      if (routesResult.data) setRoutes(routesResult.data);
      if (logsResult.data) setLogs(logsResult.data);

      // Handle errors
      [statsResult, areasResult, schedulesResult, routesResult, logsResult].forEach(result => {
        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('Error loading collector data:', error);
      toast({
        title: "Error",
        description: "Failed to load collector data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayNumber: number) => DAYS_OF_WEEK[dayNumber] || 'Unknown';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collector Dashboard</h1>
          <p className="text-gray-600">Manage your collection areas and track your progress</p>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Button onClick={loadCollectorData} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Areas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_areas || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_routes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_collections_today || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Households Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_households_today || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight Today</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_weight_today || 0} kg</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="areas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="areas">Collection Areas</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="logs">Collection Logs</TabsTrigger>
        </TabsList>

        {/* Collection Areas Tab */}
        <TabsContent value="areas" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Collection Areas</h2>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas
              .filter(area => 
                area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                area.city.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((area) => (
                <Card key={area.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span>{area.name}</span>
                    </CardTitle>
                    <CardDescription>{area.city}, {area.province}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={area.is_active ? "default" : "secondary"}>
                          {area.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {area.ext_zone_phase && (
                        <div className="text-sm text-gray-600">
                          Zone: {area.ext_zone_phase}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Collection Schedules</h2>
          </div>

          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day, index) => {
              const daySchedules = schedules.filter(s => s.day_of_week === index);
              if (daySchedules.length === 0) return null;

              return (
                <Card key={day}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>{day}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {daySchedules.map((schedule) => {
                        const area = areas.find(a => a.id === schedule.area_id);
                        return (
                          <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">{area?.name || 'Unknown Area'}</div>
                                <div className="text-sm text-gray-600">
                                  {schedule.start_time} - {schedule.end_time}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {schedule.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Collection Routes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <Card key={route.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Route className="h-4 w-4 text-yellow-600" />
                    <span>{route.name}</span>
                  </CardTitle>
                  <CardDescription>
                    {route.area_ids.length} areas • {route.estimated_duration_minutes || 'Unknown'} min
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {route.description && (
                      <p className="text-sm text-gray-600">{route.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={route.is_active ? "default" : "secondary"}>
                        {route.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Collection Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Collection Logs</h2>
            <CreateCollectionLogDialog onLogCreated={loadCollectorData} />
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No collection logs found for this date</p>
                </CardContent>
              </Card>
            ) : (
              logs.map((log) => (
                <Card key={log.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <CardTitle>{log.collection_date}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(log.status)}>
                        {log.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription>
                      {areas.find(a => a.id === log.area_id)?.name || 'Unknown Area'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Households Visited:</span>
                        <div className="font-medium">{log.households_visited}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Households Collected:</span>
                        <div className="font-medium">{log.households_collected}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Weight:</span>
                        <div className="font-medium">{log.total_weight_kg} kg</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <div className="font-medium">
                          {log.start_time && log.end_time ? 
                            `${log.start_time} - ${log.end_time}` : 
                            'Not specified'
                          }
                        </div>
                      </div>
                    </div>
                    {log.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Notes:</span>
                        <p className="text-sm mt-1">{log.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Create Collection Log Dialog Component
function CreateCollectionLogDialog({ onLogCreated }: { onLogCreated: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<CollectionArea[]>([]);
  const [formData, setFormData] = useState({
    area_id: '',
    collection_date: new Date().toISOString().split('T')[0],
    households_visited: 0,
    households_collected: 0,
    total_weight_kg: 0,
    notes: '',
    status: 'completed' as const
  });

  useEffect(() => {
    if (open && user) {
      loadAreas();
    }
  }, [open, user]);

  const loadAreas = async () => {
    if (!user) return;
    const result = await collectorService.getCollectorAreas(user.id);
    if (result.data) {
      setAreas(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const result = await collectorService.createCollectionLog({
        ...formData,
        collector_id: user.id
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Collection log created successfully"
        });
        setOpen(false);
        onLogCreated();
        setFormData({
          area_id: '',
          collection_date: new Date().toISOString().split('T')[0],
          households_visited: 0,
          households_collected: 0,
          total_weight_kg: 0,
          notes: '',
          status: 'completed'
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create collection log",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Log
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Collection Log</DialogTitle>
          <DialogDescription>
            Record your collection activities for the day
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="area">Collection Area</Label>
              <Select
                value={formData.area_id}
                onValueChange={(value) => setFormData({ ...formData, area_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={formData.collection_date}
                onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visited">Households Visited</Label>
              <Input
                type="number"
                value={formData.households_visited}
                onChange={(e) => setFormData({ ...formData, households_visited: parseInt(e.target.value) })}
                min="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="collected">Households Collected</Label>
              <Input
                type="number"
                value={formData.households_collected}
                onChange={(e) => setFormData({ ...formData, households_collected: parseInt(e.target.value) })}
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="weight">Total Weight (kg)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.total_weight_kg}
              onChange={(e) => setFormData({ ...formData, total_weight_kg: parseFloat(e.target.value) })}
              min="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLLECTION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about the collection..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Log"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
