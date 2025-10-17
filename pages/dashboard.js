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
import { MessageSquare, Image as ImageIcon, Sparkles, Library, User, Coins, Clock, Zap, Bug, Menu, X, Home, Settings, LogOut, ChevronLeft, ChevronRight, Plus, Search, MoreVertical, Edit3, Trash2, Calendar, Clipboard, Check } from 'lucide-react';
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
  const [inputPulse, setInputPulse] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Chat history management
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredThread, setHoveredThread] = useState(null);
  const [editingThread, setEditingThread] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [switchingChat, setSwitchingChat] = useState(false);
  
  // Copy message functionality
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  // Dropdown menu state
  const [showMenu, setShowMenu] = useState(null);

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);
  
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
    
    // First try to load from new chat document format
    const chatRef = doc(db, 'chats', activeThreadId);
    const unsubChat = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        const chatData = doc.data();
        if (chatData.messages && chatData.messages.length > 0) {
          // New format: messages stored in single document
          const messages = chatData.messages.map((msg, index) => ({
            role: msg.role,
            content: msg.text || msg.content,
            timestamp: msg.timestamp,
          }));
          console.log('Loading messages from new format:', messages);
          setMessages(messages);
          return;
        }
      }
      
      // If new format doesn't exist or is empty, load from old format
      const qMsgs = query(
        collection(db, 'chats'),
        where('userId', '==', user.uid),
        where('threadId', '==', activeThreadId),
        orderBy('timestamp', 'asc')
      );
      
      const unsubOld = onSnapshot(qMsgs, (snap) => {
        const list = [];
        snap.forEach((d) => {
          const data = d.data();
          // Skip if this is a chat document (has messages array)
          if (!data.messages) {
            list.push({ 
              role: data.role, 
              content: data.content, 
              timestamp: data.timestamp 
            });
          }
        });
        console.log('Loading messages from old format:', list);
        setMessages(list);
      });
      
      return () => unsubOld();
    });
    
    return () => unsubChat();
  }, [user, activeThreadId]);
  const deriveTitle = (text) => {
    const t = (text || '').replace(/\n/g, ' ').trim();
    return t.length > 40 ? t.slice(0, 40) + '…' : t || 'New Chat';
  };

  // Handle chat switching with smooth transitions
  const handleChatSwitch = async (threadId) => {
    setSwitchingChat(true);
    setActiveThreadId(threadId);
    setMessages([]); // Clear current messages for smooth transition
    
    // Small delay for smooth transition effect
    setTimeout(() => {
      setSwitchingChat(false);
    }, 200);
  };

  // Copy message to clipboard
  const copyMessage = async (messageText, messageId) => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopiedMessageId(messageId);
      setShowCopyToast(true);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
        setShowCopyToast(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = messageText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedMessageId(messageId);
      setShowCopyToast(true);
      setTimeout(() => {
        setCopiedMessageId(null);
        setShowCopyToast(false);
      }, 2000);
    }
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
    
    // Create new chat document
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    try {
      await setDoc(doc(db, 'chats', newId), {
        chatId: newId,
        userId: user.uid,
        title: 'New Chat',
        messages: [],
        createdAt: now,
        updatedAt: now,
      });
      
      // Also create thread document for sidebar
      await setDoc(doc(db, 'threads', newId), {
        userId: user.uid,
        title: 'New Chat',
        chatId: newId,
        createdAt: now,
        updatedAt: now,
      });
      
      setActiveThreadId(newId);
      setMessages([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
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
    if (!chatInput.trim()) {
      // Pulse animation for empty input
      setInputPulse(true);
      setTimeout(() => setInputPulse(false), 300);
      return;
    }
    if (!user) return;

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
      // Get current chat document and update it
      const chatRef = doc(db, 'chats', threadId);
      const chatDoc = await getDoc(chatRef);
      const nowIso = new Date().toISOString();
      
      if (chatDoc.exists()) {
        const currentMessages = chatDoc.data().messages || [];
        
        // Add user message
        const updatedMessages = [
          ...currentMessages,
          {
            role: 'user',
            text: userMessage.content,
            timestamp: nowIso,
          }
        ];
        
        // Generate title from first user message if it's still "New Chat"
        let title = chatDoc.data().title;
        if (title === 'New Chat' && currentMessages.length === 0) {
          title = deriveTitle(userMessage.content);
        }
        
        // Update chat document with user message
        await updateDoc(chatRef, {
          messages: updatedMessages,
          title: title,
          updatedAt: nowIso,
        });
        
        // Update thread metadata
        const tRef = doc(db, 'threads', threadId);
        await updateDoc(tRef, { title, updatedAt: nowIso });
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

      // Save assistant message to chat document
      const assistantTimestamp = new Date().toISOString();
      const finalChatRef = doc(db, 'chats', threadId);
      const finalChatDoc = await getDoc(finalChatRef);
      
      if (finalChatDoc.exists()) {
        const currentMessages = finalChatDoc.data().messages || [];
        const updatedMessages = [
          ...currentMessages,
          {
            role: 'ai',
            text: assistantMessage.content,
            timestamp: assistantTimestamp,
          }
        ];
        
        await updateDoc(finalChatRef, {
          messages: updatedMessages,
          updatedAt: assistantTimestamp,
        });
      }
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
    <div className="min-h-screen bg-gradient-modern transition-all duration-300">
      {/* Modern Top Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong sticky top-0 z-50 border-b border-glass"
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
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Nova AI</h1>
                  <p className="text-xs text-white/80">Powered by GPT-4</p>
                </div>
              </div>
            </div>

            {/* Center: Current Chat Title */}
            <div className="flex-1 max-w-md mx-8 hidden sm:block">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white truncate">
                  {getCurrentChatTitle()}
                </h2>
                {activePersona && (
                  <p className="text-xs text-white/70">
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
                  className="hidden sm:flex items-center gap-2 px-3 py-2 glass rounded-lg hover:glass-strong transition-all duration-200 text-white"
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
                className="p-2 text-white/80 hover:text-white hover:glass rounded-lg transition-all duration-200"
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
                className="p-2 text-white/80 hover:text-white hover:glass rounded-lg transition-all duration-200"
                title="Report Bug / Feedback"
              >
                <Bug className="w-5 h-5" />
              </motion.button>

              {/* Profile Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/profile')}
                className="p-2 text-white/80 hover:text-white hover:glass rounded-lg transition-all duration-200"
                title="View Profile"
              >
                <User className="w-5 h-5" />
              </motion.button>

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 text-sm glass"
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
              className="fixed left-0 top-0 h-full w-80 glass-dark shadow-xl z-50 md:hidden flex flex-col"
            >
              {/* Mobile Sidebar Content */}
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-lg">Nova AI</span>
                    <p className="text-xs text-white/60">AI Assistant</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Mobile Sidebar Navigation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Navigation Items */}
                <div className="space-y-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === 'chat'
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-1 rounded-lg ${
                      activeTab === 'chat' ? 'bg-white/20' : 'group-hover:bg-white/10'
                    }`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Chat</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveTab('image'); setSidebarOpen(false); }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === 'image'
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-1 rounded-lg ${
                      activeTab === 'image' ? 'bg-white/20' : 'group-hover:bg-white/10'
                    }`}>
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Images</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveTab('library'); setSidebarOpen(false); }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === 'library'
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-1 rounded-lg ${
                      activeTab === 'library' ? 'bg-white/20' : 'group-hover:bg-white/10'
                    }`}>
                      <Library className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Library</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { router.push('/my-ais'); setSidebarOpen(false); }}
                    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="p-1 rounded-lg group-hover:bg-white/10">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-medium">My AIs</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { router.push('/profile'); setSidebarOpen(false); }}
                    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="p-1 rounded-lg group-hover:bg-white/10">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Profile</span>
                  </motion.button>
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 my-4"></div>

                {/* Chat History */}
                <div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <h3 className="text-sm font-semibold text-white">Recent Chats</h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { handleNewChat(); setSidebarOpen(false); }}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                  
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {threads.slice(0, 10).map((thread) => (
                      <motion.button
                        key={thread.id}
                        onClick={() => { handleChatSwitch(thread.id); setSidebarOpen(false); }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          activeThreadId === thread.id
                            ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                            : 'hover:bg-white/10 text-white/80 hover:text-white hover:shadow-md'
                        }`}
                        title={thread.title || 'New Chat'}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded-lg ${
                            activeThreadId === thread.id ? 'bg-white/20' : 'group-hover:bg-white/10'
                          }`}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">{thread.title || 'New Chat'}</div>
                            <div className="text-xs text-white/60 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(thread.updatedAt).toLocaleDateString([], { 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Active indicator */}
                        {activeThreadId === thread.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm"
                          />
                        )}
                      </motion.button>
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
          className="shrink-0 hidden md:flex md:flex-col glass rounded-xl shadow-lg h-[calc(100vh-180px)] transition-all duration-300 overflow-hidden border-glass"
        >
          {/* Navigation Header */}
          <div className="p-4 border-b border-glass">
            {!sidebarCollapsed ? (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">Nova AI</h2>
                  <p className="text-xs text-white/60">AI Assistant</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex justify-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="px-3 py-2 space-y-1">
            <motion.button
              onClick={() => setActiveTab('chat')}
              whileHover={{ 
                scale: 1.02,
                x: sidebarCollapsed ? 0 : 4
              }}
              whileTap={{ scale: 0.98 }}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md'
              }`}
              title={sidebarCollapsed ? 'Chat' : ''}
            >
              <motion.div
                animate={{
                  scale: activeTab === 'chat' ? [1, 1.1, 1] : 1,
                  rotate: activeTab === 'chat' ? [0, 5, -5, 0] : 0
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
                className={`p-1 rounded-lg ${
                  activeTab === 'chat' ? 'bg-white/20' : 'group-hover:bg-white/10'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </motion.div>
              {!sidebarCollapsed && <span className="font-medium">Chat</span>}
            </motion.button>
            
            <motion.button
              onClick={() => setActiveTab('image')}
              whileHover={{ 
                scale: 1.02,
                x: sidebarCollapsed ? 0 : 4
              }}
              whileTap={{ scale: 0.98 }}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'image'
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md'
              }`}
              title={sidebarCollapsed ? 'Image Generator' : ''}
            >
              <motion.div
                animate={{
                  scale: activeTab === 'image' ? [1, 1.1, 1] : 1,
                  rotate: activeTab === 'image' ? [0, 5, -5, 0] : 0
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
                className={`p-1 rounded-lg ${
                  activeTab === 'image' ? 'bg-white/20' : 'group-hover:bg-white/10'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
              </motion.div>
              {!sidebarCollapsed && <span className="font-medium">Images</span>}
            </motion.button>
            
            <motion.button
              onClick={() => setActiveTab('library')}
              whileHover={{ 
                scale: 1.02,
                x: sidebarCollapsed ? 0 : 4
              }}
              whileTap={{ scale: 0.98 }}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'library'
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md'
              }`}
              title={sidebarCollapsed ? 'Library' : ''}
            >
              <motion.div
                animate={{
                  scale: activeTab === 'library' ? [1, 1.1, 1] : 1,
                  rotate: activeTab === 'library' ? [0, 5, -5, 0] : 0
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
                className={`p-1 rounded-lg ${
                  activeTab === 'library' ? 'bg-white/20' : 'group-hover:bg-white/10'
                }`}
              >
                <Library className="w-5 h-5" />
              </motion.div>
              {!sidebarCollapsed && <span className="font-medium">Library</span>}
            </motion.button>

            <motion.button
              onClick={() => router.push('/my-ais')}
              whileHover={{ 
                scale: 1.02,
                x: sidebarCollapsed ? 0 : 4
              }}
              whileTap={{ scale: 0.98 }}
              className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 hover:shadow-md"
              title={sidebarCollapsed ? 'My AIs' : ''}
            >
              <div className="p-1 rounded-lg group-hover:bg-white/10">
                <User className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && <span className="font-medium">My AIs</span>}
            </motion.button>
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-white/20"></div>

          {/* New Chat Button */}
          <div className="p-3">
            <motion.button 
              onClick={handleNewChat}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 12px 30px rgba(147, 51, 234, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 6px 20px rgba(147, 51, 234, 0.3)",
                  "0 8px 25px rgba(147, 51, 234, 0.4)",
                  "0 6px 20px rgba(147, 51, 234, 0.3)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="group w-full flex items-center gap-3 px-4 py-3 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg backdrop-blur-sm"
              title={sidebarCollapsed ? 'New Chat' : ''}
            >
              <motion.div
                animate={{
                  rotate: [0, 180, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-1 rounded-lg bg-white/20"
              >
                <Plus className="w-5 h-5" />
              </motion.div>
              {!sidebarCollapsed && <span className="font-semibold">New Chat</span>}
            </motion.button>
          </div>

          {/* Search Chats */}
          {!sidebarCollapsed && (
            <div className="px-3 py-2 border-t border-white/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Search chats"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/60 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/20 transition-all duration-200 backdrop-blur-sm"
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
                          <motion.button
                            onClick={() => handleChatSwitch(t.id)}
                            whileHover={{ 
                              scale: 1.02,
                              x: 4
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={`group relative w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                              activeThreadId === t.id
                                ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                                : 'hover:bg-white/10 text-white/80 hover:text-white hover:shadow-md'
                            }`}
                            title={t.title || 'New Chat'} // Tooltip for full title
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1 rounded-lg ${
                                activeThreadId === t.id ? 'bg-white/20' : 'group-hover:bg-white/10'
                              }`}>
                                <MessageSquare className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate pr-8 font-medium">{t.title || 'New Chat'}</div>
                                <div className="text-xs text-white/60 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(t.updatedAt).toLocaleDateString([], { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                            
                            {/* Active indicator */}
                            {activeThreadId === t.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm"
                              />
                            )}
                          </motion.button>
                          
                          {/* Three dots menu - only show on hover */}
                          {hoveredThread === t.id && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <div className="relative">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(showMenu === t.id ? null : t.id);
                                  }}
                                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </motion.button>
                                
                                {/* Dropdown menu */}
                                {showMenu === t.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-1 w-36 glass border-glass rounded-xl shadow-lg py-2 z-10"
                                  >
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingThread(t.id);
                                        setEditTitle(t.title || 'New Chat');
                                        setShowMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-all duration-200"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                      Rename
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDeleteThread(t);
                                        setShowMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-all duration-200"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </motion.button>
                                  </motion.div>
                                )}
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
            <div className="relative w-full h-[calc(100vh-180px)] overflow-hidden glass rounded-xl border-glass">
            {/* Background with subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-purple-500/10 rounded-xl"></div>
            
            {/* Main Chat Container */}
            <div className="relative h-full flex flex-col">
              {/* Persona Banner */}
              <AnimatePresence>
                {activePersona && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-strong border-b border-glass p-4 mx-4 mt-4 rounded-lg"
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
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Chat switching loader */}
                  {switchingChat && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center py-8"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Loading chat...</span>
                      </div>
                    </motion.div>
                  )}
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
                                className={`relative px-4 py-3 rounded-2xl shadow-lg group/message ${
                                  message.role === 'user'
                                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-br-md'
                                    : 'glass text-white rounded-bl-md border-glass'
                                }`}
                              >
                                {message.role === 'user' ? (
                                  <p className="whitespace-pre-wrap leading-relaxed pr-8">{message.content}</p>
                                ) : message.isTyping ? (
                                  <div className="pr-8">
                                    <TypingMessage 
                                      message={message.content} 
                                      onComplete={() => handleTypingComplete(index)}
                                    />
                                  </div>
                                ) : (
                                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 pr-8">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                  </div>
                                )}
                                
                                {/* Copy Button */}
                                <motion.button
                                  onClick={() => copyMessage(message.content, `${activeThreadId}-${index}`)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className={`absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover/message:opacity-100 transition-all duration-200 ${
                                    message.role === 'user'
                                      ? 'bg-white/20 hover:bg-white/30 text-white'
                                      : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                                  }`}
                                  title="Copy message"
                                >
                                  <AnimatePresence mode="wait">
                                    {copiedMessageId === `${activeThreadId}-${index}` ? (
                                      <motion.div
                                        key="check"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0, rotate: 180 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <Check className="w-4 h-4" />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="clipboard"
                                        initial={{ scale: 1, rotate: 0 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0, rotate: -180 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <Clipboard className="w-4 h-4" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.button>
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
                          <div className="glass border-glass rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
                            <TypingAnimation />
                            {thinkElapsed > 0 && (
                              <div className="text-xs text-white/70 mt-1">
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
                      <div className="text-xs text-white/70 px-2">
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
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
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
                  <form onSubmit={handleChatSubmit} className="relative px-6 pb-6">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 relative">
                        <motion.textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (!chatLoading && credits >= 1) {
                                handleChatSubmit(e);
                              }
                            }
                          }}
                          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                          disabled={chatLoading}
                          rows={1}
                          animate={{
                            scale: inputPulse ? [1, 1.02, 1] : 1,
                            borderColor: inputPulse ? ["rgba(147, 51, 234, 0.3)", "rgba(147, 51, 234, 0.8)", "rgba(147, 51, 234, 0.3)"] : "rgba(147, 51, 234, 0.3)"
                          }}
                          transition={{
                            duration: 0.3,
                            ease: "easeInOut"
                          }}
                          className="w-full px-4 py-3 pr-12 glass border-glass rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-50 resize-none transition-all duration-200"
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
                        <div className="absolute bottom-2 right-3 text-xs text-white/60">
                          {chatInput.length}/2000
                        </div>
                      </div>
                      
                      <motion.button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim() || credits < 1}
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: "0 10px 25px rgba(147, 51, 234, 0.4)"
                        }}
                        whileTap={{ 
                          scale: 0.95,
                          transition: { duration: 0.1 }
                        }}
                        animate={{
                          background: chatInput.trim() 
                            ? ["linear-gradient(135deg, #8b5cf6, #4f46e5)", "linear-gradient(135deg, #a855f7, #6366f1)", "linear-gradient(135deg, #8b5cf6, #4f46e5)"]
                            : "linear-gradient(135deg, #8b5cf6, #4f46e5)"
                        }}
                        transition={{
                          duration: 0.3,
                          ease: "easeInOut"
                        }}
                        className="flex items-center justify-center w-12 h-12 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg relative overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-600"
                          animate={{
                            scale: chatInput.trim() ? [1, 1.1, 1] : 1,
                            opacity: chatInput.trim() ? [1, 0.8, 1] : 1
                          }}
                          transition={{
                            duration: 0.6,
                            ease: "easeInOut",
                            repeat: chatInput.trim() ? Infinity : 0,
                            repeatDelay: 2
                          }}
                        />
                        <motion.svg 
                          className="w-5 h-5 relative z-10" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          animate={{
                            rotate: chatInput.trim() ? [0, 5, -5, 0] : 0,
                            scale: chatInput.trim() ? [1, 1.1, 1] : 1
                          }}
                          transition={{
                            duration: 0.4,
                            ease: "easeInOut"
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </motion.svg>
                      </motion.button>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-xs text-white/60">
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

      {/* Copy Toast Notification */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className="fixed bottom-6 right-6 z-50 glass border-glass rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-white font-medium">Copied to clipboard!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


