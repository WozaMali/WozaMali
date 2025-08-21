import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Plus, Users, Truck, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock collection schedule data
const mockSchedules = [
  {
    id: "COL001",
    date: "2024-03-20",
    time: "09:00",
    area: "Johannesburg North",
    maxBookings: 25,
    currentBookings: 18,
    status: "Open",
    collectorName: "Green Route Team A"
  },
  {
    id: "COL002", 
    date: "2024-03-20",
    time: "14:00",
    area: "Sandton CBD", 
    maxBookings: 30,
    currentBookings: 30,
    status: "Full",
    collectorName: "Green Route Team B"
  },
  {
    id: "COL003",
    date: "2024-03-22",
    time: "08:30", 
    area: "Randburg",
    maxBookings: 20,
    currentBookings: 12,
    status: "Open",
    collectorName: "Green Route Team A"
  },
  {
    id: "COL004",
    date: "2024-03-22",
    time: "13:00",
    area: "Rosebank",
    maxBookings: 25,
    currentBookings: 8,
    status: "Open", 
    collectorName: "Green Route Team C"
  },
  {
    id: "COL005",
    date: "2024-03-25",
    time: "10:00",
    area: "Midrand",
    maxBookings: 15,
    currentBookings: 0,
    status: "Scheduled",
    collectorName: "Green Route Team B"
  }
];

const mockBookings = [
  { userId: "USR001", userName: "Sarah Johnson", scheduleId: "COL001", phone: "+27 82 123 4567" },
  { userId: "USR002", userName: "Michael Chen", scheduleId: "COL001", phone: "+27 71 987 6543" },
  { userId: "USR003", userName: "Nomsa Mthembu", scheduleId: "COL002", phone: "+27 83 555 7890" }
];

const AdminCollections = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    area: "",
    maxBookings: "",
    collectorName: ""
  });
  const { toast } = useToast();

  const scheduleStats = {
    totalSchedules: mockSchedules.length,
    openSlots: mockSchedules.filter(s => s.status === 'Open').length,
    fullSlots: mockSchedules.filter(s => s.status === 'Full').length,
    totalBookings: mockSchedules.reduce((sum, s) => sum + s.currentBookings, 0),
    availableCapacity: mockSchedules.reduce((sum, s) => sum + (s.maxBookings - s.currentBookings), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-success text-success-foreground';
      case 'Full': return 'bg-warning text-warning-foreground';
      case 'Scheduled': return 'bg-info text-info-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleCreateSchedule = () => {
    toast({
      title: "Collection Scheduled",
      description: `New collection slot for ${formData.area} has been created successfully.`,
    });
    setIsCreateScheduleOpen(false);
    setFormData({ date: "", time: "", area: "", maxBookings: "", collectorName: "" });
  };

  const getBookingProgress = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    return Math.round(percentage);
  };

  return (
    <AdminLayout currentPage="collections">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{scheduleStats.totalSchedules}</div>
              <p className="text-sm text-muted-foreground">Total Schedules</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-foreground">{scheduleStats.openSlots}</div>
                <p className="text-sm text-muted-foreground">Open Slots</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">{scheduleStats.totalBookings}</div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{scheduleStats.availableCapacity}</div>
              <p className="text-sm text-muted-foreground">Available Capacity</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Collection Calendar</CardTitle>
              <CardDescription>
                Select a date to view scheduled collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
              
              {selectedDate && (
                <div className="mt-4 p-3 bg-secondary rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {selectedDate.toDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mockSchedules.filter(s => 
                      new Date(s.date).toDateString() === selectedDate.toDateString()
                    ).length} collections scheduled
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Collection Schedules */}
          <Card className="lg:col-span-2 shadow-elegant">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Collection Schedules</CardTitle>
                  <CardDescription>
                    Manage pickup schedules and monitor booking capacity
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreateScheduleOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Schedules Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Collector</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center space-x-1">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(schedule.date).toLocaleDateString()}</span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{schedule.time}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{schedule.area}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{schedule.currentBookings}/{schedule.maxBookings}</span>
                              <span>{getBookingProgress(schedule.currentBookings, schedule.maxBookings)}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getBookingProgress(schedule.currentBookings, schedule.maxBookings)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(schedule.status)} w-fit`}>
                            {schedule.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{schedule.collectorName}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>
              Latest collection slot bookings from community members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockBookings.map((booking, index) => {
                const schedule = mockSchedules.find(s => s.id === booking.scheduleId);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{booking.userName}</p>
                        <p className="text-sm text-muted-foreground">{booking.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {schedule?.area} - {new Date(schedule?.date || '').toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{schedule?.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Create Schedule Dialog */}
        <Dialog open={isCreateScheduleOpen} onOpenChange={setIsCreateScheduleOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Collection Schedule</DialogTitle>
              <DialogDescription>
                Add a new recycling pickup slot for community members
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="scheduleDate">Collection Date</Label>
                <Input
                  id="scheduleDate"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="scheduleTime">Collection Time</Label>
                <Input
                  id="scheduleTime"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="area">Collection Area</Label>
                <Select value={formData.area} onValueChange={(value) => setFormData({...formData, area: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="johannesburg-north">Johannesburg North</SelectItem>
                    <SelectItem value="sandton-cbd">Sandton CBD</SelectItem>
                    <SelectItem value="randburg">Randburg</SelectItem>
                    <SelectItem value="rosebank">Rosebank</SelectItem>
                    <SelectItem value="midrand">Midrand</SelectItem>
                    <SelectItem value="fourways">Fourways</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxBookings">Maximum Bookings</Label>
                <Input
                  id="maxBookings"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxBookings}
                  onChange={(e) => setFormData({...formData, maxBookings: e.target.value})}
                  placeholder="25"
                />
              </div>

              <div>
                <Label htmlFor="collectorName">Collection Team</Label>
                <Select value={formData.collectorName} onValueChange={(value) => setFormData({...formData, collectorName: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green-route-a">Green Route Team A</SelectItem>
                    <SelectItem value="green-route-b">Green Route Team B</SelectItem>
                    <SelectItem value="green-route-c">Green Route Team C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateScheduleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule}>
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCollections;