'use client';

import { SessionProvider } from 'next-auth/react';
import { Providers } from './Providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/auth')) {
      router.push('/auth/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user && !pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <Providers>
      <SessionProvider>
        <div className="min-h-screen bg-gray-50">
          {user && !pathname.startsWith('/auth') && <Sidebar />}
          <div className={cn('transition-all duration-300', user && !pathname.startsWith('/auth') ? 'lg:pl-64' : '')}>
            {user && !pathname.startsWith('/auth') && <Header />}
            <main className="p-4 lg:p-6">
              {children}
            </main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </div>
      </SessionProvider>
    </Providers>
  );
}