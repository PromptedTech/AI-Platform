import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';

export default function MyAIs() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form fields
  const [aiName, setAiName] = useState('');
  const [description, setDescription] = useState('');
  const [behaviorPrompt, setBehaviorPrompt] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Saved AIs
  const [customAIs, setCustomAIs] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push('/');
        return;
      }
      
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Load user's custom AIs
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'customAIs'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ais = [];
      snapshot.forEach((doc) => {
        ais.push({ id: doc.id, ...doc.data() });
      });
      setCustomAIs(ais);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !aiName.trim() || !behaviorPrompt.trim()) {
      setMessage('Please fill in AI Name and Behavior Prompt at minimum.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'customAIs'), {
        uid: user.uid,
        name: aiName.trim(),
        description: description.trim(),
        prompt: behaviorPrompt.trim(),
        avatar: avatarUrl.trim(),
        createdAt: new Date().toISOString(),
      });
      
      // Clear form
      setAiName('');
      setDescription('');
      setBehaviorPrompt('');
      setAvatarUrl('');
      
      setMessage('AI persona created successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating AI:', error);
      setMessage('Error creating AI. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (aiId) => {
    if (!confirm('Are you sure you want to delete this AI persona?')) return;

    try {
      await deleteDoc(doc(db, 'customAIs', aiId));
      setMessage('AI persona deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting AI:', error);
      setMessage('Error deleting AI. Please try again.');
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Custom AIs</h1>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create AI Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New AI Persona</h2>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Name *
                </label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  placeholder="e.g., Creative Writer, Code Assistant"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of this AI's purpose"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Behavior Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Behavior Prompt *
              </label>
              <textarea
                value={behaviorPrompt}
                onChange={(e) => setBehaviorPrompt(e.target.value)}
                placeholder="Define how this AI should behave. E.g., 'You are a helpful creative writing assistant who provides detailed feedback and suggestions.'"
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('successfully') 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}>
                {message}
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Creating...' : 'Create AI Persona'}
            </button>
          </form>
        </div>

        {/* Saved AIs List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your AI Personas ({customAIs.length})
          </h2>
          
          {customAIs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors duration-200">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-lg text-gray-600 dark:text-gray-400">No AI personas yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Create your first custom AI using the form above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customAIs.map((ai) => (
                <div
                  key={ai.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Avatar */}
                  {ai.avatar && (
                    <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      <img
                        src={ai.avatar}
                        alt={ai.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {ai.name}
                    </h3>
                    
                    {ai.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {ai.description}
                      </p>
                    )}
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Behavior:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {ai.prompt}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(ai.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard?persona=${ai.id}`)}
                          className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                          title="Chat with this AI"
                        >
                          Chat
                        </button>
                        <button
                          onClick={() => handleDelete(ai.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete AI"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

