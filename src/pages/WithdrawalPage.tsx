"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, User, CreditCard, Banknote } from "lucide-react";

// South African Banks with their branch codes
const SOUTH_AFRICAN_BANKS = [
  { name: "ABSA Bank", code: "632005", branchCode: "632005" },
  { name: "First National Bank (FNB)", code: "250655", branchCode: "250655" },
  { name: "Nedbank", code: "198765", branchCode: "198765" },
  { name: "Standard Bank", code: "051001", branchCode: "051001" },
  { name: "Capitec Bank", code: "470010", branchCode: "470010" },
  { name: "African Bank", code: "430000", branchCode: "430000" },
  { name: "Bidvest Bank", code: "462005", branchCode: "462005" },
  { name: "Discovery Bank", code: "679000", branchCode: "679000" },
  { name: "Grindrod Bank", code: "450105", branchCode: "450105" },
  { name: "Investec Bank", code: "580105", branchCode: "580105" },
  { name: "Mercantile Bank", code: "450105", branchCode: "450105" },
  { name: "Sasfin Bank", code: "683000", branchCode: "683000" },
  { name: "TymeBank", code: "678910", branchCode: "678910" },
  { name: "VBS Mutual Bank", code: "198765", branchCode: "198765" }
];

// Account types
const ACCOUNT_TYPES = [
  "Savings Account",
  "Current Account",
  "Cheque Account",
  "Credit Card",
  "Investment Account"
];

const WithdrawalPage = () => {
  const [ownerName, setOwnerName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const navigate = useRouter();

  // Handle bank selection and auto-fill branch code
  const handleBankChange = (bankCode: string) => {
    setSelectedBank(bankCode);
    const bank = SOUTH_AFRICAN_BANKS.find(b => b.code === bankCode);
    if (bank) {
      setBranchCode(bank.branchCode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!ownerName || !accountType || !selectedBank || !branchCode || !accountNumber || !amount) {
      alert("Please fill in all required fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // API call would go here
    const withdrawalData = {
      ownerName,
      accountType,
      bank: SOUTH_AFRICAN_BANKS.find(b => b.code === selectedBank)?.name,
      branchCode,
      accountNumber,
      amount: parseFloat(amount)
    };

    console.log("Withdrawal request:", withdrawalData);
    alert(`Withdrawal of R${amount} requested for ${ownerName}`);
    navigate.push("/");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Withdrawal</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Request Withdrawal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Owner Name */}
              <div>
                <Label htmlFor="ownerName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name of Owner *
                </Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Enter account holder's full name"
                  required
                />
              </div>

              {/* Account Type */}
              <div>
                <Label htmlFor="accountType" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Type of Account *
                </Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bank Selection */}
              <div>
                <Label htmlFor="bank" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bank Name *
                </Label>
                <Select value={selectedBank} onValueChange={handleBankChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOUTH_AFRICAN_BANKS.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Code (Auto-filled) */}
              <div>
                <Label htmlFor="branchCode">Branch Code *</Label>
                <Input
                  id="branchCode"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="Branch code will be auto-filled"
                  required
                  readOnly={!!selectedBank}
                  className={selectedBank ? "bg-muted" : ""}
                />
                {selectedBank && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Branch code automatically filled for {SOUTH_AFRICAN_BANKS.find(b => b.code === selectedBank)?.name}
                  </p>
                )}
              </div>

              {/* Account Number */}
              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter your account number"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <Label htmlFor="amount">Amount (R) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Request Withdrawal
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Important Information</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Withdrawals are processed within 2-3 business days</li>
              <li>• Ensure all banking details are correct</li>
              <li>• Branch codes are automatically filled for major banks</li>
              <li>• Minimum withdrawal amount: R50</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawalPage;