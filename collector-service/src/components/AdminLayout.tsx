"use client";

import { useState } from "react";
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  Gift,
  TreePine,
  Calendar,
  Settings,
  Menu,
  X,
  LogOut,
  TrendingUp,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3, page: 'dashboard' },
  { name: 'Users', href: '/admin/users', icon: Users, page: 'users' },
  { name: 'Withdrawals', href: '/admin/withdrawals', icon: CreditCard, page: 'withdrawals' },
  { name: 'Rewards', href: '/admin/rewards', icon: Gift, page: 'rewards' },
  { name: 'Green Scholar Fund', href: '/admin/fund', icon: TreePine, page: 'fund' },
        { name: 'Collections', href: '/admin/collections', icon: Calendar, page: 'collections' },
      { name: 'Pickups', href: '/admin/pickups', icon: Package, page: 'pickups' },
      { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp, page: 'analytics' },
      { name: 'Site Config', href: '/admin/config', icon: Settings, page: 'config' },
];

export function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r border-border shadow-elegant transition-transform duration-300 ease-smooth",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo and brand */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">W</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Woza Mali</h2>
                <p className="text-sm text-muted-foreground">Admin Portal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center">
                  <span className="text-accent-foreground font-medium text-sm">A</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Admin User</p>
                  <p className="text-xs text-muted-foreground">Super Admin</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => logout()}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground capitalize">
              {currentPage === 'dashboard' ? 'Admin Dashboard' : currentPage}
            </h1>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                Recycling Made Simple
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}