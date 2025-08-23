import AdminConfig from "@/pages/AdminConfig";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminConfigPage() {
  return (
    <AdminRoute>
      <AdminConfig />
    </AdminRoute>
  );
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
