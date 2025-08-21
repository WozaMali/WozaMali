import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  Truck,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  getRoleDisplayName, 
  getRoleColor, 
  getUserInitials, 
  getUserFullName,
  getUserDashboardInfo 
} from "@/lib/auth-schema";

export function UserProfile() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  const dashboardInfo = getUserDashboardInfo(user);
  const roleColor = getRoleColor(user.role);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-medium">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-medium">{getUserFullName(user)}</span>
            <Badge variant="outline" className={`text-xs ${roleColor}`}>
              {user.role === 'COLLECTOR' ? <Truck className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
              {getRoleDisplayName(user.role)}
            </Badge>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getUserFullName(user)}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <Badge variant="outline" className={`text-xs mt-1 ${roleColor}`}>
              {user.role === 'COLLECTOR' ? <Truck className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
              {getRoleDisplayName(user.role)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Role-specific information */}
        {user.role === 'COLLECTOR' && (
          <>
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              <div className="font-medium mb-1">Collector Stats</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Collections:</span>
                  <span className="font-medium">{(user as any).totalCollections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Kg:</span>
                  <span className="font-medium">{(user as any).totalKgCollected.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Points:</span>
                  <span className="font-medium">{(user as any).totalPoints}</span>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {user.role === 'STAFF' && (
          <>
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              <div className="font-medium mb-1">Department</div>
              <div>{(user as any).department || 'Not specified'}</div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Quick actions */}
        <DropdownMenuItem asChild>
          <a href={user.role === 'COLLECTOR' ? '/collector' : '/admin'} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a href="/calculator" className="cursor-pointer">
            <Truck className="mr-2 h-4 w-4" />
            <span>Calculator</span>
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
