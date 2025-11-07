/**
 * Knowledge Base Management Page
 * 
 * Demonstrates complete RAG workflow:
 * - Upload and manage knowledge base files
 * - Chat with AI using uploaded knowledge
 * - View sources used in responses
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import KnowledgeManager from '../components/KnowledgeManager';
import ChatComposer from '../components/ChatComposer';
import SourceBadge from '../components/SourceBadge';
import SEO from '../components/SEO';
import { authenticatedPost } from '../lib/authClient';
import { MessageSquare, Bot, User, Loader } from 'lucide-react';

export default function KnowledgePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'manage'
  const messagesEndRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Send message to chat API with RAG
   */
  const handleSendMessage = async ({ content, model, useKnowledge }) => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Call chat API
      const response = await authenticatedPost('/api/chat', {
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ],
        model,
        useKnowledge,
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();

      // Add AI response with sources
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        model: data.model,
        sources: data.sources || [],
        usage: data.usage,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clear chat history
   */
  const handleClearChat = () => {
    if (confirm('Clear all messages?')) {
      setMessages([]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <SEO 
        title="Knowledge Base - Nova AI"
        description="Upload documents and chat with AI using your own knowledge base"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Knowledge Base</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Upload documents and chat with AI-powered insights
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('chat')}
                className={`
                  px-4 py-3 font-medium text-sm border-b-2 transition-colors
                  ${activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <MessageSquare className="w-4 h-4 inline-block mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`
                  px-4 py-3 font-medium text-sm border-b-2 transition-colors
                  ${activeTab === 'manage'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                Manage Files
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'manage' ? (
            <KnowledgeManager />
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Chat Messages */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-semibold">Chat with Knowledge</h2>
                  {messages.length > 0 && (
                    <button
                      onClick={handleClearChat}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Clear Chat
                    </button>
                  )}
                </div>

                <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Start a conversation!
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          Enable "Knowledge" to use your uploaded documents
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}

                        <div
                          className={`
                            max-w-[80%] rounded-lg p-4
                            ${message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.isError
                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                : 'bg-gray-100 dark:bg-gray-700'
                            }
                          `}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>

                          {/* Model info */}
                          {message.model && (
                            <p className="text-xs opacity-75 mt-2">
                              Model: {message.model}
                            </p>
                          )}

                          {/* Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <SourceBadge sources={message.sources} />
                          )}
                        </div>

                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {isProcessing && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                        <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <ChatComposer
                  onSend={handleSendMessage}
                  disabled={isProcessing}
                  showModelSelector={true}
                  showKnowledgeToggle={true}
                  initialModel="gpt-4o-mini"
                  initialUseKnowledge={true}
                />
              </div>

              {/* Info Panel */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  💡 Tips for using Knowledge Base
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Upload documents in the "Manage Files" tab</li>
                  <li>• Toggle "Knowledge: ON" to use your documents in responses</li>
                  <li>• Select different models for varied response styles</li>
                  <li>• Click source badges to see which documents were used</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
