import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Eye, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock withdrawal data
const mockWithdrawals = [
  {
    id: "WD001",
    userId: "1",
    userName: "Sarah Johnson",
    userEmail: "sarah.j@email.com",
    bankName: "FNB",
    accountNumber: "****1234",
    amount: 450.00,
    status: "Pending",
    createdAt: "2024-03-15T10:30:00",
    notes: ""
  },
  {
    id: "WD002", 
    userId: "2",
    userName: "Michael Chen",
    userEmail: "m.chen@email.com",
    bankName: "Standard Bank",
    accountNumber: "****5678",
    amount: 1200.00,
    status: "Approved",
    createdAt: "2024-03-14T14:20:00",
    approvedAt: "2024-03-14T16:45:00",
    notes: "Verified - large recycling contributor"
  },
  {
    id: "WD003",
    userId: "3", 
    userName: "Nomsa Mthembu",
    userEmail: "nomsa.m@email.com",
    bankName: "ABSA",
    accountNumber: "****9012",
    amount: 850.00,
    status: "Pending",
    createdAt: "2024-03-15T09:15:00",
    notes: ""
  },
  {
    id: "WD004",
    userId: "4",
    userName: "David Williams", 
    userEmail: "d.williams@email.com",
    bankName: "Capitec",
    accountNumber: "****3456",
    amount: 250.00,
    status: "Rejected",
    createdAt: "2024-03-13T11:00:00",
    rejectedAt: "2024-03-13T13:30:00",
    notes: "Insufficient verification documents"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending': return 'bg-warning text-warning-foreground';
    case 'Approved': return 'bg-success text-success-foreground';
    case 'Rejected': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Pending': return <Clock className="h-4 w-4" />;
    case 'Approved': return <CheckCircle className="h-4 w-4" />;
    case 'Rejected': return <XCircle className="h-4 w-4" />;
    default: return null;
  }
};

const AdminWithdrawals = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const { toast } = useToast();

  const filteredWithdrawals = mockWithdrawals.filter(withdrawal => {
    return statusFilter === "all" || withdrawal.status.toLowerCase() === statusFilter;
  });

  const statusStats = {
    total: mockWithdrawals.length,
    pending: mockWithdrawals.filter(w => w.status === 'Pending').length,
    approved: mockWithdrawals.filter(w => w.status === 'Approved').length,
    rejected: mockWithdrawals.filter(w => w.status === 'Rejected').length,
    totalAmount: mockWithdrawals.reduce((sum, w) => sum + w.amount, 0)
  };

  const handleReview = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setReviewNotes(withdrawal.notes || "");
    setIsReviewDialogOpen(true);
  };

  const handleApprove = () => {
    toast({
      title: "Withdrawal Approved",
      description: `Withdrawal ${selectedWithdrawal?.id} has been approved successfully.`,
    });
    setIsReviewDialogOpen(false);
  };

  const handleReject = () => {
    toast({
      title: "Withdrawal Rejected", 
      description: `Withdrawal ${selectedWithdrawal?.id} has been rejected.`,
      variant: "destructive"
    });
    setIsReviewDialogOpen(false);
  };

  return (
    <AdminLayout currentPage="withdrawals">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{statusStats.total}</div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold text-foreground">{statusStats.pending}</div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-foreground">{statusStats.approved}</div>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">R {statusStats.totalAmount.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Requests */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Withdrawal Requests</CardTitle>
            <CardDescription>
              Review and process user withdrawal requests from their recycling earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex justify-between items-center mb-6">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              {statusStats.pending > 0 && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{statusStats.pending} urgent requests</span>
                </Badge>
              )}
            </div>

            {/* Withdrawals Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">
                        {withdrawal.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{withdrawal.userName}</div>
                          <div className="text-sm text-muted-foreground">{withdrawal.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{withdrawal.bankName}</div>
                          <div className="text-sm text-muted-foreground">{withdrawal.accountNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-lg">
                        R {withdrawal.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(withdrawal.status)} flex items-center space-x-1 w-fit`}>
                          {getStatusIcon(withdrawal.status)}
                          <span>{withdrawal.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleReview(withdrawal)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review Withdrawal Request</DialogTitle>
              <DialogDescription>
                Request ID: {selectedWithdrawal?.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">User Details</h4>
                <p className="text-sm"><strong>Name:</strong> {selectedWithdrawal?.userName}</p>
                <p className="text-sm"><strong>Email:</strong> {selectedWithdrawal?.userEmail}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Withdrawal Details</h4>
                <p className="text-sm"><strong>Bank:</strong> {selectedWithdrawal?.bankName}</p>
                <p className="text-sm"><strong>Account:</strong> {selectedWithdrawal?.accountNumber}</p>
                <p className="text-sm"><strong>Amount:</strong> R {selectedWithdrawal?.amount.toFixed(2)}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Review Notes</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this withdrawal request..."
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleReject}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;