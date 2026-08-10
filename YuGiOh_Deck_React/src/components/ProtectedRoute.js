'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children, user }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // ⚡ CHANGED TO sessionStorage to match your Login.js
    const token = typeof window !== 'undefined' ? sessionStorage.getItem("token") : null;

    if (!user && !token) {
      console.warn("ACCESS_DENIED: Redirecting to login terminal...");
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [user, router]);

  if (!isAuthorized) {
    return (
      <div className="md-theme-bg min-vh-100 d-flex justify-content-center align-items-center text-info terminal-font">
        VERIFYING_ACCESS_TOKEN...
      </div>
    );
  }

  return children;
}