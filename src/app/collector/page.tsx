import CollectorUI from '@/components/CollectorUI';
import ProtectedCollectorRoute from '@/components/ProtectedCollectorRoute';

// For static export, we need to handle dynamic content client-side
export default function CollectorPage() {
  return (
    <ProtectedCollectorRoute>
      <CollectorUI />
    </ProtectedCollectorRoute>
  );
}
