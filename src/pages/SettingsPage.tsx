"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Settings, Bell, Shield, HelpCircle, LogOut, User, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const SettingsPage = () => {
  const navigate = useRouter();
  
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
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const { signOut } = authContext;
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("en");

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate.push('/auth/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const settingSections = [
    {
      title: "Appearance",
      items: [
        {
          icon: Globe,
          title: "Language",
          description: "Choose your preferred language",
          type: "select",
          value: language,
          onChange: setLanguage,
          options: [
            { value: "en", label: "English" },
            { value: "af", label: "Afrikaans" },
            { value: "zu", label: "Zulu" },
            { value: "xh", label: "Xhosa" }
          ]
        }
      ]
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          title: "Push Notifications",
          description: "Receive notifications about collections and rewards",
          type: "toggle",
          value: notifications,
          onChange: setNotifications
        }
      ]
    },
    {
      title: "Account",
      items: [
        {
          icon: User,
          title: "Profile",
          description: "Update your personal information",
          type: "button",
          action: () => navigate.push("/profile")
        },
        {
          icon: Shield,
          title: "Privacy & Security",
          description: "Manage your privacy settings",
          type: "button",
          action: () => {}
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          title: "Help & FAQ",
          description: "Get help and find answers",
          type: "button",
          action: () => {}
        }
      ]
    }
  ];

  const renderSettingItem = (item: any) => {
    const Icon = item.icon;
    
    if (item.type === "toggle") {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
          <Switch 
            checked={item.value}
            onCheckedChange={item.onChange}
          />
        </div>
      );
    }
    
    if (item.type === "select") {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
          <Select value={item.value} onValueChange={item.onChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {item.options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    return (
      <Button 
        variant="ghost" 
        className="w-full justify-start h-auto p-0"
        onClick={item.action}
      >
        <div className="flex items-center space-x-3 w-full py-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-warm pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate.back()}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {settingSections.map((section, index) => (
          <Card key={index} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
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

        {/* Logout Section */}
        <Card className="shadow-card border-destructive/20">
          <CardContent className="p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Log Out
            </Button>
          </CardContent>
        </Card>

        {/* App Version */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Woza Mali v1.0.0</p>
          <p className="text-xs text-muted-foreground">Powered by Sebenza Nathi Waste</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;