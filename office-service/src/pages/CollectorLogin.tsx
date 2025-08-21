import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Recycle, 
  User, 
  MapPin, 
  Calendar,
  ArrowRight,
  Truck,
  Users,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function CollectorLogin() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [collectorId, setCollectorId] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');

  // Redirect authenticated users to their dashboard
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const mockRoutes = [
    { id: 'route-1', name: 'Cape Town Central', stops: 12, estimatedTime: '6 hours' },
    { id: 'route-2', name: 'Cape Town North', stops: 8, estimatedTime: '4 hours' },
    { id: 'route-3', name: 'Cape Town South', stops: 15, estimatedTime: '7 hours' },
  ];

  const handleStartRoute = () => {
    if (collectorId && selectedRoute) {
      // In a real app, this would validate and redirect
      window.location.href = `/collector?route=${selectedRoute}&collector=${collectorId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">W</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Woza Mali</h1>
                <p className="text-sm text-muted-foreground">Collector Portal</p>
              </div>
            </div>
                         <Button variant="outline" asChild>
               <a href="/dashboard">Go to Dashboard</a>
             </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <Truck className="h-10 w-10 text-primary-foreground" />
            </div>
            <h2 className="text-4xl font-bold text-foreground">
              Welcome to the 
              <span className="text-transparent bg-gradient-primary bg-clip-text"> Collector Portal</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access your assigned routes, record pickups, and track your recycling impact
            </p>
          </div>

          {/* Login Form */}
          <Card className="max-w-md mx-auto shadow-elegant">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Collector Login
              </CardTitle>
              <CardDescription>
                Enter your collector ID and select your route to begin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="collectorId">Collector ID</Label>
                <Input
                  id="collectorId"
                  value={collectorId}
                  onChange={(e) => setCollectorId(e.target.value)}
                  placeholder="e.g., COL-001"
                  className="text-center font-mono"
                />
              </div>
              
              <div>
                <Label htmlFor="route">Select Route</Label>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your assigned route" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockRoutes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{route.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {route.stops} stops
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleStartRoute} 
                disabled={!collectorId || !selectedRoute}
                className="w-full"
                size="lg"
              >
                Start Route
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Route Information */}
          {selectedRoute && (
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Route Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const route = mockRoutes.find(r => r.id === selectedRoute);
                  if (!route) return null;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div className="p-4 rounded-lg bg-primary/10">
                        <div className="text-2xl font-bold text-primary">{route.name}</div>
                        <p className="text-sm text-muted-foreground">Route Name</p>
                      </div>
                      <div className="p-4 rounded-lg bg-success/10">
                        <div className="text-2xl font-bold text-success">{route.stops}</div>
                        <p className="text-sm text-muted-foreground">Total Stops</p>
                      </div>
                      <div className="p-4 rounded-lg bg-accent/10">
                        <div className="text-2xl font-bold text-accent">{route.estimatedTime}</div>
                        <p className="text-sm text-muted-foreground">Estimated Time</p>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Route Management</CardTitle>
                <CardDescription>
                  View assigned stops and optimize your collection route
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Recycle className="h-6 w-6 text-success-foreground" />
                </div>
                <CardTitle>Quick Pickup</CardTitle>
                <CardDescription>
                  Record materials, weights, and photos in seconds
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle>Performance Tracking</CardTitle>
                <CardDescription>
                  Monitor your daily progress and achievements
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Quick Access */}
          <Card className="bg-gradient-primary text-primary-foreground shadow-primary">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to start collecting?</h3>
              <p className="text-primary-foreground/90 mb-6">
                Enter your collector ID above and select your route to begin your recycling mission.
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  asChild
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <a href="/calculator">Use Calculator</a>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  <a href="/admin">Admin Portal</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
