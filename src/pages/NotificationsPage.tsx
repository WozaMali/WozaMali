import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Gift, Recycle, ArrowLeft, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    collections: true,
    rewards: true,
    fund: false,
    system: true
  });

  const recentNotifications = [
    {
      id: 1,
      type: "collection",
      title: "Collection Reminder",
      message: "Your next collection is scheduled for tomorrow at 09:00 AM",
      time: "2 hours ago",
      read: false,
      icon: Calendar
    },
    {
      id: 2,
      type: "reward",
      title: "Reward Earned!",
      message: "You've earned 50 points for recycling 3.2kg this week",
      time: "1 day ago",
      read: false,
      icon: Gift
    },
    {
      id: 3,
      type: "system",
      title: "Welcome to Woza Mali!",
      message: "Start recycling and earning rewards today",
      time: "3 days ago",
      read: true,
      icon: Recycle
    }
  ];

  const handleNotificationToggle = (type: string) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const markAsRead = (id: number) => {
    // Implementation for marking notification as read
  };

  return (
    <div className="min-h-screen bg-gradient-warm pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Notification Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Collection Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified about upcoming collections</p>
              </div>
              <Switch 
                checked={notifications.collections}
                onCheckedChange={() => handleNotificationToggle('collections')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Rewards & Points</p>
                <p className="text-sm text-muted-foreground">Updates on rewards and points earned</p>
              </div>
              <Switch 
                checked={notifications.rewards}
                onCheckedChange={() => handleNotificationToggle('rewards')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Scholar Fund Updates</p>
                <p className="text-sm text-muted-foreground">News about the Green Scholar Fund</p>
              </div>
              <Switch 
                checked={notifications.fund}
                onCheckedChange={() => handleNotificationToggle('fund')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System Updates</p>
                <p className="text-sm text-muted-foreground">App updates and announcements</p>
              </div>
              <Switch 
                checked={notifications.system}
                onCheckedChange={() => handleNotificationToggle('system')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div 
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.read ? 'bg-muted/20' : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      notification.type === 'collection' ? 'bg-primary/20' :
                      notification.type === 'reward' ? 'bg-warning/20' :
                      'bg-success/20'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        notification.type === 'collection' ? 'text-primary' :
                        notification.type === 'reward' ? 'text-warning' :
                        'text-success'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </div>
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs h-auto p-1"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;