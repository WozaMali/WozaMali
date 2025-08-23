import AdminCollections from "@/pages/AdminCollections";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminCollectionsPage() {
  return (
    <AdminRoute>
      <AdminCollections />
    </AdminRoute>
  );
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
