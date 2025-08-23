import CollectorDashboard from "@/pages/CollectorDashboard";
import { CollectorRoute } from "@/components/ProtectedRoute";

export default function CollectorPage() {
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
