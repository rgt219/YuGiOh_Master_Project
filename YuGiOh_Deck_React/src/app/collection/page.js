import ProtectedRoute from '@/components/ProtectedRoute';
import CollectionPage from '@/app/collection/CollectionPage';

export const metadata = {
  title: 'My Collection | ErreGeTeYGO',
  robots: { index: false }, // a private page: keep it out of search results
};

export default function Page() {
  return (
    <ProtectedRoute>
      <CollectionPage />
    </ProtectedRoute>
  );
}