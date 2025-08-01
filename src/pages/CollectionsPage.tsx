import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";

const CollectionsPage = () => {
  const navigate = useNavigate();
  const [collectionDates] = useState([
    '2025-08-05',
    '2025-08-12',
    '2025-08-19',
    '2025-08-26'
  ]);

  const nextDate = collectionDates.find(d => new Date(d) >= new Date()) || 'None scheduled';

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Collection: {nextDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collectionDates.map((date, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <span>{new Date(date).toLocaleDateString()}</span>
                  <Button 
                    size="sm"
                    onClick={() => bookCollection(date)}
                    disabled={new Date(date) < new Date()}
                  >
                    Book Pickup
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CollectionsPage;