import AdminUsers from "@/pages/AdminUsers";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminUsersPage() {
  return (
    <AdminRoute>
      <AdminUsers />
    </AdminRoute>
  );
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
