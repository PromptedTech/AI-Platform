import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getSharedContent } from '../../../lib/share';
import { useTheme } from '../../../contexts/ThemeContext';
import { Sparkles, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SharedChat() {
  const router = useRouter();
  const { id } = router.query;
  const { isDark } = useTheme();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadContent() {
      try {
        const data = await getSharedContent(id);
        if (data && data.type === 'chat') {
          setContent(data);
        } else {
          setError('Shared content not found');
        }
      } catch (err) {
        console.error('Error loading shared content:', err);
        setError('Failed to load shared content');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading shared conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Content Not Found
          </h1>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {error || 'This shared conversation could not be found.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Shared AI Conversation
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Powered by {content.model || 'AI'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              title="Copy link"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              )}
            </button>
          </div>
          
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Shared on {new Date(content.createdAt?.toDate()).toLocaleDateString()}
          </div>
        </div>

        {/* Conversation */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 space-y-6`}>
          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-3xl bg-primary-600 text-white rounded-lg px-4 py-3">
              <p className="whitespace-pre-wrap">{content.message}</p>
            </div>
          </div>

          {/* AI Response */}
          <div className="flex justify-start">
            <div className={`max-w-3xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${isDark ? 'text-gray-100' : 'text-gray-900'} rounded-lg px-4 py-3`}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content.response}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`mt-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8`}
        >
          <p className={`text-lg mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Want to create your own AI conversations?
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Try AI Platform for Free
          </button>
          <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Made with AI Platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}

