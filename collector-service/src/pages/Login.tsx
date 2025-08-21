import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Recycle, 
  Shield, 
  Truck,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { defaultCredentials, getRoleDisplayName, getRoleColor, UserRole } from "@/lib/auth-schema";

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

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const { theme } = useTheme();

  // Redirect already authenticated users to their role-specific dashboard
  if (isAuthenticated && user) {
    const redirectUrl = getRoleRedirectUrl(user.role);
    navigate(redirectUrl);
    return null;
  }
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await login({
        username: formData.username,
        password: formData.password,
      });

      if (response.success && response.redirectTo) {
        setSuccess(`Welcome! Redirecting to collector portal...`);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(response.redirectTo!);
        }, 1500);
      } else {
        setError(response.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleQuickLogin = (type: 'admin' | 'staff' | 'collector') => {
    const credentials = defaultCredentials[type];
    setFormData(prev => ({
      ...prev,
      username: credentials.email || credentials.username,
      password: credentials.password,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
                 {/* Header */}
         <div className="text-center space-y-2">
           <div className="w-16 h-16 mx-auto">
             <img 
               src={theme === 'dark' ? '/w white.png' : '/w yellow.png'} 
               alt="Woza Mali Logo" 
               className="w-full h-full object-contain"
             />
           </div>
           <h1 className="text-2xl font-bold text-foreground">Woza Mali</h1>
           <p className="text-muted-foreground">Collector Portal - Sign in to your account</p>
         </div>

        {/* Login Form */}
        <Card className="shadow-elegant">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Sign In
            </CardTitle>
            <CardDescription>
              Access your collector dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                             {/* Email Field */}
               <div className="space-y-2">
                 <Label htmlFor="username">Email</Label>
                 <div className="relative">
                   <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                   <Input
                     id="username"
                     type="email"
                     value={formData.username}
                     onChange={(e) => handleInputChange('username', e.target.value)}
                     placeholder="Enter your email"
                     className="pl-10"
                     disabled={isLoading}
                   />
                 </div>
               </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    handleInputChange('rememberMe', checked === true)
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  Remember me
                </Label>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Quick Login Options */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Quick Login - Collector (Demo)
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('collector')}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Truck className="h-4 w-4 text-green-600" />
                  <span className="text-xs">Collector</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Demo Credentials</CardTitle>
            <CardDescription className="text-xs">
              Use these credentials to test the collector role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
                         <div className="flex justify-center">
               <div className="flex items-center justify-between p-2 rounded bg-background">
                 <span className="font-medium">Collector:</span>
                 <code className="text-muted-foreground">col001@wozamali.com / collector123</code>
               </div>
             </div>
          </CardContent>
        </Card>

                    {/* Back to Main */}
            <div className="text-center">
              <Button variant="ghost" asChild>
                <a href="/">← Back to Login</a>
              </Button>
            </div>
      </div>
    </div>
  );
}
