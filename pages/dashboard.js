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
import { MessageSquare, Image as ImageIcon, Sparkles, Library, User, Coins, Clock, Zap, Bug, Menu, X, Home, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import ShareButton from '../components/ShareButton';

// Typing Animation Component
const TypingAnimation = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="flex items-center gap-2 px-4 py-2"
  >
    <div className="flex space-x-1">
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI is thinking...</span>
  </motion.div>
);

// Typing Effect Component for AI Messages
const TypingMessage = ({ message, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < message.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + message[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20); // Adjust speed here (lower = faster typing)

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, message, onComplete]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>
      {currentIndex < message.length && (
        <motion.span
          className="inline-block w-2 h-4 bg-primary-500 ml-1"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </div>
  );
};

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
  const [typingMessage, setTypingMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Navigation state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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

  // Handle typing completion
  const handleTypingComplete = (messageIndex) => {
    setMessages(prev => 
      prev.map((msg, idx) => 
        idx === messageIndex && msg.isTyping 
          ? { ...msg, isTyping: false }
          : msg
      )
    );
  };

  // Get current chat title
  const getCurrentChatTitle = () => {
    if (!activeThreadId) return "New Chat";
    const currentThread = threads.find(t => t.id === activeThreadId);
    return currentThread?.title || "New Chat";
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
      
      // Start typing animation
      setIsTyping(true);
      setTypingMessage(response.data.reply);
      
      // Add assistant message with typing flag
      setMessages([...updatedMessages, { ...assistantMessage, isTyping: true }]);
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
      setIsTyping(false);
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
      {/* Modern Top Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Logo and Menu Toggle */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </motion.button>

              {/* Desktop Sidebar Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </motion.button>

              {/* Logo and Brand */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nova AI</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Powered by GPT-4</p>
                </div>
              </div>
            </div>

            {/* Center: Current Chat Title */}
            <div className="flex-1 max-w-md mx-8 hidden sm:block">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {getCurrentChatTitle()}
                </h2>
                {activePersona && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Chatting with {activePersona.name}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Credits Display */}
              {typeof credits === 'number' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreditsModal(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  title="Get more credits"
                >
                  <Coins className="w-4 h-4" />
                  <span className="font-semibold text-sm">{credits}</span>
                </motion.button>
              )}

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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

              {/* Feedback Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFeedbackModal(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Report Bug / Feedback"
              >
                <Bug className="w-5 h-5" />
              </motion.button>

              {/* Profile Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/profile')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="View Profile"
              >
                <User className="w-5 h-5" />
              </motion.button>

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm"
              >
                <LogOut className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>


      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 md:hidden flex flex-col"
            >
              {/* Mobile Sidebar Content */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Nova AI</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Mobile Sidebar Navigation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Navigation Items */}
                <div className="space-y-1">
                  <button
                    onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'chat'
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Chat</span>
                  </button>
                  
                  <button
                    onClick={() => { setActiveTab('image'); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'image'
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>Image Generator</span>
                  </button>
                  
                  <button
                    onClick={() => { setActiveTab('library'); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'library'
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Library className="w-5 h-5" />
                    <span>Library</span>
                  </button>
                  
                  <button
                    onClick={() => { router.push('/my-ais'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>My AIs</span>
                  </button>
                  
                  <button
                    onClick={() => { router.push('/profile'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Profile</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                {/* Chat History */}
                <div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Chats</h3>
                    <button
                      onClick={() => { handleNewChat(); setSidebarOpen(false); }}
                      className="p-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {threads.slice(0, 10).map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => { setActiveThreadId(thread.id); setSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeThreadId === thread.id
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="truncate">{thread.title || 'New Chat'}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content with Sidebar */}
      <main className="max-w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 flex gap-3 sm:gap-6">
        {/* Desktop Sidebar */}
        <motion.aside
          initial={{ width: 256 }}
          animate={{ width: sidebarCollapsed ? 64 : 256 }}
          className="shrink-0 hidden md:flex md:flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md h-[calc(100vh-180px)] transition-all duration-300 overflow-hidden"
        >
          {/* Navigation Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Nova AI</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chat Platform</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={sidebarCollapsed ? 'Chat' : ''}
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Chat</span>}
            </button>
            
            <button
              onClick={() => setActiveTab('image')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'image'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={sidebarCollapsed ? 'Image Generator' : ''}
            >
              <ImageIcon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Image Generator</span>}
            </button>
            
            <button
              onClick={() => setActiveTab('library')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'library'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={sidebarCollapsed ? 'Library' : ''}
            >
              <Library className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Library</span>}
            </button>
            
            <button
              onClick={() => router.push('/my-ais')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={sidebarCollapsed ? 'My AIs' : ''}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>My AIs</span>}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* New Chat Button */}
          <div className="p-3">
            <button 
              onClick={handleNewChat} 
              className="w-full flex items-center gap-3 px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              title={sidebarCollapsed ? 'New Chat' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {!sidebarCollapsed && <span className="font-medium">New Chat</span>}
            </button>
          </div>

          {/* Search Chats */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
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
          )}

          {/* Threads List */}
          {!sidebarCollapsed && (
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
          )}
        </motion.aside>
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'chat' ? (
            // Modern Chat Interface
            <div className="relative w-full h-[calc(100vh-180px)] overflow-hidden">
            {/* Background with subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
            
            {/* Main Chat Container */}
            <div className="relative h-full flex flex-col">
              {/* Persona Banner */}
              <AnimatePresence>
                {activePersona && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 border-b border-primary-200/50 dark:border-primary-700/50 p-4"
                  >
                    <div className="flex items-center gap-3 max-w-4xl mx-auto">
                      {activePersona.avatar && (
                        <img 
                          src={activePersona.avatar} 
                          alt={activePersona.name} 
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-200 dark:ring-primary-700" 
                        />
                      )}
                      <div className="flex-1">
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                          {activePersona.name}
                        </span>
                        <p className="text-xs text-primary-600 dark:text-primary-400">
                          Custom AI persona active
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const q = { ...router.query };
                          delete q.persona;
                          router.push({ pathname: '/dashboard', query: q });
                        }}
                        className="px-3 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-100 dark:bg-primary-900/30 rounded-full transition-colors"
                      >
                        Remove
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="text-center py-20"
                    >
                      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Start a conversation with AI
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Ask anything you'd like to know!
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowChatTemplates(!showChatTemplates)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {showChatTemplates ? 'Hide Templates' : 'Browse Templates'}
                      </motion.button>
                      
                      <AnimatePresence>
                        {showChatTemplates && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            {chatTemplates.map((template, index) => (
                              <motion.button
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setChatInput(template.prompt);
                                  setShowChatTemplates(false);
                                }}
                                className="text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200 group"
                              >
                                <div className="font-medium text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {template.title}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {template.description}
                                </div>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            duration: 0.4,
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                          }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                        >
                          <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === 'user' 
                                ? 'bg-gradient-to-br from-primary-500 to-primary-600' 
                                : 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700'
                            }`}>
                              {message.role === 'user' ? (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>

                            {/* Message Bubble */}
                            <div className="flex flex-col gap-1">
                              <div
                                className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                                  message.role === 'user'
                                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                {message.role === 'user' ? (
                                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                ) : message.isTyping ? (
                                  <TypingMessage 
                                    message={message.content} 
                                    onComplete={() => handleTypingComplete(index)}
                                  />
                                ) : (
                                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                  </div>
                                )}
                              </div>
                              
                              {/* Timestamp */}
                              <div className={`text-xs text-gray-500 dark:text-gray-400 px-2 ${
                                message.role === 'user' ? 'text-right' : 'text-left'
                              }`}>
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>

                            {/* Share Button */}
                            {message.role === 'assistant' && index > 0 && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <ShareButton
                                  type="chat"
                                  userId={user.uid}
                                  message={messages[index - 1]?.content || ''}
                                  response={message.content}
                                  model={chatModel}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}

                  {/* Enhanced Loading Animation */}
                  <AnimatePresence>
                    {chatLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="flex justify-start"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <TypingAnimation />
                            {thinkElapsed > 0 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Processing for {thinkElapsed}s...
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Response Time */}
                  {lastResponseTime !== null && !chatLoading && !chatError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        ✓ Replied in {lastResponseTime}s
                      </div>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  <AnimatePresence>
                    {chatError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                            <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error</p>
                            <p className="text-sm text-red-700 dark:text-red-300">{chatError}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sticky Input Area */}
              <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto p-4 space-y-4">
                  {/* AI Persona & Controls */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">AI:</span>
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
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="">Default AI</option>
                        {availablePersonas.map((persona) => (
                          <option key={persona.id} value={persona.id}>
                            {persona.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Model:</span>
                      <select
                        value={chatModel}
                        onChange={(e) => {
                          setChatModel(e.target.value);
                          try { localStorage.setItem('chat:model', e.target.value); } catch {}
                        }}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="gpt-4o-mini">gpt-4o-mini</option>
                        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        <option value="gpt-4o">gpt-4o</option>
                        <option value="gpt-4">gpt-4</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Temp:</span>
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
                        className="w-20 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-8 text-center">{temperature.toFixed(1)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Tokens:</span>
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
                        className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleChatSubmit} className="relative">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (!chatLoading && chatInput.trim() && credits >= 1) {
                                handleChatSubmit(e);
                              }
                            }
                          }}
                          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                          disabled={chatLoading}
                          rows={1}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 resize-none transition-all duration-200"
                          style={{
                            minHeight: '48px',
                            maxHeight: '120px',
                            height: 'auto'
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = el.scrollHeight + 'px';
                            }
                          }}
                        />
                        <div className="absolute bottom-2 right-3 text-xs text-gray-400 dark:text-gray-500">
                          {chatInput.length}/2000
                        </div>
                      </div>
                      
                      <motion.button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim() || credits < 1}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </motion.button>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <span>Enter to send</span>
                        <span>Shift+Enter for new line</span>
                      </div>
                      <span className="text-primary-600 dark:text-primary-400 font-medium">
                        1 credit per message
                      </span>
                    </div>
                  </form>
                </div>
              </div>
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
        </div>
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


