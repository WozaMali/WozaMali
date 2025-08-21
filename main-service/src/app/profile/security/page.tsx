"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, Lock, Eye, Bell, Smartphone, Key, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SecurityAndPrivacy = () => {
  const navigate = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not ready yet, show loading
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const { user } = authContext;

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    biometricLogin: false,
    loginNotifications: true,
    dataSharing: false,
    locationSharing: true,
    analyticsSharing: false
  });

  useEffect(() => {
    setMounted(true);
    
    // Load existing security settings (you can fetch these from your database)
    // For now, using default values
  }, []);

  if (!mounted) return null;

  const handleSettingChange = (setting: string, value: boolean) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    
    try {
      // Here you would save the security settings to your database
      // For now, just show a success message
      
      toast({
        title: "Settings Saved",
        description: "Your security and privacy settings have been updated.",
      });
      
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    navigate.push('/auth/forgot-password');
  };

  const handleDeleteAccount = () => {
    // Show confirmation dialog
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast({
        title: "Account Deletion",
        description: "Please contact support to delete your account.",
      });
    }
  };

  const securitySections = [
    {
      title: "Authentication",
      icon: Lock,
      items: [
        {
          title: "Two-Factor Authentication",
          description: "Add an extra layer of security to your account",
          type: "toggle",
          setting: "twoFactorAuth",
          value: securitySettings.twoFactorAuth,
          onChange: handleSettingChange
        },
        {
          title: "Biometric Login",
          description: "Use fingerprint or face ID to sign in",
          type: "toggle",
          setting: "biometricLogin",
          value: securitySettings.biometricLogin,
          onChange: handleSettingChange
        },
        {
          title: "Change Password",
          description: "Update your account password",
          type: "button",
          action: handleChangePassword
        }
      ]
    },
    {
      title: "Privacy",
      icon: Eye,
      items: [
        {
          title: "Login Notifications",
          description: "Get notified when someone signs in to your account",
          type: "toggle",
          setting: "loginNotifications",
          value: securitySettings.loginNotifications,
          onChange: handleSettingChange
        },
        {
          title: "Data Sharing",
          description: "Allow sharing of anonymous usage data for improvements",
          type: "toggle",
          setting: "dataSharing",
          value: securitySettings.dataSharing,
          onChange: handleSettingChange
        },
        {
          title: "Location Sharing",
          description: "Share location for collection scheduling",
          type: "toggle",
          setting: "locationSharing",
          value: securitySettings.locationSharing,
          onChange: handleSettingChange
        },
        {
          title: "Analytics Sharing",
          description: "Help improve the app with anonymous analytics",
          type: "toggle",
          setting: "analyticsSharing",
          value: securitySettings.analyticsSharing,
          onChange: handleSettingChange
        }
      ]
    }
  ];

  const renderSettingItem = (item: any) => {
    if (item.type === "toggle") {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
          <Switch 
            checked={item.value}
            onCheckedChange={(value) => item.onChange(item.setting, value)}
          />
        </div>
      );
    }
    
    if (item.type === "button") {
      return (
        <Button 
          variant="ghost" 
          className="w-full justify-start h-auto p-0"
          onClick={item.action}
        >
          <div className="flex items-center space-x-3 w-full py-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        </Button>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-warm pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate.push('/profile')}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Security & Privacy</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Security Settings */}
        {securitySections.map((section, index) => (
          <Card key={index} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <section.icon className="h-5 w-5 mr-2" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {renderSettingItem(item)}
                  {itemIndex < section.items.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Save Settings Button */}
        <Button
          onClick={handleSaveSettings}
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>

        {/* Danger Zone */}
        <Card className="shadow-card border-destructive/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="shadow-card bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center text-blue-800">
              <Shield className="h-5 w-5 mr-2" />
              Security Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-700">
            <p>• Use a strong, unique password for your account</p>
            <p>• Enable two-factor authentication for extra security</p>
            <p>• Never share your login credentials with anyone</p>
            <p>• Keep your app updated to the latest version</p>
            <p>• Monitor your account for any suspicious activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityAndPrivacy;
