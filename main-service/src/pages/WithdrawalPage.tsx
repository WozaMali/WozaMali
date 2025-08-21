"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const WithdrawalPage = () => {
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const navigate = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // API call would go here
    alert(`Withdrawal of R${amount} requested`);
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
            <CardTitle>Request Withdrawal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="bank">Bank Name</Label>
                <Input
                  id="bank"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="account">Account Number</Label>
                <Input
                  id="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (R)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Request Withdrawal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawalPage;