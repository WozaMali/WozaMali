import { useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { TreePine, Plus, Recycle, GraduationCap, TrendingUp, LeafIcon } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { computeTotalImpact, formatImpactValue, getImpactDescription } from "@/lib/impact-config";

// Mock fund data
const mockContributions = [
  {
    id: "1",
    userId: "USR001", 
    userName: "Sarah Johnson",
    petAmount: 15.5,
    cashAmount: 50.00,
    date: "2024-03-15T14:30:00",
    type: "Both"
  },
  {
    id: "2",
    userId: "USR002",
    userName: "Michael Chen", 
    petAmount: 28.2,
    cashAmount: 0,
    date: "2024-03-15T10:15:00",
    type: "PET Only"
  },
  {
    id: "3",
    userId: "USR003",
    userName: "Nomsa Mthembu",
    petAmount: 0,
    cashAmount: 100.00,
    date: "2024-03-14T16:45:00",
    type: "Cash Only"
  },
  {
    id: "4",
    userId: "USR004",
    userName: "David Williams",
    petAmount: 12.8,
    cashAmount: 25.00,
    date: "2024-03-14T11:20:00", 
    type: "Both"
  },
  {
    id: "5",
    userId: null,
    userName: "Anonymous Donor",
    petAmount: 0,
    cashAmount: 500.00,
    date: "2024-03-13T09:00:00",
    type: "Cash Only"
  }
];

const AdminFund = () => {
  const [isAddContributionOpen, setIsAddContributionOpen] = useState(false);
  const [contributionType, setContributionType] = useState("cash");
  const [formData, setFormData] = useState({
    userName: "",
    petAmount: "",
    cashAmount: "",
    notes: ""
  });
  const { toast } = useToast();

  // Calculate fund statistics
  const fundStats = {
    totalPet: mockContributions.reduce((sum, c) => sum + c.petAmount, 0),
    totalCash: mockContributions.reduce((sum, c) => sum + c.cashAmount, 0),
    totalContributors: new Set(mockContributions.filter(c => c.userId).map(c => c.userId)).size,
    thisMonth: mockContributions.filter(c => {
      const date = new Date(c.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length
  };

  // Calculate real environmental impact
  const environmentalImpact = computeTotalImpact(
    mockContributions.map(c => ({ petKg: c.petAmount, cansKg: 0 })) // Assuming only PET for now
  );

  const totalFund = environmentalImpact.fundR + fundStats.totalCash;

  const handleAddContribution = () => {
    toast({
      title: "Contribution Added",
      description: `New ${contributionType} contribution has been recorded successfully.`,
    });
    setIsAddContributionOpen(false);
    setFormData({ userName: "", petAmount: "", cashAmount: "", notes: "" });
  };

  const getContributionTypeColor = (type: string) => {
    switch (type) {
      case 'PET Only': return 'bg-success text-success-foreground';
      case 'Cash Only': return 'bg-info text-info-foreground';
      case 'Both': return 'bg-primary text-primary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <AdminLayout currentPage="fund">
      <div className="space-y-6">
        {/* Fund Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-success text-success-foreground">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">R {totalFund.toFixed(2)}</div>
                  <p className="text-sm opacity-90">Total Fund Pool</p>
                </div>
                <TreePine className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Recycle className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{fundStats.totalPet.toFixed(1)} kg</div>
                <p className="text-sm text-muted-foreground">PET Contributed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <LeafIcon className="h-5 w-5 text-info" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">R {fundStats.totalCash.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Cash Donations</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{fundStats.totalContributors}</div>
                <p className="text-sm text-muted-foreground">Contributors</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fund Impact */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TreePine className="h-6 w-6 text-success" />
              <span>Green Scholar Fund Impact</span>
            </CardTitle>
            <CardDescription>
              Supporting education through recycling - every kilogram and rand counts toward student scholarships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-gradient-success text-success-foreground">
                <div className="text-3xl font-bold mb-2">{Math.floor(totalFund / 2000)}</div>
                <p className="text-sm opacity-90">Scholarships Funded</p>
                <p className="text-xs opacity-75 mt-1">Based on R2,000 per scholarship</p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-secondary">
                <div className="text-3xl font-bold mb-2 text-foreground">{fundStats.thisMonth}</div>
                <p className="text-sm text-muted-foreground">Contributions This Month</p>
                <div className="flex items-center justify-center mt-1">
                  <TrendingUp className="h-3 w-3 text-success mr-1" />
                  <span className="text-xs text-success">+23% vs last month</span>
                </div>
              </div>
              
                                <div className="text-center p-6 rounded-lg bg-gradient-primary text-primary-foreground">
                    <div className="text-3xl font-bold mb-2">{environmentalImpact.co2Saved.toFixed(1)}</div>
                    <p className="text-sm opacity-90">CO₂ Saved (kg)</p>
                    <p className="text-xs opacity-75 mt-1">Environmental impact</p>
                  </div>
            </div>
          </CardContent>
        </Card>

        {/* Contributions Management */}
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Fund Contributions</CardTitle>
                <CardDescription>
                  Track and manage PET recycling and cash donations to the Green Scholar Fund
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddContributionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contribution
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Contributions Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contributor</TableHead>
                    <TableHead>PET Amount</TableHead>
                    <TableHead>Cash Amount</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockContributions.map((contribution) => {
                    const totalValue = (contribution.petAmount * 0.5) + contribution.cashAmount;
                    return (
                      <TableRow key={contribution.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {contribution.userName}
                          </div>
                          {contribution.userId && (
                            <div className="text-sm text-muted-foreground">{contribution.userId}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {contribution.petAmount > 0 ? (
                            <div className="flex items-center space-x-1">
                              <Recycle className="h-4 w-4 text-success" />
                              <span className="font-medium">{contribution.petAmount.toFixed(1)} kg</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contribution.cashAmount > 0 ? (
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">R {contribution.cashAmount.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-lg">
                          R {totalValue.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getContributionTypeColor(contribution.type)} w-fit`}>
                            {contribution.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(contribution.date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Environmental Impact Details */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LeafIcon className="h-6 w-6 text-success" />
              <span>Environmental Impact Details</span>
            </CardTitle>
            <CardDescription>
              Detailed breakdown of environmental benefits from recycling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-success/10">
                <div className="text-2xl font-bold text-success mb-2">
                  {formatImpactValue(environmentalImpact.co2Saved, 'kg')}
                </div>
                <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                <p className="text-xs text-success mt-1">{getImpactDescription('co2')}</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-info/10">
                <div className="text-2xl font-bold text-info mb-2">
                  {formatImpactValue(environmentalImpact.waterSavedL, 'L')}
                </div>
                <p className="text-sm text-muted-foreground">Water Saved</p>
                <p className="text-xs text-info mt-1">{getImpactDescription('water')}</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-warning/10">
                <div className="text-2xl font-bold text-warning mb-2">
                  {formatImpactValue(environmentalImpact.landfillL, 'L')}
                </div>
                <p className="text-sm text-muted-foreground">Landfill Saved</p>
                <p className="text-xs text-warning mt-1">{getImpactDescription('landfill')}</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-secondary">
              <h4 className="font-semibold text-foreground mb-3">Impact Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total PET Recycled:</span>
                  <span className="font-medium">{fundStats.totalPet.toFixed(1)} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fund Value Generated:</span>
                  <span className="font-medium">R {environmentalImpact.fundR.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Points Earned:</span>
                  <span className="font-medium">{environmentalImpact.points.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Impact Value:</span>
                  <span className="font-medium">R {(environmentalImpact.fundR + fundStats.totalCash).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Contribution Dialog */}
        <Dialog open={isAddContributionOpen} onOpenChange={setIsAddContributionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Fund Contribution</DialogTitle>
              <DialogDescription>
                Record a new PET recycling or cash donation to the Green Scholar Fund
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="contributionType">Contribution Type</Label>
                <Select value={contributionType} onValueChange={setContributionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pet">PET Recycling Only</SelectItem>
                    <SelectItem value="cash">Cash Donation Only</SelectItem>
                    <SelectItem value="both">Both PET & Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="userName">Contributor Name</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => setFormData({...formData, userName: e.target.value})}
                  placeholder="Enter contributor name or 'Anonymous'"
                />
              </div>

              {(contributionType === 'pet' || contributionType === 'both') && (
                <div>
                  <Label htmlFor="petAmount">PET Amount (kg)</Label>
                  <Input
                    id="petAmount"
                    type="number"
                    step="0.1"
                    value={formData.petAmount}
                    onChange={(e) => setFormData({...formData, petAmount: e.target.value})}
                    placeholder="15.5"
                  />
                </div>
              )}

              {(contributionType === 'cash' || contributionType === 'both') && (
                <div>
                  <Label htmlFor="cashAmount">Cash Amount (R)</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    step="0.01"
                    value={formData.cashAmount}
                    onChange={(e) => setFormData({...formData, cashAmount: e.target.value})}
                    placeholder="100.00"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes about this contribution..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddContributionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddContribution}>
                Add Contribution
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminFund;