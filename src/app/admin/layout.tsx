'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated') === 'true';
      setIsAuth(isAuthenticated);

      if (!isAuthenticated && pathname !== '/admin') {
        router.replace('/admin');
      } else if (isAuthenticated && pathname === '/admin') {
        router.replace('/admin/dashboard');
      }
    } catch (error) {
        // Handle cases where sessionStorage is not available
        console.error("Could not access sessionStorage", error);
        setIsAuth(false);
        if (pathname !== '/admin') {
            router.replace('/admin');
        }
    }
  }, [pathname, router]);

  // While checking authentication, show a loading state or nothing
  if (isAuth === null) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
    );
  }

  // If on the login page, render it regardless of auth (it will redirect if needed)
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  // If authenticated and not on login page, show the content
  if (isAuth) {
    return <>{children}</>;
  }
  
  // This part should technically not be reached due to the redirect, but it's a good fallback
  return null;
}
