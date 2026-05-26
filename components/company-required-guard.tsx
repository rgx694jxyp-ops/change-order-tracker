"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type CompanyLandingResponse = {
  ok?: boolean;
  message?: string;
  authenticated?: boolean;
  hasCompany?: boolean;
};

type CompanyRequiredGuardProps = {
  children: ReactNode;
};

export default function CompanyRequiredGuard({ children }: CompanyRequiredGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'allowed' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function checkCompanySetup() {
      try {
        const response = await fetch('/api/auth/landing', { method: 'GET' });
        const result = (await response.json()) as CompanyLandingResponse;

        if (!isMounted) {
          return;
        }

        if (!response.ok || result.ok === false) {
          setStatus('error');
          setErrorMessage(result.message ?? 'Unable to verify company setup.');
          return;
        }

        if (result.authenticated === false) {
          router.replace('/login');
          return;
        }

        if (result.authenticated === true && result.hasCompany === false) {
          router.replace('/onboarding/company');
          return;
        }

        if (result.authenticated === true && result.hasCompany === true) {
          setStatus('allowed');
          return;
        }

        setStatus('error');
        setErrorMessage('Unable to verify company setup.');
      } catch {
        if (!isMounted) {
          return;
        }

        setStatus('error');
        setErrorMessage('Unable to verify company setup. Please refresh the page.');
      }
    }

    checkCompanySetup();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-10">
        <p className="text-center text-sm text-slate-600">Checking company setup...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-10">
        <p className="max-w-md text-center text-sm text-rose-600">{errorMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
