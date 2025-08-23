import AdminWithdrawals from "@/pages/AdminWithdrawals";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminWithdrawalsPage() {
  return (
    <AdminRoute>
      <AdminWithdrawals />
    </AdminRoute>
  );
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
