"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/Navigation";
import { CollectorDashboardService, type CollectorStats, type RecentPickup, type Township, type CustomerByTownship } from "@/lib/collector-dashboard-service";
import { ResidentService, type Resident } from "@/lib/resident-service";
import { 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign,
  Calendar,
  MapPin,
  Plus,
  Search,
  Loader2,
  X
} from "lucide-react";
import CollectionModal from "@/components/CollectionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CollectorStats | null>(null);
  const [recentPickups, setRecentPickups] = useState<RecentPickup[]>([]);
  const [townships, setTownships] = useState<Township[]>([]);
  const [selectedTownship, setSelectedTownship] = useState<string>("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveCollectionsOpen, setIsLiveCollectionsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollectionFormOpen, setIsCollectionFormOpen] = useState(false);
  const [selectedUserForCollection, setSelectedUserForCollection] = useState<any | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [statsData, pickupsData, townshipsData] = await Promise.all([
        CollectorDashboardService.getCollectorStats(user.id),
        CollectorDashboardService.getRecentPickups(user.id),
        CollectorDashboardService.getTownships()
      ]);
      
      setStats(statsData);
      setRecentPickups(pickupsData);
      setTownships(townshipsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTownshipChange = async (townshipId: string) => {
    setSelectedTownship(townshipId);
    if (townshipId) {
      const residentsData = await ResidentService.getResidentsByTownship(townshipId);
      setResidents(residentsData);
    } else {
      setResidents([]);
    }
  };

  const handleSearchResidents = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const searchResults = await ResidentService.searchResidents(query);
      setResidents(searchResults);
    } else if (selectedTownship) {
      const residentsData = await ResidentService.getResidentsByTownship(selectedTownship);
      setResidents(residentsData);
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get display name for user
  const getUserDisplayName = (user: any) => {
    if (!user) return 'Collector';
    
    // If user.name is not an email (doesn't contain @), use it
    if (user.name && !user.name.includes('@')) {
      return user.name;
    }
    
    // If user.name is an email, try to extract name from email
    if (user.name && user.name.includes('@')) {
      const emailName = user.name.split('@')[0];
      // Convert email name to proper case (e.g., john.doe -> John Doe)
      return emailName
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Final fallback
    return 'Collector';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/W yellow.png" 
              alt="WozaMali Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/W yellow.png" 
              alt="WozaMali Logo" 
              className="h-16 w-auto"
            />
          </div>
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
            <p className="text-gray-300">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/W yellow.png" 
                alt="WozaMali Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">WozaMali Collector Portal</h1>
                <p className="text-gray-400">Welcome back, {getUserDisplayName(user)}!</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            <span className="text-gray-300 text-sm">
              {user?.area_id || "Area not assigned"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Today's Pickups</p>
                  <p className="text-2xl font-bold text-white">{stats.todayPickups}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Customers</p>
                  <p className="text-2xl font-bold text-white">{stats.totalCustomers}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Weight (kg)</p>
                  <p className="text-2xl font-bold text-white">{stats.totalWeight || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">Start a new collection or manage existing ones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => setIsCollectionFormOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
              <Dialog open={isLiveCollectionsOpen} onOpenChange={setIsLiveCollectionsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    <Search className="h-4 w-4 mr-2" />
                    Live Collections
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Live Collections - Select Resident</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Search for residents by township or name to start collections
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 overflow-y-auto max-h-[60vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Select Township</label>
                        <Select value={selectedTownship} onValueChange={handleTownshipChange}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Choose a township" />
                          </SelectTrigger>
                        <SelectContent className="bg-gray-800/95 backdrop-blur-md border-gray-600">
                          {townships.map((township) => (
                            <SelectItem key={township.id} value={township.id} className="text-white hover:bg-gray-700">
                              {township.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Search Residents</label>
                        <Input
                          placeholder="Search by name, phone, or email..."
                          value={searchQuery}
                          onChange={(e) => handleSearchResidents(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    {residents.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-white font-medium">Residents ({residents.length})</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {residents.map((resident) => (
                            <div
                              key={resident.id}
                              className="p-3 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="text-white font-medium">{resident.name}</h4>
                                  <p className="text-gray-300 text-sm">
                                    {resident.phone && `📞 ${resident.phone}`}
                                    {resident.email && ` • ✉️ ${resident.email}`}
                                  </p>
                                  <p className="text-gray-400 text-sm mt-1">
                                    📍 {resident.township}
                                  </p>
                                  <p className={`text-sm mt-1 ${resident.hasAddress ? 'text-green-400' : 'text-red-400'}`}>
                                    {resident.hasAddress ? `📍 ${resident.address}` : '⚠️ No address on file'}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {resident.hasAddress ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                      Has Address
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                      No Address
                                    </span>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      console.log('🔄 Collect button clicked for resident:', resident.id, resident.name);
                                      setIsLiveCollectionsOpen(false);
                                      setIsCollectionFormOpen(true);
                                      setSelectedUserForCollection({
                                        id: resident.id,
                                        full_name: resident.name,
                                        email: resident.email || "",
                                        phone: resident.phone || "",
                                        street_addr: resident.address || "",
                                        city: "",
                                        postal_code: "",
                                        township_id: resident.area_id || ""
                                      });
                                      console.log('✅ Collection form modal should be opening...');
                                    }}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Collect
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {residents.length === 0 && (selectedTownship || searchQuery) && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No residents found</p>
                        <p className="text-gray-500 text-sm">
                          {searchQuery ? 'Try a different search term' : 'No residents in this township'}
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Recent Pickups */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Pickups</CardTitle>
                <CardDescription className="text-gray-400">Your latest collection activities</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadDashboardData}
                className="flex items-center space-x-2 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                <Package className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentPickups.length > 0 ? (
              <div className="space-y-3">
                {recentPickups.map((pickup) => (
                  <div key={pickup.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-orange-500" />
                        <p className="text-white font-medium">{pickup.customer_name}</p>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{pickup.customer_address}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <p className="text-gray-500 text-xs flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {pickup.scheduled_date} {pickup.scheduled_time && `at ${formatTime(pickup.scheduled_time)}`}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Code: {pickup.pickup_code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pickup.status)}`}>
                        {pickup.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {pickup.total_value && (
                        <p className="text-green-400 text-sm mt-1 font-medium">R{pickup.total_value.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
                {recentPickups.length >= 5 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-gray-400 hover:text-white border-gray-600 hover:bg-gray-700"
                    >
                      View All Pickups
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No recent pickups found</p>
                <p className="text-gray-500 text-sm mb-4">Start collecting to see your activities here</p>
                <Button 
                  onClick={() => setIsCollectionFormOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start Collection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unified Users-page Collection Modal */}
      {isCollectionFormOpen && (
        <CollectionModal
          isOpen={isCollectionFormOpen}
          onClose={() => {
            console.log('❌ Collection modal closed');
            setIsCollectionFormOpen(false);
            setSelectedUserForCollection(null);
          }}
          user={selectedUserForCollection}
          onSuccess={() => {
            console.log('✅ Collection created successfully');
            setIsCollectionFormOpen(false);
            setSelectedUserForCollection(null);
            loadDashboardData();
          }}
        />
      )}

      {/* Navigation */}
      <Navigation />
    </div>
  );
}