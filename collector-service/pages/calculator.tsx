import RecyclingCalculatorPage from "@/pages/RecyclingCalculatorPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CalculatorPage() {
  return (
    <ProtectedRoute>
      <RecyclingCalculatorPage />
    </ProtectedRoute>
  );
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
