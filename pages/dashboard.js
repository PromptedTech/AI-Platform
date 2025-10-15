import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, where, doc, setDoc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { trackChat, trackImage } from '../lib/analytics';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { getChatTemplates, getImageTemplates } from '../lib/templates';
import { getUserCredits, deductCredits } from '../lib/credits';
import CreditsModal from '../components/CreditsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Image as ImageIcon, Sparkles, Library, User, Coins, Clock, Zap, Bug } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import ShareButton from '../components/ShareButton';

export default function Dashboard({ user }) {
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'image', or 'library'
  // Model selection state (persisted)
  const [chatModel, setChatModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(800);
  // Threads (chat history)
  const [threads, setThreads] = useState([]); // [{id, title, updatedAt}]
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredThread, setHoveredThread] = useState(null);
  const [editingThread, setEditingThread] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  // Templates
  const chatTemplates = getChatTemplates();
  const imageTemplates = getImageTemplates();
  const [showChatTemplates, setShowChatTemplates] = useState(false);
  const [showImageTemplates, setShowImageTemplates] = useState(false);
  // Credits
  const [credits, setCredits] = useState(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  
  // Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  // Profile
  const [displayName, setDisplayName] = useState('');
  // Persona state from customAIs
  const [activePersona, setActivePersona] = useState(null); // {id, name, prompt, avatar}
  const [availablePersonas, setAvailablePersonas] = useState([]); // List of user's custom AIs

  // Load persisted model on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chat:model');
      if (saved) setChatModel(saved);
      const savedTemp = localStorage.getItem('chat:temperature');
      if (savedTemp) setTemperature(parseFloat(savedTemp));
      const savedMax = localStorage.getItem('chat:maxTokens');
      if (savedMax) setMaxTokens(parseInt(savedMax, 10));
    } catch {}
  }, []);

  // Load user credits, profile, and persona if provided via query
  useEffect(() => {
    if (!user) return;
    const loadUserData = async () => {
      try {
        const balance = await getUserCredits(user.uid);
        setCredits(balance);
        
        // Load display name from profile
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setDisplayName(data.displayName || user.email);
        } else {
          setDisplayName(user.email);
        }

        // Load persona by id from router query
        const personaId = router.query?.persona;
        if (personaId) {
          try {
            const personaSnap = await getDoc(doc(db, 'customAIs', String(personaId)));
            if (personaSnap.exists() && personaSnap.data().uid === user.uid) {
              const p = personaSnap.data();
              setActivePersona({ id: personaId, name: p.name, prompt: p.prompt, avatar: p.avatar });
            } else {
              setActivePersona(null);
            }
          } catch (e) {
            setActivePersona(null);
          }
        } else {
          setActivePersona(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setDisplayName(user.email);
      }
    };
    loadUserData();
  }, [user, router.query]);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageHistory, setImageHistory] = useState([]);
  // Error states
  const [chatError, setChatError] = useState('');
  const [imageError, setImageError] = useState('');
  // Timing (chat latency)
  const thinkTimerRef = useRef(null);
  const thinkStartRef = useRef(0);
  const [thinkElapsed, setThinkElapsed] = useState(0);
  const [lastResponseTime, setLastResponseTime] = useState(null);

  // Load user's threads (chat history)
  useEffect(() => {
    if (!user) return;
    const qThreads = query(
      collection(db, 'threads'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsubThreads = onSnapshot(qThreads, (snap) => {
      const items = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({ id: d.id, title: data.title || 'New Chat', updatedAt: data.updatedAt });
      });
      setThreads(items);
      // If no active thread selected, auto select most recent
      if (!activeThreadId && items.length > 0) {
        setActiveThreadId(items[0].id);
      }
    });
    return () => unsubThreads();
  }, [user]);

  // Load user's custom AI personas
  useEffect(() => {
    if (!user) return;
    const qPersonas = query(
      collection(db, 'customAIs'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubPersonas = onSnapshot(qPersonas, (snap) => {
      const personas = [];
      snap.forEach((d) => {
        const data = d.data();
        personas.push({ 
          id: d.id, 
          name: data.name, 
          prompt: data.prompt, 
          avatar: data.avatar 
        });
      });
      setAvailablePersonas(personas);
    });
    return () => unsubPersonas();
  }, [user]);

  // Load messages for active thread
  useEffect(() => {
    if (!user || !activeThreadId) return;
    const qMsgs = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid),
      where('threadId', '==', activeThreadId),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(qMsgs, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({ role: data.role, content: data.content, timestamp: data.timestamp });
      });
      setMessages(list);
    });
    return () => unsub();
  }, [user, activeThreadId]);
  const deriveTitle = (text) => {
    const t = (text || '').replace(/\n/g, ' ').trim();
    return t.length > 40 ? t.slice(0, 40) + '…' : t || 'New Chat';
  };

  const ensureActiveThread = async () => {
    if (activeThreadId) return activeThreadId;
    // Create a new thread
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    await setDoc(doc(db, 'threads', newId), {
      userId: user.uid,
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
    });
    setActiveThreadId(newId);
    return newId;
  };

  const handleNewChat = async () => {
    if (!user) return;
    const id = await ensureActiveThread();
    // Start a fresh thread regardless
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    await setDoc(doc(db, 'threads', newId), {
      userId: user.uid,
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
    });
    setActiveThreadId(newId);
    setMessages([]);
  };

  const handleRenameThread = async (threadId, newTitle) => {
    if (!user || !newTitle.trim()) return;
    try {
      await updateDoc(doc(db, 'threads', threadId), {
        title: newTitle.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditingThread(null);
      setEditTitle('');
    } catch (error) {
      console.error('Error renaming thread:', error);
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!user) return;
    try {
      // Delete all messages in this thread
      const messagesQuery = query(
        collection(db, 'chats'),
        where('userId', '==', user.uid),
        where('threadId', '==', threadId)
      );
      
      // Note: Firestore doesn't support batch delete in client SDK easily
      // For now, we'll delete the thread and let messages be orphaned
      // In production, you'd want to use a Cloud Function for this
      await deleteDoc(doc(db, 'threads', threadId));
      
      // If this was the active thread, clear it
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
      
      // Close modal
      setShowDeleteModal(false);
      setThreadToDelete(null);
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const confirmDeleteThread = (thread) => {
    setThreadToDelete(thread);
    setShowDeleteModal(true);
  };

  // Load image history from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'images'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedImages = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedImages.push({
          url: data.imageUrl,
          prompt: data.prompt,
          timestamp: data.timestamp,
        });
      });
      setImageHistory(loadedImages);
      if (loadedImages.length > 0 && !generatedImage) {
        setGeneratedImage(loadedImages[0]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle chat submission
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    setChatError('');
    setLastResponseTime(null);

    // Check credits before sending (client-side only)
    if (typeof credits === 'number' && credits < 1) {
      setChatError('Insufficient credits to send message.');
      return;
    }

    // Deduct credit optimistically on client
    const originalCredits = credits;
    setCredits((prev) => (typeof prev === 'number' ? Math.max(prev - 1, 0) : prev));

    const userMessage = { role: 'user', content: chatInput };
    const threadId = await ensureActiveThread();
    const updatedMessages = [...messages, userMessage];
    // Optimistically render user's message
    setMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);
    // start timing
    setThinkElapsed(0);
    thinkStartRef.current = Date.now();
    if (thinkTimerRef.current) clearInterval(thinkTimerRef.current);
    thinkTimerRef.current = setInterval(() => {
      setThinkElapsed(Math.floor((Date.now() - thinkStartRef.current) / 1000));
    }, 1000);

    try {
      // Save user message to Firestore
      await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        threadId,
        role: 'user',
        content: userMessage.content,
        timestamp: new Date().toISOString(),
      });
      // Update thread metadata (title on first message)
      const tRef = doc(db, 'threads', threadId);
      const tSnap = await getDoc(tRef);
      const nowIso = new Date().toISOString();
      if (tSnap.exists()) {
        const current = tSnap.data();
        await updateDoc(tRef, {
          updatedAt: nowIso,
          title: current.title && current.title !== 'New Chat' ? current.title : deriveTitle(userMessage.content),
        });
      }

      // Get AI response
      // Send custom prompt both as system message AND as customPrompt field for flexibility
      const systemMessages = activePersona?.prompt
        ? [{ role: 'system', content: activePersona.prompt }]
        : [];
      
      // Use last 5 message pairs (10 messages) + current for context efficiency
      // This maintains conversation memory while saving tokens
      const lastMessages = updatedMessages.slice(-10); // Last 10 messages (5 pairs)
      
      const response = await axios.post('/api/chat', {
        messages: [...systemMessages, ...lastMessages],
        model: chatModel,
        temperature,
        max_tokens: maxTokens,
        uid: user.uid,
        customPrompt: activePersona?.prompt || null, // Optional: send as separate field too
      });
      if (response.data?.error) {
        setChatError(response.data.error);
      } else {
      const assistantMessage = {
        role: 'assistant',
        content: response.data.reply,
      };

             // Save assistant message to Firestore
      await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        threadId,
        role: 'assistant',
        content: assistantMessage.content,
        timestamp: new Date().toISOString(),
      });
             // Track analytics
             try { await trackChat(user.uid); } catch (e) { console.warn('trackChat failed', e); }
      await updateDoc(doc(db, 'threads', threadId), { updatedAt: new Date().toISOString() });
      // Optimistically render assistant message
      setMessages([...updatedMessages, assistantMessage]);
      // capture total time
      const totalSecs = Math.max(1, Math.floor((Date.now() - thinkStartRef.current) / 1000));
      setLastResponseTime(totalSecs);
      // Save credit deduction to Firestore
      try {
        await deductCredits(user.uid, 1);
      } catch (err) {
        console.error('Error saving credit deduction:', err);
      }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setChatError('Failed to send message. Please try again.');
      // Refund credit on error
      setCredits(originalCredits);
      try {
        const currentBalance = await getUserCredits(user.uid);
        setCredits(currentBalance);
      } catch (err) {
        console.error('Error fetching credits:', err);
      }
    } finally {
      setChatLoading(false);
      if (thinkTimerRef.current) {
        clearInterval(thinkTimerRef.current);
        thinkTimerRef.current = null;
      }
    }
  };

  // Handle image generation
  const handleImageGeneration = async (e) => {
    e.preventDefault();
    if (!imagePrompt.trim() || !user) return;

    setImageError('');

    // Check and deduct credits (5 credits per image)
    const creditResult = await deductCredits(user.uid, 5);
    if (!creditResult.success) {
      setImageError(creditResult.message || 'Insufficient credits to generate image. You need 5 credits.');
      return;
    }
    setCredits(creditResult.newBalance);

    setImageLoading(true);
    setGeneratedImage(null);

    try {
      const response = await axios.post('/api/image', {
        prompt: imagePrompt,
      });
      if (response.data?.error) {
        setImageError(response.data.error);
        return;
      }

      const newImage = {
        url: response.data.imageUrl,
        prompt: imagePrompt,
        timestamp: new Date().toISOString(),
      };

             // Save image to Firestore
      await addDoc(collection(db, 'images'), {
        userId: user.uid,
        imageUrl: newImage.url,
        prompt: newImage.prompt,
        timestamp: newImage.timestamp,
      });
             // Track analytics
             try { await trackImage(user.uid); } catch (e) { console.warn('trackImage failed', e); }

      setGeneratedImage(newImage);
      setImagePrompt(''); // Clear the prompt after successful generation
    } catch (error) {
      console.error('Error generating image:', error);
      setImageError('Failed to generate image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Modern Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-gray-800 dark:to-gray-900 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Left: Branding & User Info */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Platform</h1>
                <p className="text-sm text-white/80">{displayName || user?.email}</p>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Credits Display */}
              {credits !== null && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreditsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-white"
                  title="Get more credits"
                >
                  <Coins className="w-5 h-5" />
                  <span className="font-semibold">{credits}</span>
                  <span className="text-xs opacity-80">credits</span>
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFeedbackModal(true)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-white"
                title="Report Bug / Feedback"
              >
                <Bug className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/profile')}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-white"
                title="View Profile"
              >
                <User className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-white"
                title={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Modern Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2">
          <nav className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'chat'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat {activePersona ? `· ${activePersona.name}` : ''}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'image'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Images</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'library'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Library</span>
            </motion.button>
          </nav>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 flex gap-3 sm:gap-6">
        {/* Sidebar - Threads */}
        <aside className="w-64 shrink-0 hidden md:flex md:flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md h-[calc(100vh-180px)] transition-all duration-200">
          {/* New Chat Button */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={handleNewChat} 
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">New chat</span>
            </button>
          </div>

          {/* Search Chats */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search chats"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Library Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setActiveTab('library')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-medium">Library</span>
            </button>
          </div>

          {/* My AIs Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => router.push('/my-ais')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-medium">My AIs</span>
            </button>
          </div>

          {/* Threads List */}
          <div className="overflow-y-auto p-2 space-y-1 flex-1">
            {threads.filter(t => 
              !searchQuery || (t.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 p-2">
                {searchQuery ? 'No matching chats' : 'No chats yet'}
              </div>
            ) : (
              threads
                .filter(t => 
                  !searchQuery || (t.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((t) => (
                  <div
                    key={t.id}
                    className="relative group"
                    onMouseEnter={() => setHoveredThread(t.id)}
                    onMouseLeave={() => setHoveredThread(null)}
                  >
                    {editingThread === t.id ? (
                      <div className="px-3 py-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => {
                            if (editTitle.trim()) {
                              handleRenameThread(t.id, editTitle);
                            } else {
                              setEditingThread(null);
                              setEditTitle('');
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editTitle.trim()) {
                                handleRenameThread(t.id, editTitle);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingThread(null);
                              setEditTitle('');
                            }
                          }}
                          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setActiveThreadId(t.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            activeThreadId === t.id
                              ? 'bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-white'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          <div className="truncate pr-8">{t.title || 'New Chat'}</div>
                        </button>
                        
                        {/* Three dots menu - only show on hover */}
                        {hoveredThread === t.id && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle menu
                                }}
                                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              
                              {/* Dropdown menu */}
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingThread(t.id);
                                    setEditTitle(t.title || 'New Chat');
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md"
                                >
                                  Rename
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteThread(t);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-md"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
            )}
          </div>
        </aside>
        {activeTab === 'chat' ? (
          // Chat Interface
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-[calc(100vh-250px)] sm:h-[calc(100vh-250px)] flex flex-col transition-colors duration-200 flex-1 w-full">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activePersona && (
                <div className="flex items-center gap-3 p-3 mb-2 bg-primary-50 dark:bg-gray-700 rounded-md">
                  {activePersona.avatar && (
                    <img src={activePersona.avatar} alt={activePersona.name} className="w-6 h-6 rounded-full object-cover" />
                  )}
                  <span className="text-sm text-primary-700 dark:text-white">Persona active: <span className="font-medium">{activePersona.name}</span></span>
                  <button
                    onClick={() => {
                      const q = { ...router.query };
                      delete q.persona;
                      router.push({ pathname: '/dashboard', query: q });
                    }}
                    className="ml-auto text-xs text-gray-600 dark:text-gray-300 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
                  <p className="text-lg">Start a conversation with GPT-4</p>
                  <p className="text-sm mt-2">Ask anything you'd like to know!</p>
                  <button
                    onClick={() => setShowChatTemplates(!showChatTemplates)}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {showChatTemplates ? 'Hide Templates' : 'Browse Templates'}
                  </button>
                  {showChatTemplates && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                      {chatTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setChatInput(template.prompt);
                            setShowChatTemplates(false);
                          }}
                          className="text-left p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                        >
                          <div className="font-medium text-gray-900 dark:text-white mb-1">{template.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{template.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div
                        className={`max-w-3xl rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                      {message.role === 'assistant' && index > 0 && (
                        <ShareButton
                          type="chat"
                          userId={user.uid}
                          message={messages[index - 1]?.content || ''}
                          response={message.content}
                          model={chatModel}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
              <AnimatePresence>
                {chatLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Thinking{thinkElapsed > 0 ? ` for ${thinkElapsed}s` : '...'}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {lastResponseTime !== null && !chatLoading && !chatError && (
                <div className="flex justify-start">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Replied in {lastResponseTime}s</div>
                </div>
              )}
              <AnimatePresence>
                {chatError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-2"
                  >
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-2">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">{chatError}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {/* AI Persona Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">AI Persona:</span>
                <select
                  value={activePersona?.id || ''}
                  onChange={(e) => {
                    const personaId = e.target.value;
                    if (!personaId) {
                      setActivePersona(null);
                    } else {
                      const found = availablePersonas.find(p => p.id === personaId);
                      if (found) {
                        setActivePersona(found);
                      }
                    }
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Default AI</option>
                  {availablePersonas.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
                </select>
                {activePersona && activePersona.avatar && (
                  <img src={activePersona.avatar} alt={activePersona.name} className="w-6 h-6 rounded-full object-cover" />
                )}
              </div>

              {/* Controls Below Chatbox (Cursor-like) */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="opacity-80">Model</span>
                  <select
                    value={chatModel}
                    onChange={(e) => {
                      setChatModel(e.target.value);
                      try { localStorage.setItem('chat:model', e.target.value); } catch {}
                    }}
                    className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (recommended)</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    <option value="gpt-4o">gpt-4o (if available)</option>
                    <option value="gpt-4">gpt-4 (if available)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="opacity-80">Temp</span>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setTemperature(v);
                      try { localStorage.setItem('chat:temperature', String(v)); } catch {}
                    }}
                    className="w-32"
                  />
                  <span className="tabular-nums w-8 text-center">{temperature.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="opacity-80">Max tokens</span>
                  <input
                    type="number"
                    min={1}
                    max={4000}
                    value={maxTokens}
                    onChange={(e) => {
                      const v = parseInt(e.target.value || '0', 10);
                      setMaxTokens(Number.isNaN(v) ? 1 : v);
                      try { localStorage.setItem('chat:maxTokens', String(v)); } catch {}
                    }}
                    className="w-20 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={chatLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
                <motion.button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim() || credits < 1}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  <span>Send</span>
                  <span className="text-xs opacity-75">(1 credit)</span>
                </motion.button>
              </form>
            </div>
          </div>
        ) : activeTab === 'library' ? (
          // Library Interface - All Images
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-[calc(100vh-250px)] flex flex-col transition-colors duration-200 flex-1">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Image Library</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">All your generated images</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {imageHistory.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg">No images generated yet</p>
                  <p className="text-sm mt-2">Create your first image in the Generate Images tab</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {imageHistory.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-200"
                    >
                      <div className="relative group">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200"></div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Prompt:</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{image.prompt}</p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(image.timestamp).toLocaleDateString()}
                            </span>
                            <ShareButton
                              type="image"
                              userId={user.uid}
                              prompt={image.prompt}
                              imageUrl={image.url}
                            />
                          </div>
                          <motion.a
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                          >
                            Open
                          </motion.a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Image Generation Interface
          <div className="space-y-6">
            {/* Generation Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Generate AI Images with DALL-E 3
                </h2>
                <button
                  onClick={() => setShowImageTemplates(!showImageTemplates)}
                  className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {showImageTemplates ? 'Hide Templates' : 'Templates'}
                </button>
              </div>
              
              {showImageTemplates && (
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {imageTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setImagePrompt(template.prompt);
                        setShowImageTemplates(false);
                      }}
                      className="text-left p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">{template.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{template.description}</div>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleImageGeneration} className="space-y-4">
                <div>
                  <label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describe the image you want to create
                  </label>
                  <textarea
                    id="imagePrompt"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g., A serene landscape with mountains at sunset, painted in watercolor style"
                    rows={3}
                    disabled={imageLoading}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={imageLoading || !imagePrompt.trim() || credits < 5}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {imageLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Image (5 credits)'
                  )}
                </motion.button>
              </form>
            </div>

            {/* Generated Image Display */}
            <AnimatePresence>
              {imageLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200"
                >
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      {/* Pulsing Image Skeleton */}
                      <div className="relative">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-primary-600 dark:text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">Generating your masterpiece...</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may take a moment</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {imageError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">{imageError}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {generatedImage && !imageLoading && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Image</h3>
                  <ShareButton
                    type="image"
                    userId={user.uid}
                    prompt={generatedImage.prompt}
                    imageUrl={generatedImage.url}
                  />
                </div>
                <div className="space-y-4">
                  <img
                    src={generatedImage.url}
                    alt={generatedImage.prompt}
                    className="w-full rounded-lg shadow-lg"
                  />
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Prompt:</p>
                    <p className="text-gray-900 dark:text-gray-100">{generatedImage.prompt}</p>
                  </div>
                  <a
                    href={generatedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-green-500 transition-colors"
                  >
                    Open in New Tab
                  </a>
                </div>
              </div>
            )}

            {/* Image History */}
            {imageHistory.length > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imageHistory.slice(1).map((image, index) => (
                    <div key={index} className="space-y-2">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-48 object-cover rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setGeneratedImage(image)}
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{image.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && threadToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-[500px] mx-4">
            <div className="px-6 py-5">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Delete chat?</h3>
                <p className="text-white text-base mb-2">
                  This will delete <strong>{threadToDelete.title || 'New Chat'}</strong>.
                </p>
                <p className="text-gray-400 text-sm">
                  Visit <span className="underline cursor-pointer">settings</span> to delete any memories saved during this chat.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setThreadToDelete(null);
                  }}
                  className="px-5 py-2.5 bg-gray-700 text-white text-base rounded-full hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteThread(threadToDelete.id)}
                  className="px-5 py-2.5 bg-red-600 text-white text-base rounded-full hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credits Modal */}
      <CreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        currentCredits={credits || 0}
        onCreditsUpdate={setCredits}
        userId={user?.uid}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userId={user?.uid}
      />
    </div>
  );
}


