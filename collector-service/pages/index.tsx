import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { serviceConfig } from "@/lib/serviceConfig";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminWithdrawals from "@/pages/AdminWithdrawals";
import AdminRewards from "@/pages/AdminRewards";
import AdminFund from "@/pages/AdminFund";
import AdminCollections from "@/pages/AdminCollections";
import AdminPickups from "@/pages/AdminPickups";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminConfig from "@/pages/AdminConfig";
import RecyclingCalculatorPage from "@/pages/RecyclingCalculatorPage";
import CollectorDashboard from "@/pages/CollectorDashboard";
import CollectorLogin from "@/pages/CollectorLogin";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute, AdminRoute, CollectorRoute } from "@/components/ProtectedRoute";

export default function HomePage() {
  const router = useRouter();
  const { serviceType, features } = serviceConfig;
  const isOffice = serviceType === 'office';
  const isCollector = serviceType === 'collector';

  // Handle routing based on path
  const { pathname } = router;
  
  // Default route - show login
  if (pathname === '/') {
    return <Login />;
  }

  // Office-specific routes
  if (isOffice && features.adminPanel) {
    if (pathname === '/dashboard') return <Index />;
    if (pathname === '/admin') return <AdminRoute><AdminDashboard /></AdminRoute>;
    if (pathname === '/admin/users') return <AdminRoute><AdminUsers /></AdminRoute>;
    if (pathname === '/admin/withdrawals') return <AdminRoute><AdminWithdrawals /></AdminRoute>;
    if (pathname === '/admin/rewards') return <AdminRoute><AdminRewards /></AdminRoute>;
    if (pathname === '/admin/fund') return <AdminRoute><AdminFund /></AdminRoute>;
    if (pathname === '/admin/collections') return <AdminRoute><AdminCollections /></AdminRoute>;
    if (pathname === '/admin/pickups') return <AdminRoute><AdminPickups /></AdminRoute>;
    if (pathname === '/admin/analytics') return <AdminRoute><AdminAnalytics /></AdminRoute>;
    if (pathname === '/admin/config') return <AdminRoute><AdminConfig /></AdminRoute>;
    if (pathname === '/calculator') return <ProtectedRoute><RecyclingCalculatorPage /></ProtectedRoute>;
  }

  // Collector-specific routes
  if (isCollector && features.collectorDashboard) {
    if (pathname === '/collector') return <CollectorRoute><CollectorDashboard /></CollectorRoute>;
    if (pathname === '/collector-login') return <CollectorLogin />;
  }

  // Fallback to NotFound
  return <NotFound />;
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
