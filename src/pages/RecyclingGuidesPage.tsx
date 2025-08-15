import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Recycle, CheckCircle, XCircle, AlertTriangle, Lightbulb, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecyclingGuidesPage = () => {
  const navigate = useNavigate();

  const recyclableItems = [
    {
      category: "Plastic Bottles",
      items: [
        { name: "PET Bottles (Water, Soda)", accepted: true, tips: "Remove caps and labels. Rinse clean." },
        { name: "HDPE Bottles (Milk, Juice)", accepted: true, tips: "Rinse thoroughly before recycling." },
        { name: "Plastic Bags", accepted: false, tips: "Take to special collection points at stores." }
      ]
    },
    {
      category: "Paper & Cardboard",
      items: [
        { name: "Newspapers & Magazines", accepted: true, tips: "Keep dry and remove staples." },
        { name: "Cardboard Boxes", accepted: true, tips: "Flatten boxes and remove tape." },
        { name: "Pizza Boxes", accepted: false, tips: "Grease contamination makes these non-recyclable." }
      ]
    },
    {
      category: "Glass",
      items: [
        { name: "Clear Glass Bottles", accepted: true, tips: "Remove caps and labels. Rinse clean." },
        { name: "Colored Glass Bottles", accepted: true, tips: "Separate by color when possible." },
        { name: "Window Glass", accepted: false, tips: "Different melting point than bottle glass." }
      ]
    },
    {
      category: "Aluminium Cans",
      items: [
        { name: "Beverage Cans (Soda, Beer)", accepted: true, tips: "Rinse thoroughly and crush to save space." },
        { name: "Food Cans (Tuna, Beans)", accepted: true, tips: "Clean thoroughly and remove labels when possible." },
        { name: "Aerosol Cans", accepted: false, tips: "These require special handling due to pressurized contents." }
      ]
    }
  ];

  const tips = [
    {
      title: "Clean Before Recycling",
      description: "Rinse containers to remove food residue. This prevents contamination of other recyclables.",
      icon: CheckCircle
    },
    {
      title: "Separate Materials",
      description: "Sort different types of recyclables into separate containers for better processing.",
      icon: Recycle
    },
    {
      title: "Check Local Guidelines",
      description: "Recycling rules vary by area. Check what Sebenza Nathi Waste accepts in your zone.",
      icon: AlertTriangle
    },
    {
      title: "Reduce & Reuse First",
      description: "Before recycling, consider if you can reduce usage or reuse the item creatively.",
      icon: Lightbulb
    }
  ];

  const achievements = [
    {
      title: "Recycling Rookie",
      description: "Complete your first recycling guide",
      progress: 100,
      unlocked: true
    },
    {
      title: "Material Master",
      description: "Learn about all recyclable categories",
      progress: 75,
      unlocked: false
    },
    {
      title: "Eco Expert",
      description: "Follow all recycling best practices",
      progress: 40,
      unlocked: false
    }
  ];

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
          <h1 className="text-xl font-bold">Recycling Guides</h1>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
            <TabsTrigger value="achievements">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">What Can You Recycle?</h2>
              <p className="text-muted-foreground">Learn what materials Sebenza Nathi Waste accepts</p>
            </div>

            {recyclableItems.map((category, index) => (
              <Card key={index} className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Recycle className="h-5 w-5 mr-2 text-primary" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className={`p-1 rounded-full ${item.accepted ? 'bg-success/20' : 'bg-destructive/20'}`}>
                        {item.accepted ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <Badge variant={item.accepted ? "default" : "destructive"} className="text-xs">
                            {item.accepted ? "Accepted" : "Not Accepted"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.tips}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Recycling Best Practices</h2>
              <p className="text-muted-foreground">Follow these tips to maximize your recycling impact</p>
            </div>

            {tips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <Card key={index} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="shadow-card border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="text-center">
                  <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Pro Tip</h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule regular collections to maintain consistent recycling habits and maximize your earnings!
                  </p>
                  <Button 
                    variant="gradient" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate('/collections')}
                  >
                    Schedule Collection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Your Learning Progress</h2>
              <p className="text-muted-foreground">Unlock achievements as you learn about recycling</p>
            </div>

            {achievements.map((achievement, index) => (
              <Card key={index} className={`shadow-card ${achievement.unlocked ? 'border-success/20 bg-success/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-success/20' : 'bg-muted/20'}`}>
                      <Award className={`h-5 w-5 ${achievement.unlocked ? 'text-success' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        {achievement.unlocked && (
                          <Badge variant="default" className="bg-success text-success-foreground">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${achievement.unlocked ? 'bg-success' : 'bg-primary'}`}
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{achievement.progress}% Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RecyclingGuidesPage;