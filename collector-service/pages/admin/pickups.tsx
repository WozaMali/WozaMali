import AdminPickups from "@/pages/AdminPickups";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminPickupsPage() {
  return (
    <AdminRoute>
      <AdminPickups />
    </AdminRoute>
  );
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
