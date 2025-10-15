import { useState } from 'react';
import { Share2, Check, Copy, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shareChatMessage, shareImage, copyToClipboard, downloadImageWithWatermark } from '../lib/share';

export default function ShareButton({ 
  type = 'chat', // 'chat' or 'image'
  userId,
  message,
  response,
  model,
  prompt,
  imageUrl,
  className = ''
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    
    try {
      setIsSharing(true);
      let shareUrl;
      
      if (type === 'chat') {
        shareUrl = await shareChatMessage(userId, message, response, model);
      } else if (type === 'image') {
        shareUrl = await shareImage(userId, prompt, imageUrl);
      }
      
      await copyToClipboard(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    if (type !== 'image' || !imageUrl) return;
    
    try {
      const filename = `ai-image-${Date.now()}.png`;
      await downloadImageWithWatermark(imageUrl, prompt, filename);
      setShowMenu(false);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
        title="Share"
      >
        <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 overflow-hidden"
          >
            <button
              onClick={handleShare}
              disabled={isSharing || copied}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Link copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{isSharing ? 'Creating link...' : 'Copy share link'}</span>
                </>
              )}
            </button>

            {type === 'image' && imageUrl && (
              <button
                onClick={handleDownload}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 border-t border-gray-200 dark:border-gray-700"
              >
                <Download className="w-4 h-4" />
                <span>Download with watermark</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}

