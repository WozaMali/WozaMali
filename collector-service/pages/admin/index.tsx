import AdminDashboard from "@/pages/AdminDashboard";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminDashboardPage() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}
