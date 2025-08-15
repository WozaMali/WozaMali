import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // API call would go here
    alert(`Registered ${email}`);
    navigate("/");
  };

  return (
    <div 
      className="min-h-screen bg-gradient-warm flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url("/WozaMali-uploads/f6006743-2187-4d7a-8b7c-c77f6b6feda8.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className="bg-card/95 backdrop-blur-sm rounded-lg p-8 w-full max-w-md text-center shadow-warm border border-border/50">
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <Logo className="h-20 w-auto" alt="Woza Mali Logo" variant="woza-mali" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Join Woza Mali</h1>
          <p className="text-muted-foreground">Start recycling and earning today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="text-left">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Already a member?{" "}
          <button 
            onClick={() => navigate("/")}
            className="text-primary hover:underline font-medium"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;