import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  MapPin, 
  Search, 
  Plus, 
  History, 
  Camera, 
  Scale,
  Recycle,
  CheckCircle,
  Clock,
  AlertCircle,
  Route,
  User,
  Calendar,
  Package,
  TrendingUp,
  Target,
  Award,
  Users,
  BarChart3,
  Zap,
  Leaf,
  X,
  Image as ImageIcon,
  RefreshCw,
  LogOut
} from "lucide-react";
import { MaterialType, calculateTransactionTotals, formatCurrency, formatWeight, formatPoints } from "@/lib/recycling-schema";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { pickupServices, materialServices, pickupItemServices, dashboardServices, enhancedPickupServices } from "@/lib/supabase-services";
import { useCustomerManagement } from "@/hooks/use-customer-management";
import type { CollectorDashboardView, Material, ProfileWithAddresses } from "@/lib/supabase";

// Updated interfaces to match Supabase schema
interface PickupLocation {
  pickup_id: string;
  status: string;
  started_at: string;
  submitted_at?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  line1?: string;
  suburb?: string;
  city?: string;
  postal_code?: string;
  total_kg: number;
  total_value: number;
  total_points: number;
  materials_breakdown: Array<{
    material_name: string;
    weight_kg: number;
    rate_per_kg: number;
    value: number;
    points: number;
  }>;
}

interface PickupHistory {
  pickup_id: string;
  status: string;
  started_at: string;
  submitted_at?: string;
  customer_name?: string;
  line1?: string;
  suburb?: string;
  city?: string;
  total_kg: number;
  total_value: number;
  total_points: number;
  materials_breakdown: Array<{
    material_name: string;
    weight_kg: number;
    rate_per_kg: number;
    value: number;
    points: number;
  }>;
}

interface NewPickupForm {
  customerName: string;
  address: string;
  phone?: string;
  email?: string;
  materials: Array<{
    material_id: string;
    kilograms: number;
    photos: string[];
  }>;
  notes: string;
}

interface MaterialPhoto {
  material_id: string;
  kilograms: number;
  photos: string[];
}

// Real data will be calculated from Supabase data

// Real data will be fetched from Supabase

// Real data will be fetched from Supabase

export default function CollectorDashboard() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { 
    customers, 
    statistics, 
    loading: customersLoading, 
    error: customersError,
    getCustomerProfilesWithAddresses,
    searchCustomers,
    getCustomersByAddressStatus,
    getCustomersReadyForFirstCollection 
  } = useCustomerManagement();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<PickupLocation | null>(null);
  const [newPickup, setNewPickup] = useState<NewPickupForm>({
    customerName: '',
    address: '',
    materials: [],
    notes: ''
  });

  const [newMaterial, setNewMaterial] = useState<{ type: string; kg: number }>({
    type: '',
    kg: 0
  });

  const [currentMaterialPhotos, setCurrentMaterialPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<'scale' | 'materials' | 'material'>('scale');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real data from Supabase
  const [realCollectorData, setRealCollectorData] = useState<CollectorDashboardView[]>([]);
  const [realMaterials, setRealMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch collector dashboard data
        const collectorData = await dashboardServices.getCollectorDashboard();
        setRealCollectorData(collectorData);
        
        // Fetch available materials
        const materials = await materialServices.getActiveMaterials();
        setRealMaterials(materials);
        
      } catch (error) {
        console.error('Error fetching collector data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Get all customers
  useEffect(() => {
    getCustomerProfilesWithAddresses();
  }, [getCustomerProfilesWithAddresses]);

  // Search customers
  const handleSearch = (searchTerm: string) => {
    searchCustomers({ search_term: searchTerm });
  };

  // Get customers ready for first collection
  const getNewCustomersReady = () => {
    getCustomersReadyForFirstCollection();
  };

  // Combine existing pickups with all customer profiles for comprehensive view
  const allPotentialStops = [
    // Existing pickups (assigned stops)
    ...realCollectorData.map(pickup => ({
      type: 'pickup' as const,
      data: pickup,
      customer_name: pickup.customer_name || 'Unknown Customer',
      line1: pickup.line1 || 'No Address',
      suburb: pickup.suburb || 'No Suburb',
      city: pickup.city || 'No City',
      status: pickup.status,
      hasPickup: true
    })),
    // Customer profiles without pickups (potential stops)
    ...customers
      .filter(profile => !realCollectorData.some(pickup => pickup.customer_email === profile.email))
      .map(profile => ({
        type: 'profile' as const,
        data: profile,
        customer_name: profile.full_name || profile.email?.split('@')[0] || 'Unknown Customer',
        line1: profile.addresses?.[0]?.line1 || 'No Address',
        suburb: profile.addresses?.[0]?.suburb || 'No Suburb',
        city: profile.addresses?.[0]?.city || 'No City',
        status: 'potential',
        hasPickup: false
      }))
  ];

  // Use filtered customers from the hook for search results
  const filteredStops = searchQuery ? 
    // If searching, use the hook's filtered customers
    customers
      .filter(profile => !realCollectorData.some(pickup => pickup.customer_email === profile.email))
      .map(profile => ({
        type: 'profile' as const,
        data: profile,
        customer_name: profile.full_name || profile.email?.split('@')[0] || 'Unknown Customer',
        line1: profile.addresses?.[0]?.line1 || 'No Address',
        suburb: profile.addresses?.[0]?.suburb || 'No Suburb',
        city: profile.addresses?.[0]?.city || 'No City',
        status: 'potential',
        hasPickup: false
      }))
    : 
    // If not searching, show all potential stops
    allPotentialStops;

  // Use real data for pickup history
  const pickupHistory = realCollectorData;

  // Calculate real-time metrics from Supabase data
  const realTimeMetrics = {
    personal: {
      totalCollections: realCollectorData.length,
      totalKgCollected: realCollectorData.reduce((sum, pickup) => sum + pickup.total_kg, 0),
      totalPoints: realCollectorData.reduce((sum, pickup) => sum + pickup.total_points, 0),
      totalEarnings: realCollectorData.reduce((sum, pickup) => sum + pickup.total_value, 0),
      streak: 0, // Would need to calculate from actual pickup dates
      rank: 0, // Would need to compare with other collectors
      monthlyGoal: 85, // Could be configurable
      weeklyProgress: 67 // Could be calculated from weekly data
    },
    team: {
      totalCollectors: 0, // Would need to fetch from profiles table
      teamTotalKg: realCollectorData.reduce((sum, pickup) => sum + pickup.total_kg, 0),
      teamTotalPoints: realCollectorData.reduce((sum, pickup) => sum + pickup.total_points, 0),
      teamTotalEarnings: realCollectorData.reduce((sum, pickup) => sum + pickup.total_value, 0),
      teamRank: 0, // Would need to compare with other teams
      topCollector: "N/A", // Would need to fetch from profiles table
      topCollectorKg: 0, // Would need to calculate from profiles
      averagePerCollector: 0 // Would need to calculate from profiles
    },
    environmental: {
      co2Saved: realCollectorData.reduce((sum, pickup) => sum + (pickup.total_kg * 2.5), 0),
      waterSaved: realCollectorData.reduce((sum, pickup) => sum + (pickup.total_kg * 100), 0),
      landfillSaved: realCollectorData.reduce((sum, pickup) => sum + (pickup.total_kg * 0.8), 0),
      treesEquivalent: Math.floor(realCollectorData.reduce((sum, pickup) => sum + pickup.total_kg, 0) / 50)
    }
  };

  // Calculate totals for new pickup
  const pickupCalculation = calculateTransactionTotals(
    newPickup.materials.map(m => ({ type: m.material_id as MaterialType, kg: m.kilograms }))
  );

  const handleCustomerSelect = (stop: any) => {
    if (stop.type === 'pickup') {
      // Handle existing pickup
      setSelectedCustomer({
        pickup_id: stop.data.pickup_id,
        status: stop.data.status,
        started_at: stop.data.started_at,
        customer_name: stop.data.customer_name || '',
        customer_email: stop.data.customer_email || '',
        customer_phone: stop.data.customer_phone || '',
        line1: stop.data.line1 || '',
        suburb: stop.data.suburb || '',
        city: stop.data.city || '',
        total_kg: stop.data.total_kg,
        total_value: stop.data.total_value,
        total_points: stop.data.total_points,
        materials_breakdown: stop.data.materials_breakdown || []
      });
    } else {
      // Handle customer profile
      setSelectedCustomer({
        pickup_id: `profile-${stop.data.id}`,
        status: 'potential',
        started_at: new Date().toISOString(),
        customer_name: stop.data.full_name || stop.data.email?.split('@')[0] || '',
        customer_email: stop.data.email || '',
        customer_phone: stop.data.phone || '',
        line1: stop.data.addresses?.[0]?.line1 || '',
        suburb: stop.data.addresses?.[0]?.suburb || '',
        city: stop.data.addresses?.[0]?.city || '',
        total_kg: 0,
        total_value: 0,
        total_points: 0,
        materials_breakdown: []
      });
    }
    
    setNewPickup(prev => ({
      ...prev,
      customerName: stop.customer_name || '',
      address: `${stop.line1}, ${stop.suburb}, ${stop.city}`,
      phone: stop.type === 'pickup' ? stop.data.customer_phone || '' : stop.data.phone || '',
      email: stop.type === 'pickup' ? stop.data.customer_email || '' : stop.data.email || ''
    }));
    setActiveTab('new-pickup');
  };

  const handleAddMaterial = () => {
    if (newMaterial.kg > 0 && currentMaterialPhotos.length > 0) {
      setNewPickup(prev => ({
        ...prev,
        materials: [...prev.materials, { 
          material_id: newMaterial.type, 
          kilograms: newMaterial.kg,
          photos: [...currentMaterialPhotos]
        }]
      }));
      setNewMaterial({ type: '', kg: 0 });
      setCurrentMaterialPhotos([]);
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setNewPickup(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPhotos.push(e.target.result as string);
            if (newPhotos.length === files.length) {
              setCurrentMaterialPhotos(prev => [...prev, ...newPhotos]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const openCamera = (type: 'scale' | 'materials' | 'material') => {
    setCurrentPhotoType(type);
    setIsCameraOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removePhoto = (photoIndex: number) => {
    setCurrentMaterialPhotos(prev => prev.filter((_, i) => i !== photoIndex));
  };

  const handleSubmitPickup = async () => {
    if (!user) return;

    try {
      // Create pickup in Supabase
      const pickupData = {
        collector_id: user.id,
        collector_name: user.email?.split('@')[0] || 'Unknown Collector',
        customer_name: newPickup.customerName || selectedCustomer?.customer_name || '',
        customer_phone: selectedCustomer?.customer_phone || null,
        customer_email: selectedCustomer?.customer_email || null,
        address: newPickup.address || selectedCustomer?.line1 || '',
        notes: newPickup.notes || null
      };

      // Add required fields to match Omit<Pickup, "id" | "started_at">
      const pickupDataWithRequiredFields = {
        ...pickupData,
        customer_id: selectedCustomer?.pickup_id || null, // Assuming pickup_id is the customer_id for now
        address_id: null, // Will need to be set based on actual address data
        status: 'submitted' as const
      };

      const newPickupRecord = await pickupServices.createPickup(pickupDataWithRequiredFields);
      
      if (newPickupRecord) {
        // Add materials to the pickup
        const materialsData = newPickup.materials.map(material => ({
          pickup_id: newPickupRecord.id,
          material_id: material.material_id, // Assuming material.material_id contains the material ID
          kilograms: material.kilograms,
          contamination_pct: 0 // Default to 0% contamination
        }));

        await pickupItemServices.addPickupItems(newPickupRecord.id, materialsData);
        
        // Now finalize the pickup using the new function
        const finalizedPickup = await enhancedPickupServices.finalizePickup(newPickupRecord.id);
        
        if (finalizedPickup) {
          alert('Pickup finalized successfully! Admin will review and approve.');
          // Reset form
          setNewPickup({
            customerName: '',
            address: '',
            phone: '',
            email: '',
            materials: [],
            notes: ''
          });
          setSelectedCustomer(null);
          setActiveTab('dashboard');
        } else {
          alert('Error finalizing pickup. Please ensure you have at least 2 photos.');
        }
      } else {
        alert('Error submitting pickup. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting pickup:', error);
      alert('Error submitting pickup. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Show loading spinner while fetching data
  if (isLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error if customer profiles failed to load
  if (customersError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Customers</h2>
          <p className="text-muted-foreground mb-4">{customersError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12">
                <img 
                  src={theme === 'dark' ? '/w white.png' : '/w yellow.png'} 
                  alt="Woza Mali Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Collector Dashboard</h1>
                <p className="text-sm text-muted-foreground">COL-001 • John Smith</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Target className="h-4 w-4 mr-1" />
                Rank #{realTimeMetrics.personal.rank}
              </Badge>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <Zap className="h-4 w-4 mr-1" />
                {realTimeMetrics.personal.streak} Day Streak
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logout()}
                className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading collector data...</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="route" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Route & Search
            </TabsTrigger>
            <TabsTrigger value="new-pickup" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Pickup
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Personal Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Collections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{realTimeMetrics.personal.totalCollections}</div>
                  <p className="text-xs opacity-90 mt-1">This month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-success text-success-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Kg Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatWeight(realTimeMetrics.personal.totalKgCollected)}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-accent text-accent-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatPoints(realTimeMetrics.personal.totalPoints)}</div>
                  <p className="text-xs opacity-90 mt-1">Earned this month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-warm text-warm-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(realTimeMetrics.personal.totalEarnings)}</div>
                  <p className="text-xs opacity-90 mt-1">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress and Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Monthly Goal Progress
                  </CardTitle>
                  <CardDescription>Track your monthly collection targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weight Goal</span>
                                              <span>{realTimeMetrics.personal.monthlyGoal}%</span>
                      </div>
                      <Progress value={realTimeMetrics.personal.monthlyGoal} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weekly Progress</span>
                                              <span>{realTimeMetrics.personal.weeklyProgress}%</span>
                      </div>
                      <Progress value={realTimeMetrics.personal.weeklyProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-success" />
                    Achievements
                  </CardTitle>
                  <CardDescription>Your recycling milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <div className="font-medium text-success">100+ Collections</div>
                      <div className="text-sm text-muted-foreground">Completed milestone</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-primary">Top 3 Rank</div>
                      <div className="text-sm text-muted-foreground">Team leaderboard</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10">
                    <Zap className="h-5 w-5 text-accent" />
                    <div>
                      <div className="font-medium text-accent">12 Day Streak</div>
                      <div className="text-sm text-muted-foreground">Consistent performance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Performance
                </CardTitle>
                <CardDescription>How your team is performing collectively</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{realTimeMetrics.team.totalCollectors}</div>
                    <p className="text-sm text-muted-foreground">Active Collectors</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{formatWeight(realTimeMetrics.team.teamTotalKg)}</div>
                    <p className="text-sm text-muted-foreground">Team Total Kg</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{formatPoints(realTimeMetrics.team.teamTotalPoints)}</div>
                    <p className="text-sm text-muted-foreground">Team Total Points</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warm">{formatCurrency(realTimeMetrics.team.teamTotalEarnings)}</div>
                    <p className="text-sm text-muted-foreground">Team Total Earnings</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">🏆 Top Collector</div>
                      <div className="text-sm text-muted-foreground">{realTimeMetrics.team.topCollector}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatWeight(realTimeMetrics.team.topCollectorKg)}</div>
                      <div className="text-sm text-muted-foreground">This month</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environmental Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-success" />
                  Environmental Impact
                </CardTitle>
                <CardDescription>Your contribution to a greener planet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{Math.round(realTimeMetrics.environmental.co2Saved)} kg</div>
                    <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{Math.round(realTimeMetrics.environmental.waterSaved)} L</div>
                    <p className="text-sm text-muted-foreground">Water Saved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{Math.round(realTimeMetrics.environmental.landfillSaved)} kg</div>
                    <p className="text-sm text-muted-foreground">Landfill Saved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warm">{realTimeMetrics.environmental.treesEquivalent}</div>
                    <p className="text-sm text-muted-foreground">Trees Equivalent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Route & Search Tab */}
          <TabsContent value="route" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-primary" />
                  Assigned Stops & Potential Customers
                </CardTitle>
                <CardDescription>
                  View your assigned pickups and discover potential new customers
                </CardDescription>
                
                {/* Customer Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{statistics.total}</div>
                    <div className="text-sm text-muted-foreground">Total Customers</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.withAddresses}</div>
                    <div className="text-sm text-muted-foreground">With Addresses</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statistics.readyForFirstCollection}</div>
                    <div className="text-sm text-muted-foreground">Ready for Collection</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{statistics.activeCustomers}</div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={getNewCustomersReady}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Show New Customers
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => getCustomersByAddressStatus(true)}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    With Addresses
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => getCustomerProfilesWithAddresses()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers, addresses, suburbs..."
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchQuery(value);
                        handleSearch(value);
                      }}
                      className="max-w-sm"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    {filteredStops.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No assigned pickups</p>
                        <p className="text-sm">You don't have any pickups assigned at the moment.</p>
                      </div>
                    ) : (
                      filteredStops.map((stop, index) => (
                        <div key={stop.type === 'pickup' ? stop.data.pickup_id : `profile-${stop.data.id}`} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCustomerSelect(stop)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{stop.customer_name}</h3>
                                <p className="text-sm text-muted-foreground">{`${stop.line1}, ${stop.suburb}, ${stop.city}`}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  {stop.type === 'pickup' ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          Assigned: {new Date(stop.data.started_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                      {stop.data.customer_phone && (
                                        <div className="flex items-center gap-2">
                                          <User className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">{stop.data.customer_phone}</span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">Potential Customer</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {stop.type === 'pickup' ? (
                                <>
                                  <Badge variant="outline" className="text-xs">
                                    {stop.data.materials_breakdown?.map(m => m.material_name).join(', ') || 'No materials'}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {stop.data.status}
                                  </Badge>
                                </>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  New Customer
                                </Badge>
                              )}
                              <Button size="sm" variant="outline">
                                {stop.type === 'pickup' ? 'Select Customer' : 'Start Pickup'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Pickup Tab */}
          <TabsContent value="new-pickup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-success" />
                  New Pickup Form
                </CardTitle>
                <CardDescription>
                  Record a new recycling pickup with materials, weights, and photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Information - Auto-filled if selected from route */}
                {selectedCustomer && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-primary">Selected Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Customer Name</Label>
                          <p className="text-lg font-semibold">{selectedCustomer.customer_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Address</Label>
                          <p className="text-lg font-semibold">{`${selectedCustomer.line1}, ${selectedCustomer.suburb}, ${selectedCustomer.city}`}</p>
                        </div>
                        {selectedCustomer.customer_phone && (
                          <div>
                            <Label className="text-sm font-medium">Phone</Label>
                            <p className="text-lg font-semibold">{selectedCustomer.customer_phone}</p>
                          </div>
                        )}
                        {selectedCustomer.customer_email && (
                          <div>
                            <Label className="text-sm font-medium">Email</Label>
                            <p className="text-lg font-semibold">{selectedCustomer.customer_email}</p>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Selection
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Manual Customer Input (if no customer selected) */}
                {!selectedCustomer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        value={newPickup.customerName}
                        onChange={(e) => setNewPickup(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={newPickup.address}
                        onChange={(e) => setNewPickup(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter pickup address"
                      />
                    </div>
                  </div>
                )}

                {/* Materials Grid */}
                <div className="space-y-4">
                  <Label>Add New Material</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="materialType">Material Type</Label>
                      <Select
                        value={newMaterial.type}
                        onValueChange={(value: string) =>
                          setNewMaterial(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                        <SelectContent>
                          {realMaterials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} - R{material.rate_per_kg}/kg
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={newMaterial.kg}
                        onChange={(e) =>
                          setNewMaterial(prev => ({ ...prev, kg: parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  {/* Photo Capture for Current Material */}
                  <div className="space-y-4">
                    <Label>Photos for {realMaterials.find(m => m.id === newMaterial.type)?.name || newMaterial.type}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border-2 border-dashed border-muted text-center">
                        <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Scale Photo</p>
                        <p className="text-xs text-muted-foreground">Show weight on scale</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => openCamera('scale')}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </Button>
                      </div>
                      <div className="p-4 rounded-lg border-2 border-dashed border-muted text-center">
                        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Materials Photo</p>
                        <p className="text-xs text-muted-foreground">Show materials clearly</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => openCamera('materials')}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </Button>
                      </div>
                    </div>

                    {/* Hidden file input for camera */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    {/* Current Photos Display */}
                    {currentMaterialPhotos.length > 0 && (
                      <div className="space-y-3">
                        <Label>Current Photos ({currentMaterialPhotos.length})</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {currentMaterialPhotos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                onClick={() => removePhoto(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleAddMaterial} 
                    disabled={newMaterial.kg <= 0 || currentMaterialPhotos.length === 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material to Pickup
                  </Button>
                </div>

                {/* Current Materials List */}
                {newPickup.materials.length > 0 && (
                  <div className="space-y-3">
                    <Label>Materials in Pickup ({newPickup.materials.length})</Label>
                    <div className="space-y-2">
                      {newPickup.materials.map((material, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{realMaterials.find(m => m.id === material.material_id)?.name || material.material_id}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatWeight(material.kilograms)} • {material.photos.length} photos
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {material.photos.slice(0, 3).map((photo, photoIndex) => (
                                <img
                                  key={photoIndex}
                                  src={photo}
                                  alt={`Photo ${photoIndex + 1}`}
                                  className="w-8 h-8 object-cover rounded border"
                                />
                              ))}
                              {material.photos.length > 3 && (
                                <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                                  +{material.photos.length - 3}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMaterial(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Input
                    id="notes"
                    value={newPickup.notes}
                    onChange={(e) => setNewPickup(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions or notes..."
                  />
                </div>

                {/* Summary */}
                {newPickup.materials.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Pickup Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {formatWeight(pickupCalculation.totalKg)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Weight</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-success">
                            {formatCurrency(pickupCalculation.totalPrice)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Value</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-accent">
                            {formatPoints(pickupCalculation.totalPoints)}
                          </div>
                          <p className="text-sm text-muted-foreground">Points Earned</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmitPickup} 
                  disabled={
                    newPickup.materials.length === 0 || 
                    (!newPickup.customerName && !selectedCustomer) || 
                    (!newPickup.address && !selectedCustomer)
                  }
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit Pickup
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Pickup History
                </CardTitle>
                <CardDescription>
                  View your completed pickups and their approval status
                </CardDescription>
              </CardHeader>
              <CardContent>
                                                  <div className="space-y-4">
                  {pickupHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No pickup history</p>
                      <p className="text-sm">You haven't completed any pickups yet.</p>
                    </div>
                  ) : (
                    pickupHistory.map((pickup) => (
                    <div key={pickup.pickup_id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{pickup.customer_name}</h3>
                          <p className="text-sm text-muted-foreground">{`${pickup.line1}, ${pickup.suburb}, ${pickup.city}`}</p>
                          <p className="text-xs text-muted-foreground">{new Date(pickup.started_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className={getStatusColor(pickup.status)}>
                          {getStatusIcon(pickup.status)}
                          <span className="ml-1 capitalize">{pickup.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div>
                          <div className="text-lg font-bold text-primary">
                            {formatWeight(pickup.total_kg)}
                          </div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-success">
                            {formatCurrency(pickup.total_value)}
                          </div>
                          <p className="text-xs text-muted-foreground">Value</p>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-accent">
                            {formatPoints(pickup.total_points)}
                          </div>
                          <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {pickup.materials_breakdown.map((material, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {material.material_name}: {formatWeight(material.weight_kg)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  );
}
