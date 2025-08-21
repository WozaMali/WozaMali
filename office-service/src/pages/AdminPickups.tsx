import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  DollarSign,
  Package,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  TrendingUp,
  Leaf
} from "lucide-react";
import { formatCurrency, formatWeight, formatPoints } from "@/lib/recycling-schema";
import { pickupServices, adminServices } from "@/lib/supabase-services";
import type { Pickup } from "@/lib/supabase";

export default function AdminPickups() {
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bank_transfer' | 'cash'>('wallet');
  const [activeTab, setActiveTab] = useState('pending');
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch pickups based on active tab
  useEffect(() => {
    const fetchPickups = async () => {
      setLoading(true);
      try {
        let fetchedPickups: Pickup[] = [];
        
        switch (activeTab) {
          case 'pending':
            fetchedPickups = await adminServices.getPendingPickups();
            break;
          case 'approved':
            fetchedPickups = await adminServices.getApprovedPickups();
            break;
          case 'completed':
            fetchedPickups = await adminServices.getCompletedPickups();
            break;
        }
        
        setPickups(fetchedPickups);
      } catch (error) {
        console.error('Error fetching pickups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPickups();
  }, [activeTab]);

  const pendingPickups = pickups.filter(p => p.status === 'pending');
  const approvedPickups = pickups.filter(p => p.status === 'approved');
  const completedPickups = pickups.filter(p => p.status === 'completed');

  const handleApprove = async (pickup: Pickup) => {
    try {
      const success = await adminServices.approvePickup(pickup.id, adminNotes);
      if (success) {
        alert('Pickup approved successfully!');
        // Refresh pickups
        setPickups(prev => prev.map(p => 
          p.id === pickup.id 
            ? { ...p, status: 'approved', admin_notes: adminNotes }
            : p
        ));
      } else {
        alert('Error approving pickup');
      }
    } catch (error) {
      console.error('Error approving pickup:', error);
      alert('Error approving pickup');
    }
    
    setSelectedPickup(null);
    setAdminNotes('');
  };

  const handleReject = async (pickup: Pickup) => {
    if (!adminNotes.trim()) {
      alert('Please provide rejection notes');
      return;
    }
    
    try {
      const success = await adminServices.rejectPickup(pickup.id, adminNotes);
      if (success) {
        alert('Pickup rejected');
        // Refresh pickups
        setPickups(prev => prev.map(p => 
          p.id === pickup.id 
            ? { ...p, status: 'rejected', admin_notes: adminNotes }
            : p
        ));
      } else {
        alert('Error rejecting pickup');
      }
    } catch (error) {
      console.error('Error rejecting pickup:', error);
      alert('Error rejecting pickup');
    }
    
    setSelectedPickup(null);
    setAdminNotes('');
  };

  const handlePaymentUpdate = async (pickup: Pickup) => {
    try {
      const success = await pickupServices.updatePaymentStatus('paid', pickup.id, paymentMethod);
      if (success) {
        alert('Payment status updated!');
        // Refresh pickups
        setPickups(prev => prev.map(p => 
          p.id === pickup.id 
            ? { ...p, payment_status: 'paid', payment_method: paymentMethod }
            : p
        ));
      } else {
        alert('Error updating payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    }
    
    setSelectedPickup(null);
    setPaymentMethod('wallet');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const renderPickupCard = (pickup: Pickup, showActions = true) => (
    <Card key={pickup.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Pickup #{pickup.id.slice(-8)}</CardTitle>
                               <CardDescription>
                   {pickup.customer_name} • {pickup.address}
                 </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(pickup.status)}>
              {getStatusIcon(pickup.status)}
              <span className="ml-1 capitalize">{pickup.status}</span>
            </Badge>
                         <Badge className={getPaymentStatusColor(pickup.payment_status)}>
               <DollarSign className="h-3 w-3 mr-1" />
               {pickup.payment_status}
             </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Collector Info */}
                 <div className="flex items-center gap-4 text-sm">
           <div className="flex items-center gap-2">
             <User className="h-4 w-4 text-muted-foreground" />
             <span className="font-medium">{pickup.collector_name}</span>
           </div>
           <div className="flex items-center gap-2">
             <Calendar className="h-4 w-4 text-muted-foreground" />
             <span>{new Date(pickup.pickup_date).toLocaleDateString()}</span>
           </div>
         </div>

        {/* Materials Summary */}
                 <div className="grid grid-cols-3 gap-4 text-center">
           <div>
             <div className="text-2xl font-bold text-primary">
               {formatWeight(pickup.total_kg)}
             </div>
             <p className="text-sm text-muted-foreground">Total Weight</p>
           </div>
           <div>
             <div className="text-2xl font-bold text-success">
               {formatCurrency(pickup.total_value)}
             </div>
             <p className="text-sm text-muted-foreground">Total Value</p>
           </div>
           <div>
             <div className="text-2xl font-bold text-accent">
               {formatPoints(pickup.total_points)}
             </div>
             <p className="text-sm text-muted-foreground">Points</p>
           </div>
         </div>

                 {/* Materials List */}
         <div className="space-y-2">
           <Label className="text-sm font-medium">Materials Collected:</Label>
           <div className="flex flex-wrap gap-2">
             {/* Note: materials are fetched separately for detailed view */}
             {/* This is a placeholder for summary display */}
             {pickup.total_kg > 0 && (
               <Badge variant="outline" className="text-xs">
                 {formatWeight(pickup.total_kg)} Total Weight
               </Badge>
             )}
           </div>
         </div>

                 {/* Environmental Impact */}
         <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
           <div className="flex items-center gap-2 mb-2">
             <Leaf className="h-4 w-4 text-green-600" />
             <Label className="text-sm font-medium text-green-800 dark:text-green-200">
               Environmental Impact
             </Label>
           </div>
           <div className="grid grid-cols-2 gap-2 text-xs">
             <div>CO₂ Saved: {Math.round(pickup.environmental_impact?.co2Saved || 0)} kg</div>
             <div>Water Saved: {Math.round(pickup.environmental_impact?.waterSaved || 0)} L</div>
             <div>Landfill Saved: {Math.round(pickup.environmental_impact?.landfillSaved || 0)} kg</div>
             <div>Trees Equivalent: {pickup.environmental_impact?.treesEquivalent || 0}</div>
           </div>
         </div>

                 {/* Notes */}
         {pickup.notes && (
           <div className="p-3 rounded-lg bg-muted/50">
             <Label className="text-sm font-medium">Collector Notes:</Label>
             <p className="text-sm text-muted-foreground mt-1">{pickup.notes}</p>
           </div>
         )}

         {/* Admin Notes */}
         {pickup.admin_notes && (
           <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
             <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Admin Notes:</Label>
             <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{pickup.admin_notes}</p>
           </div>
         )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPickup(pickup)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            {pickup.status === 'pending' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApprove(pickup)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(pickup)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
                         {pickup.status === 'approved' && pickup.payment_status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPickup(pickup)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Update Payment
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pickup Management</h1>
          <p className="text-muted-foreground">
            Review and manage pickups from collectors
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{pendingPickups.length}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{approvedPickups.length}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{completedPickups.length}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Review ({pendingPickups.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedPickups.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Completed ({completedPickups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingPickups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pickups pending review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPickups.map(pickup => renderPickupCard(pickup, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedPickups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approved pickups</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedPickups.map(pickup => renderPickupCard(pickup, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedPickups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed pickups</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedPickups.map(pickup => renderPickupCard(pickup, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pickup Detail Modal */}
      {selectedPickup && (
        <Card className="fixed inset-4 z-50 overflow-y-auto bg-background border shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pickup Details - #{selectedPickup.id.slice(-8)}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPickup(null)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Customer Name</Label>
                                 <p className="text-lg font-semibold">{selectedPickup.customer_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-lg font-semibold">{selectedPickup.address}</p>
              </div>
                             {selectedPickup.customer_phone && (
                 <div>
                   <Label className="text-sm font-medium">Phone</Label>
                   <p className="text-lg font-semibold">{selectedPickup.customer_phone}</p>
                 </div>
               )}
               {selectedPickup.customer_email && (
                 <div>
                   <Label className="text-sm font-medium">Email</Label>
                   <p className="text-lg font-semibold">{selectedPickup.customer_email}</p>
                 </div>
               )}
            </div>

                         {/* Materials with Photos */}
             <div>
               <Label className="text-sm font-medium">Materials & Photos</Label>
               <div className="space-y-3 mt-2">
                 {/* Materials are fetched separately for detailed view */}
                 {/* This section would require fetching pickup_materials based on selectedPickup.id */}
                 {/* For now, displaying a placeholder or assuming materials are loaded with pickup */}
                 {/* If materials were loaded with the main pickup, you'd map them here: */}
                 {/* {selectedPickup.materials.map((material, index) => ( */}
                 {/*   <div key={index} className="p-3 rounded-lg border"> */}
                 {/*     <div className="flex items-center justify-between mb-2"> */}
                 {/*       <span className="font-medium">{material.type}</span> */}
                 {/*       <span className="text-sm text-muted-foreground"> */}
                 {/*         {formatWeight(material.kg)} */}
                 {/*       </span> */}
                 {/*     </div> */}
                 {/*     {material.photos.length > 0 && ( */}
                 {/*       <div className="grid grid-cols-4 gap-2"> */}
                 {/*         {material.photos.map((photo, photoIndex) => ( */}
                 {/*           <img */}
                 {/*             key={photoIndex} */}
                 {/*             src={photo} */}
                 {/*             alt={`${material.type} photo ${photoIndex + 1}`} */}
                 {/*             className="text-sm text-muted-foreground"> */}
                 {/*             {formatWeight(material.kg)} */}
                 {/*           </span> */}
                 {/*         </div> */}
                 {/*         {material.photos.length > 0 && ( */}
                 {/*           <div className="grid grid-cols-4 gap-2"> */}
                 {/*             {material.photos.map((photo, photoIndex) => ( */}
                 {/*               <img */}
                 {/*                 key={photoIndex} */}
                 {/*                 src={photo} */}
                 {/*                 alt={`${material.type} photo ${photoIndex + 1}`} */}
                 {/*                 className="w-full h-20 object-cover rounded border" */}
                 {/*               /> */}
                 {/*             ))} */}
                 {/*           </div> */}
                 {/*         )} */}
                 {/*       </div> */}
                 {/*     ))} */}
                 {/*   </div> */}
                 {/* ))} */}
                 <p className="text-muted-foreground text-sm">
                   Materials details and photos will be displayed here upon fetching from `pickup_materials` table.
                 </p>
                 {/* Example of how to display total kg from main pickup record */}
                 {selectedPickup.total_kg > 0 && (
                   <div className="p-3 rounded-lg border bg-muted/50">
                     <span className="font-medium">Total Collected: {formatWeight(selectedPickup.total_kg)}</span>
                   </div>
                 )}
               </div>
             </div>

            {/* Admin Actions */}
            {selectedPickup.status === 'pending' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add notes about this pickup..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleApprove(selectedPickup)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Pickup
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleReject(selectedPickup)}
                    disabled={!adminNotes.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Pickup
                  </Button>
                </div>
              </div>
            )}

                         {/* Payment Update */}
             {selectedPickup.status === 'approved' && selectedPickup.payment_status === 'pending' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handlePaymentUpdate(selectedPickup)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
