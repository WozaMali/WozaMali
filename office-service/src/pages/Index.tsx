// Update this page (the content is just a fallback if you fail to update the page)

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle, Users, BarChart3 } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { ThemeIndicator } from "@/components/ui/theme-indicator";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserRole } from "@/lib/auth-schema";

// Helper function to get redirect URL based on user role
const getRoleRedirectUrl = (role: UserRole): string => {
  switch (role) {
    case 'COLLECTOR':
      return '/collector';
    case 'ADMIN':
    case 'STAFF':
      return '/admin';
    default:
      return '/';
  }
};

const Index = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect users to their role-specific dashboard or login
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/');
      } else if (user) {
        // Redirect authenticated users to their role-specific dashboard
        const redirectUrl = getRoleRedirectUrl(user.role);
        navigate(redirectUrl);
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

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
                <p className="text-sm text-muted-foreground">Recycling Made Simple</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeSwitcher />
              <ThemeIndicator />
              <Button variant="outline" asChild>
                <a href="/calculator">Recycling Calculator</a>
              </Button>
              {isAuthenticated ? (
                <UserProfile />
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <a href="/collector-login">Collector Portal</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/login">Sign In</a>
                  </Button>
                </>
              )}
              <Button asChild>
                <a href="/admin">Access Admin Portal</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground">
              Transforming Recycling in 
              <span className="text-transparent bg-gradient-primary bg-clip-text"> South Africa</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empowering communities to recycle responsibly while earning rewards and funding education through our innovative platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Recycle className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Smart Recycling</CardTitle>
                <CardDescription>
                  Track your recycling impact with our tier-based reward system
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle>Community Impact</CardTitle>
                <CardDescription>
                  Join thousands making a difference in their communities
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-success-foreground" />
                </div>
                <CardTitle>Green Scholar Fund</CardTitle>
                <CardDescription>
                  Your recycling directly funds educational opportunities
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-primary text-primary-foreground shadow-primary">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
              <p className="text-primary-foreground/90 mb-6">
                Access the admin portal to manage users, rewards, and track the environmental impact of our recycling community.
              </p>
              <Button 
                variant="secondary" 
                size="lg" 
                asChild
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <a href="/admin">Launch Admin Portal</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p>© 2024 Woza Mali. Recycling Made Simple.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
