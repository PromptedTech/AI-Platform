import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';

export default function DemoMode({ onClose }) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasUsedDemo, setHasUsedDemo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || hasUsedDemo) return;

    const userMessage = input.trim();
    setInput('');
    setMessages([{ role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/demo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: userMessage }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText || 'Failed to get response'}`);
      }

      const data = await response.json();
      
      // Check if there's an error in the response
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMessages([
        { role: 'user', content: userMessage },
        { role: 'assistant', content: data.reply }
      ]);
      setHasUsedDemo(true);
    } catch (error) {
      console.error('Demo error:', error);
      console.error('Full error details:', error.message);
      
      let errorMessage = 'Something went wrong. Please sign up to try again!';
      
      // Handle specific OpenAI quota errors
      if (error.message.includes('429') || error.message.includes('quota')) {
        errorMessage = 'Demo temporarily unavailable due to API quota limits. Please sign up for full access!';
      } else if (error.message.includes('API key')) {
        errorMessage = 'Demo configuration issue. Please sign up to try the full version!';
      } else {
        errorMessage = `Demo error: ${error.message}. Please sign up to try again!`;
      }
      
      setMessages([
        { role: 'user', content: userMessage },
        { role: 'assistant', content: errorMessage }
      ]);
      setHasUsedDemo(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Try AI Demo</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white/90 text-sm">
            {hasUsedDemo 
              ? 'Demo complete! Sign up for unlimited access.'
              : 'Ask me anything! You get one free question.'}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Experience AI in Action</p>
              <p className="text-sm">Try asking something like:</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-md mx-auto">
                  "Explain quantum computing in simple terms"
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-md mx-auto">
                  "Write a short poem about the ocean"
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-md mx-auto">
                  "What are the benefits of meditation?"
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input / CTA */}
        {!hasUsedDemo ? (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Thinking...' : 'Ask'}
              </button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              One free question • No credit card required
            </p>
          </div>
        ) : (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ready for unlimited AI conversations?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push('/signup')}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Sign Up Free
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Start with 50 free credits • No credit card required
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

