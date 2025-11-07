/**
 * FirebaseSetupBanner Component
 * 
 * Displays a friendly banner when Firebase is not configured,
 * guiding users to set up their credentials.
 */

import { useState, useEffect } from 'react';
import { AlertCircle, X, ExternalLink } from 'lucide-react';

export default function FirebaseSetupBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if Firebase is configured
    const isConfigured = 
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'AIzaSyD_PLACEHOLDER_GET_FROM_FIREBASE' &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your-project-id';

    if (!isConfigured && !dismissed) {
      setShow(true);
    }
  }, [dismissed]);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Firebase Configuration Required
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              To enable authentication and database features, please configure Firebase in your <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">.env.local</code> file.
            </p>
            <div className="mt-2 flex gap-3">
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
              >
                Open Firebase Console
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => {
                  if (window.confirm('This will open the setup guide. Make sure you have the FIREBASE_SETUP_NOW.md file open.')) {
                    alert('Check the FIREBASE_SETUP_NOW.md file in your project for detailed setup instructions!');
                  }
                }}
                className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
              >
                View Setup Guide
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setDismissed(true);
              setShow(false);
            }}
            className="flex-shrink-0 p-1 text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 rounded"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
