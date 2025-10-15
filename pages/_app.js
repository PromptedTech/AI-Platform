import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { trackLogin } from '../lib/analytics';
import '../styles/globals.css';

function AppContent({ Component, pageProps }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect logic - only for dashboard route
    if (!loading) {
      if (!user && router.pathname === '/dashboard') {
        router.push('/');
      }
      if (user) {
        trackLogin(user.uid).catch(() => {});
      }
    }
  }, [user, loading, router]);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return <Component {...pageProps} user={user} />;
}

export default function App(props) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent {...props} />
      </ThemeProvider>
    </AuthProvider>
  );
}


