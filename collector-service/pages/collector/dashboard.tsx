import { CollectorRoute } from "@/components/ProtectedRoute";
import CollectorDashboard from "@/pages/CollectorDashboard";

export default function CollectorDashboardPage() {
  return (
    <CollectorRoute>
      <CollectorDashboard />
    </CollectorRoute>
  );
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}



