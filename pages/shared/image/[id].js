import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSharedContent } from '../../../lib/share';
import { useTheme } from '../../../contexts/ThemeContext';
import { Image as ImageIcon, Copy, Check, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadImageWithWatermark } from '../../../lib/share';

export default function SharedImage() {
  const router = useRouter();
  const { id } = router.query;
  const { isDark } = useTheme();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadContent() {
      try {
        const data = await getSharedContent(id);
        if (data && data.type === 'image') {
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

  const handleDownload = async () => {
    if (!content || downloading) return;
    
    try {
      setDownloading(true);
      await downloadImageWithWatermark(
        content.imageUrl,
        content.prompt,
        `ai-image-${Date.now()}.png`
      );
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to download image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading shared image...</p>
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
            {error || 'This shared image could not be found.'}
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
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Shared AI Image
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Generated with AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors disabled:opacity-50`}
                title="Download with watermark"
              >
                <Download className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
          
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Shared on {new Date(content.createdAt?.toDate()).toLocaleDateString()}
          </div>
        </div>

        {/* Image Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}
        >
          <img
            src={content.imageUrl}
            alt={content.prompt}
            className="w-full rounded-lg shadow-lg mb-4"
          />
          
          <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Prompt:
            </p>
            <p className={`${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {content.prompt}
            </p>
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-center ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8`}
        >
          <p className={`text-lg mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Want to create your own AI images?
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

