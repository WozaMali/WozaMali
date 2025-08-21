import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Gift, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock rewards data
const mockRewards = [
  {
    id: "RW001",
    title: "Green Groceries Voucher",
    description: "R50 voucher for sustainable grocery shopping at participating stores",
    kgThreshold: 25,
    validityPeriod: 30,
    assetUrl: "/api/placeholder/200/150",
    status: "Active",
    redeemCount: 47
  },
  {
    id: "RW002",
    title: "Eco-Friendly Tote Bag",
    description: "Reusable shopping bag made from recycled materials", 
    kgThreshold: 50,
    validityPeriod: 60,
    assetUrl: "/api/placeholder/200/150",
    status: "Active",
    redeemCount: 23
  },
  {
    id: "RW003",
    title: "Solar Power Bank",
    description: "Portable solar-powered device charger for on-the-go sustainability",
    kgThreshold: 100,
    validityPeriod: 90,
    assetUrl: "/api/placeholder/200/150", 
    status: "Active",
    redeemCount: 12
  },
  {
    id: "RW004",
    title: "Plant-a-Tree Certificate",
    description: "Sponsor tree planting in local communities with personalized certificate",
    kgThreshold: 75,
    validityPeriod: 365,
    assetUrl: "/api/placeholder/200/150",
    status: "Paused",
    redeemCount: 8
  }
];

const AdminRewards = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    kgThreshold: "",
    validityPeriod: "",
    assetUrl: ""
  });
  const { toast } = useToast();

  const rewardStats = {
    total: mockRewards.length,
    active: mockRewards.filter(r => r.status === 'Active').length,
    paused: mockRewards.filter(r => r.status === 'Paused').length,
    totalRedemptions: mockRewards.reduce((sum, r) => sum + r.redeemCount, 0)
  };

  const handleCreateReward = () => {
    toast({
      title: "Reward Created",
      description: `New reward "${formData.title}" has been created successfully.`,
    });
    setIsCreateDialogOpen(false);
    setFormData({ title: "", description: "", kgThreshold: "", validityPeriod: "", assetUrl: "" });
  };

  const handleEditReward = (reward: any) => {
    setSelectedReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description,
      kgThreshold: reward.kgThreshold.toString(),
      validityPeriod: reward.validityPeriod.toString(),
      assetUrl: reward.assetUrl
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateReward = () => {
    toast({
      title: "Reward Updated",
      description: `Reward "${formData.title}" has been updated successfully.`,
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteReward = (rewardId: string, rewardTitle: string) => {
    toast({
      title: "Reward Deleted",
      description: `Reward "${rewardTitle}" has been deleted.`,
      variant: "destructive"
    });
  };

  return (
    <AdminLayout currentPage="rewards">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{rewardStats.total}</div>
              <p className="text-sm text-muted-foreground">Total Rewards</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-2">
              <Gift className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-foreground">{rewardStats.active}</div>
                <p className="text-sm text-muted-foreground">Active Rewards</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{rewardStats.paused}</div>
              <p className="text-sm text-muted-foreground">Paused Rewards</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{rewardStats.totalRedemptions}</div>
              <p className="text-sm text-muted-foreground">Total Redeemed</p>
            </CardContent>
          </Card>
        </div>

        {/* Rewards Management */}
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Rewards Manager</CardTitle>
                <CardDescription>
                  Create and manage recycling rewards and incentives for users
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Reward
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Rewards Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reward</TableHead>
                    <TableHead>KG Threshold</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Redeemed</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <Gift className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{reward.title}</div>
                            <div className="text-sm text-muted-foreground max-w-xs">
                              {reward.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {reward.kgThreshold} kg
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{reward.validityPeriod} days</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={reward.status === 'Active' ? 'default' : 'secondary'}>
                          {reward.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {reward.redeemCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditReward(reward)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteReward(reward.id, reward.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Reward Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Reward</DialogTitle>
              <DialogDescription>
                Add a new recycling incentive for community members
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Reward Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Eco Shopping Voucher"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe what users get with this reward..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kgThreshold">KG Threshold</Label>
                  <Input
                    id="kgThreshold"
                    type="number"
                    value={formData.kgThreshold}
                    onChange={(e) => setFormData({...formData, kgThreshold: e.target.value})}
                    placeholder="25"
                  />
                </div>
                
                <div>
                  <Label htmlFor="validityPeriod">Validity (Days)</Label>
                  <Input
                    id="validityPeriod"
                    type="number"
                    value={formData.validityPeriod}
                    onChange={(e) => setFormData({...formData, validityPeriod: e.target.value})}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="assetUrl">Asset URL (Optional)</Label>
                <Input
                  id="assetUrl"
                  value={formData.assetUrl}
                  onChange={(e) => setFormData({...formData, assetUrl: e.target.value})}
                  placeholder="https://example.com/reward-image.jpg"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReward}>
                Create Reward
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Reward Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Reward</DialogTitle>
              <DialogDescription>
                Update reward details and requirements
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Reward Title</Label>
                <Input
                  id="editTitle"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editKgThreshold">KG Threshold</Label>
                  <Input
                    id="editKgThreshold"
                    type="number"
                    value={formData.kgThreshold}
                    onChange={(e) => setFormData({...formData, kgThreshold: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editValidityPeriod">Validity (Days)</Label>
                  <Input
                    id="editValidityPeriod"
                    type="number"
                    value={formData.validityPeriod}
                    onChange={(e) => setFormData({...formData, validityPeriod: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateReward}>
                Update Reward
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminRewards;