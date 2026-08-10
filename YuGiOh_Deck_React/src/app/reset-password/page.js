import ResetPassword from '@/components/ResetPassword';
import { Suspense } from 'react';

// ⚡ SEO Metadata
export const metadata = {
  title: 'Reset Password | ErreGeTeYGO',
  description: 'Reset your ErreGeTeYGO account password securely.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="md-theme-bg min-vh-100 d-flex align-items-center justify-content-center text-info terminal-font">
        LOADING_SECURITY_TERMINAL...
      </div>
    }>
      <ResetPassword />
    </Suspense>
  );
}