import UserProfile from '@/components/UserProfile';
import ProtectedRoute from '@/components/ProtectedRoute'; // 👈 Import your wrapper

// ⚡ Optional SEO Metadata
export const metadata = {
  title: 'My Profile | ErreGeTeYGO',
  description: 'Manage your saved Yu-Gi-Oh! decklists and account settings.',
};

export default function ProfilePage() {
  return (
    // ⚡ This perfectly mimics your old <Route element={<ProtectedRoute />}> logic
    <ProtectedRoute>
      <UserProfile />
    </ProtectedRoute>
  );
}