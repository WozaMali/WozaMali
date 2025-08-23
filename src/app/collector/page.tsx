import CollectorUI from '@/components/CollectorUI';
import ProtectedCollectorRoute from '@/components/ProtectedCollectorRoute';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function CollectorPage() {
  return (
    <ProtectedCollectorRoute>
      <CollectorUI />
    </ProtectedCollectorRoute>
  );
}
