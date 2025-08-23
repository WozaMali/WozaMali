import AdminFund from "@/pages/AdminFund";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminFundPage() {
  return (
    <AdminRoute>
      <AdminFund />
    </AdminRoute>
  );
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
