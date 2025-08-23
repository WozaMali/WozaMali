"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Save, X, User as UserIcon } from "lucide-react";
import { getRoleDisplayName, getRoleBadgeColor } from "@/lib/auth-schema";

export function UserProfile() {
  const { user, userRole, updateProfile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || "",
    phone: user?.user_metadata?.phone || "",
    street_address: user?.user_metadata?.street_address || "",
    suburb: user?.user_metadata?.suburb || "",
    city: user?.user_metadata?.city || "",
    postal_code: user?.user_metadata?.postal_code || "",
  });

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Please sign in to view your profile</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSave = async () => {
    try {
      const { error } = await updateProfile(formData);
      if (!error) {
        setIsEditing(false);
      } else {
        console.error("Error updating profile:", error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.user_metadata?.full_name || "",
      phone: user?.user_metadata?.phone || "",
      street_address: user?.user_metadata?.street_address || "",
      suburb: user?.user_metadata?.suburb || "",
      city: user?.user_metadata?.city || "",
      postal_code: user?.user_metadata?.postal_code || "",
    });
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getRoleBadgeColor(userRole as any)}>
              {getRoleDisplayName(userRole as any)}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
            <AvatarFallback className="text-lg">
              {getInitials(user?.user_metadata?.full_name || user?.email || "")}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">
              {user?.user_metadata?.full_name || "No Name Set"}
            </h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">
              Member since {new Date(user?.created_at || "").toLocaleDateString()}
            </p>
          </div>
        </div>

        <Separator />

        {/* Profile Form */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium">Personal Information</h4>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street_address">Street Address</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suburb">Suburb</Label>
              <Input
                id="suburb"
                value={formData.suburb}
                onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your suburb"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your postal code"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Account Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Account Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">User ID:</span>
              <p className="font-mono text-xs">{user?.id}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Email Verified:</span>
              <p>{user?.email_confirmed_at ? "Yes" : "No"}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Last Sign In:</span>
              <p>{new Date(user?.last_sign_in_at || "").toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Account Created:</span>
              <p>{new Date(user?.created_at || "").toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
