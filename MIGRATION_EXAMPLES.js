// Example: Migrating existing API calls to use authentication

/* ========================================
 * BEFORE: Insecure (sending userId in body)
 * ======================================== */

// ❌ OLD WAY - Dashboard.js or similar
const handleChatSubmit_OLD = async (message) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.uid, // ❌ Can be spoofed!
      messages: [{ role: 'user', content: message }],
      model: 'gpt-4o-mini'
    })
  });
  
  const data = await response.json();
  return data.reply;
};


/* ========================================
 * AFTER: Secure (using auth token)
 * ======================================== */

// ✅ NEW WAY - Using helper functions (RECOMMENDED)
import { authenticatedPost } from '../lib/authClient';

const handleChatSubmit_NEW = async (message) => {
  try {
    const data = await authenticatedPost('/api/chat', {
      // ✅ No userId needed - extracted from verified token on server
      messages: [{ role: 'user', content: message }],
      model: 'gpt-4o-mini'
    });
    
    return data.reply;
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
};


/* ========================================
 * FILE UPLOAD EXAMPLE
 * ======================================== */

// ❌ OLD WAY
const handleFileUpload_OLD = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uid', user.uid); // ❌ Insecure
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};

// ✅ NEW WAY
import { authenticatedUpload } from '../lib/authClient';

const handleFileUpload_NEW = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // ✅ No uid needed - extracted from token
  
  try {
    return await authenticatedUpload('/api/upload', formData);
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};


/* ========================================
 * GET REQUEST EXAMPLE
 * ======================================== */

// ❌ OLD WAY
const getChunks_OLD = async (fileId) => {
  const response = await fetch(`/api/chunks?userId=${user.uid}&fileId=${fileId}`);
  return await response.json();
};

// ✅ NEW WAY
import { authenticatedGet } from '../lib/authClient';

const getChunks_NEW = async (fileId) => {
  try {
    return await authenticatedGet('/api/chunks', { fileId });
    // userId automatically added from token on server
  } catch (error) {
    console.error('Fetch chunks error:', error);
    throw error;
  }
};


/* ========================================
 * PAYMENT FLOW EXAMPLE
 * ======================================== */

// ❌ OLD WAY
const createPaymentOrder_OLD = async (amount, credits) => {
  const response = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.uid, // ❌ Insecure
      amount,
      credits
    })
  });
  
  return await response.json();
};

// ✅ NEW WAY
import { authenticatedPost } from '../lib/authClient';

const createPaymentOrder_NEW = async (amount, credits) => {
  try {
    return await authenticatedPost('/api/razorpay/create-order', {
      amount,
      credits
      // userId extracted from verified token
    });
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};


/* ========================================
 * MANUAL IMPLEMENTATION (if not using helpers)
 * ======================================== */

import { auth } from '../lib/firebase';

const manualAuthenticatedRequest = async (url, body) => {
  // Get current user
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  
  // Get ID token
  const token = await currentUser.getIdToken();
  
  // Make request with Authorization header
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  // Handle errors
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return await response.json();
};


/* ========================================
 * FULL COMPONENT EXAMPLE
 * ======================================== */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedPost } from '../lib/authClient';

export default function ChatComponent() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // ✅ Secure authenticated request
      const response = await authenticatedPost('/api/chat', {
        messages: [...messages, userMessage],
        model: 'gpt-4o-mini',
        temperature: 0.7
      });

      const aiMessage = { role: 'assistant', content: response.reply };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message);
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {error && (
        <div className="error-banner">
          Error: {error}
        </div>
      )}
      
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading || !user}
        />
        <button type="submit" disabled={loading || !user}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}


/* ========================================
 * ERROR HANDLING PATTERNS
 * ======================================== */

// Pattern 1: Show user-friendly error messages
const handleAPICall = async () => {
  try {
    const result = await authenticatedPost('/api/chat', { messages });
    return result;
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      // Redirect to login
      router.push('/login');
    } else if (error.message.includes('credits')) {
      // Show buy credits modal
      setShowCreditsModal(true);
    } else {
      // Generic error
      alert('Something went wrong. Please try again.');
    }
  }
};

// Pattern 2: Retry logic
const handleAPICallWithRetry = async (maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await authenticatedPost('/api/chat', { messages });
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError;
};

// Pattern 3: Loading states
const [apiState, setApiState] = useState({
  loading: false,
  error: null,
  data: null
});

const callAPI = async () => {
  setApiState({ loading: true, error: null, data: null });
  
  try {
    const data = await authenticatedPost('/api/chat', { messages });
    setApiState({ loading: false, error: null, data });
  } catch (error) {
    setApiState({ loading: false, error: error.message, data: null });
  }
};


/* ========================================
 * TESTING HELPERS
 * ======================================== */

// Get token in browser console for testing
// Paste this in browser DevTools console:
/*
(async () => {
  const token = await firebase.auth().currentUser.getIdToken();
  console.log('Token:', token);
  copy(token); // Copies to clipboard
})();
*/

// Test with cURL:
/*
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}],"model":"gpt-4o-mini"}'
*/
