import AdminAnalytics from "@/pages/AdminAnalytics";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminAnalyticsPage() {
  return (
    <AdminRoute>
      <AdminAnalytics />
    </AdminRoute>
  );
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
