import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  return <Dashboard />;
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
