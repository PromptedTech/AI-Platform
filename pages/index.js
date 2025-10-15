import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Pricing from '../components/landing/Pricing';
import Footer from '../components/landing/Footer';
import DemoMode from '../components/DemoMode';
import SEO from '../components/SEO';

export default function LandingPage() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [showDemo, setShowDemo] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // If user is logged in, don't show landing page (will redirect)
  if (user) {
    return null;
  }

  return (
    <>
      <SEO />
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Theme Toggle Button - Fixed position */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-700" />
        )}
      </motion.button>

      {/* Auth Links - Fixed position */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed top-6 left-6 z-50 flex items-center gap-4"
      >
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Log in
        </button>
        <button
          onClick={() => router.push('/signup')}
          className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          Sign up
        </button>
      </motion.div>

      {/* Main Content */}
      <Hero onTryDemo={() => setShowDemo(true)} />
      <Features />
      <Pricing />
      <Footer />

      {/* Demo Mode Modal */}
      <AnimatePresence>
        {showDemo && <DemoMode onClose={() => setShowDemo(false)} />}
      </AnimatePresence>
    </div>
    </>
  );
}


