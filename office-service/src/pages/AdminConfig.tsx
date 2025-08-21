import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Save, Eye, Palette, Globe, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminConfig = () => {
  const [logoUrl, setLogoUrl] = useState("/api/placeholder/200/80");
  const [backgroundUrl, setBackgroundUrl] = useState("/api/placeholder/1920/1080");
  const [siteName, setSiteName] = useState("Woza Mali");
  const [tagline, setTagline] = useState("Recycling Made Simple");
  const [signupCopy, setSignupCopy] = useState("Join thousands making a difference in their communities through sustainable recycling. Earn rewards while helping fund education.");
  const [themeMode, setThemeMode] = useState("auto");
  const [primaryColor, setPrimaryColor] = useState("#4ade80");
  const [accentColor, setAccentColor] = useState("#f97316");
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [enableRewards, setEnableRewards] = useState(true);
  const [enableFund, setEnableFund] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const { toast } = useToast();

  const handleSaveConfig = () => {
    toast({
      title: "Configuration Saved",
      description: "Site settings have been updated successfully and are now live.",
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, this would upload to a file storage service
      toast({
        title: "Logo Uploaded",
        description: "New logo has been uploaded successfully.",
      });
    }
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, this would upload to a file storage service
      toast({
        title: "Background Uploaded", 
        description: "New background image has been uploaded successfully.",
      });
    }
  };

  return (
    <AdminLayout currentPage="config">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Brand & Visual Settings */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-6 w-6 text-primary" />
              <span>Brand & Visual Settings</span>
            </CardTitle>
            <CardDescription>
              Customize the visual appearance and branding of your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label htmlFor="logo">Brand Logo</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 border border-border rounded-lg flex items-center justify-center bg-secondary">
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload PNG, JPG or SVG. Max size 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Background Upload */}
              <div className="space-y-3">
                <Label htmlFor="background">Background Image</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 border border-border rounded-lg overflow-hidden bg-secondary">
                    <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <Input
                      id="background"
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      Hero background. Recommended: 1920x1080px
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Site Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Woza Mali"
                />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Recycling Made Simple"
                />
              </div>
            </div>

            {/* Color Scheme */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="accentColor"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="themeMode">Theme Mode</Label>
              <Select value={themeMode} onValueChange={setThemeMode}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="auto">Auto (System Preference)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content Settings */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-primary" />
              <span>Content Settings</span>
            </CardTitle>
            <CardDescription>
              Configure content displayed on public pages and sign-up flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="signupCopy">Sign-up Page Content</Label>
              <Textarea
                id="signupCopy"
                value={signupCopy}
                onChange={(e) => setSignupCopy(e.target.value)}
                placeholder="Write compelling copy for the sign-up page..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                This text appears on the registration page to encourage sign-ups
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Feature Management</CardTitle>
            <CardDescription>
              Enable or disable application features and modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableRegistration" className="text-base font-medium">
                  User Registration
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow new users to create accounts and join the platform
                </p>
              </div>
              <Switch
                id="enableRegistration"
                checked={enableRegistration}
                onCheckedChange={setEnableRegistration}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableRewards" className="text-base font-medium">
                  Rewards System
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable reward redemption and tier progression features
                </p>
              </div>
              <Switch
                id="enableRewards"
                checked={enableRewards}
                onCheckedChange={setEnableRewards}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableFund" className="text-base font-medium">
                  Green Scholar Fund
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow contributions to the education fund program
                </p>
              </div>
              <Switch
                id="enableFund"
                checked={enableFund}
                onCheckedChange={setEnableFund}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode" className="text-base font-medium text-destructive">
                  Maintenance Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable public access for maintenance
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview Changes
          </Button>
          
          <Button onClick={handleSaveConfig}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConfig;