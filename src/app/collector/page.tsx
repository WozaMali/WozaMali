import CollectorUI from '@/components/CollectorUI';
import ProtectedCollectorRoute from '@/components/ProtectedCollectorRoute';

export default function CollectorPage() {
  return (
    <ProtectedCollectorRoute>
      <CollectorUI />
    </ProtectedCollectorRoute>
  );
}
