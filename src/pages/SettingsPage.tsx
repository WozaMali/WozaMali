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
  const router = useRouter();
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not ready yet, show loading
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading settings...</p>
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
      console.log('Settings: Starting logout process...');
      await signOut();
      console.log('Settings: Sign out completed, redirecting to sign-in...');
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Settings: Logout failed:', error);
      // Force redirect even if there's an error
      router.push('/auth/sign-in');
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
          action: () => router.push("/profile/edit")
        },
        {
          icon: Shield,
          title: "Privacy & Security",
          description: "Manage your privacy settings",
          type: "button",
          action: () => router.push("/profile/security")
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
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
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        </div>
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="flex items-center p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {settingSections.map((section, index) => (
          <Card key={index} className="shadow-sm">
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
        <Card className="shadow-sm border-red-200">
          <CardContent className="p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Log Out
            </Button>
          </CardContent>
        </Card>

        {/* App Version */}
        <div className="text-center">
          <p className="text-sm text-gray-500">Woza Mali v1.0.0</p>
          <p className="text-xs text-gray-400">Powered by Sebenza Nathi Waste</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;