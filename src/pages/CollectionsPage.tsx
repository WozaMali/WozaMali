import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react";

const CollectionsPage = () => {
  const navigate = useNavigate();
  const [collectionDates] = useState([
    { date: '2025-08-05', time: '08:00 - 12:00', area: 'Zone A', available: true },
    { date: '2025-08-12', time: '08:00 - 12:00', area: 'Zone B', available: true },
    { date: '2025-08-19', time: '13:00 - 17:00', area: 'Zone A', available: true },
    { date: '2025-08-26', time: '08:00 - 12:00', area: 'Zone C', available: false }
  ]);

  const nextDate = collectionDates.find(d => new Date(d.date) >= new Date())?.date || 'None scheduled';

  const bookCollection = (date: string) => {
    alert(`Collection booked for ${date}`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Collections</h1>
        </div>

        <Card className="bg-gradient-primary text-primary-foreground shadow-warm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Collection: {new Date(nextDate).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{collectionDates.find(d => d.date === nextDate)?.time}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{collectionDates.find(d => d.date === nextDate)?.area}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Available Collection Dates</h3>
          {collectionDates.map((collection, index) => {
            const isAvailable = collection.available && new Date(collection.date) >= new Date();
            const isPast = new Date(collection.date) < new Date();
            
            return (
              <Card key={index} className={`shadow-card ${!isAvailable ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{new Date(collection.date).toLocaleDateString()}</span>
                        {isPast && <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Past</span>}
                        {!collection.available && !isPast && <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">Full</span>}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{collection.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{collection.area}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => bookCollection(collection.date)}
                      disabled={!isAvailable}
                      variant={isAvailable ? "default" : "outline"}
                    >
                      {isPast ? "Past" : !collection.available ? "Full" : "Book Pickup"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CollectionsPage;