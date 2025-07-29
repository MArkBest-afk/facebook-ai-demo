
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import LandingPage from './landing';

const ACCOUNT_ID_STORAGE_KEY = 'tradeSimulatorAccountId';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const leadSignature = searchParams.get('lead_sig');
    let accountId: string | null = null;
    
    try {
        accountId = localStorage.getItem(ACCOUNT_ID_STORAGE_KEY);
    } catch (e) {
        console.error("Could not access localStorage", e);
    }

    if (leadSignature) {
      router.replace(`/trade?lead_sig=${leadSignature}`);
    } else if (accountId) {
      router.replace('/trade');
    } else {
      setIsLoading(false);
    }
  }, [router, searchParams]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <LandingPage />;
}
