import CollectorLogin from "@/pages/CollectorLogin";

export default function CollectorLoginPage() {
  return <CollectorLogin />;
}

// Disable static generation to prevent SSR issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
