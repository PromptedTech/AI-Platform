# API Authentication Setup Guide

## Overview
All API routes in `/pages/api/*` now require Firebase ID token authentication via the `Authorization` header. This ensures that only authenticated users can access protected endpoints.

## 🔐 Authentication Flow

### Server-Side (API Routes)
1. Client sends request with `Authorization: Bearer <token>` header
2. Middleware verifies Firebase ID token using Firebase Admin SDK
3. Decoded user info (uid, email, etc.) is attached to `req.user`
4. Handler executes with authenticated user context

### Client-Side (Frontend)
1. User logs in via Firebase Auth
2. Client obtains ID token: `await user.getIdToken()`
3. Token is sent with each API request in Authorization header
4. Token auto-refreshes when expired

## 📦 Required Dependencies

```bash
npm install firebase-admin
```

## 🔧 Environment Variables

Add to your `.env.local`:

```bash
# Firebase Admin SDK (Server-side)
# Option 1: Use service account JSON (recommended for production)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# Option 2: Use individual fields
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin emails (comma-separated) for admin routes
ADMIN_EMAILS=admin@example.com,nakul@example.com
```

### Getting Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Either:
   - Set entire JSON as `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Or extract individual fields for separate env vars

## 🛠️ Middleware Usage

### Protected Routes (Requires Auth)
```javascript
import { withAuth } from '../../lib/authMiddleware';

async function handler(req, res) {
  // User is authenticated - req.user contains user info
  const userId = req.user.uid;
  const userEmail = req.user.email;
  
  // Your logic here
  return res.status(200).json({ success: true });
}

export default withAuth(handler);
```

### Admin-Only Routes
```javascript
import { withAdminAuth } from '../../lib/adminMiddleware';

async function handler(req, res) {
  // User is authenticated AND has admin privileges
  const adminId = req.user.uid;
  
  // Admin-only logic here
  return res.status(200).json({ success: true });
}

export default withAdminAuth(handler);
```

### Optional Auth Routes (Works with or without auth)
```javascript
import { withOptionalAuth } from '../../lib/authMiddleware';

async function handler(req, res) {
  // User may or may not be authenticated
  const userId = req.user?.uid; // undefined if not logged in
  
  // Logic that works for both cases
  return res.status(200).json({ success: true });
}

export default withOptionalAuth(handler);
```

## 💻 Client-Side Integration

### Using Helper Functions (Recommended)

```javascript
import { authenticatedPost, authenticatedGet, authenticatedUpload } from '../lib/authClient';

// POST request
const response = await authenticatedPost('/api/chat', {
  messages: [...],
  model: 'gpt-4o-mini'
});

// GET request
const data = await authenticatedGet('/api/chunks', {
  fileId: '123'
});

// File upload
const formData = new FormData();
formData.append('file', file);
const result = await authenticatedUpload('/api/upload', formData);
```

### Manual Implementation

```javascript
import { auth } from '../lib/firebase';

async function callProtectedAPI() {
  try {
    // Get current user's ID token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    
    // Make API request with Authorization header
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello!' }]
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## 🔄 Migration Guide

### Before (Insecure)
```javascript
// Client sends userId in body
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.uid, // ❌ Insecure - can be spoofed
    messages: [...]
  })
});
```

### After (Secure)
```javascript
// Server verifies token and extracts userId
import { authenticatedPost } from '../lib/authClient';

const response = await authenticatedPost('/api/chat', {
  // ✅ No userId needed - extracted from verified token
  messages: [...]
});
```

## 📋 Updated API Routes

### Protected Routes (withAuth)
- ✅ `/api/chat` - Chat completion
- ✅ `/api/chat/stream` - Streaming chat
- ✅ `/api/image` - Image generation
- ✅ `/api/embeddings` - Generate embeddings
- ✅ `/api/upload` - File upload
- ✅ `/api/search-embeds` - Vector search
- ✅ `/api/store-embeddings` - Store embeddings
- ✅ `/api/chunks` - Get chunks
- ✅ `/api/razorpay/create-order` - Create payment order
- ✅ `/api/razorpay/verify-payment` - Verify payment

### Admin Routes (withAdminAuth)
- ✅ `/api/admin/add-credits` - Add credits to user

### Optional Auth Routes (withOptionalAuth)
- ✅ `/api/demo-chat` - Demo chat (works without login)

## 🧪 Testing Authentication

### Test with cURL
```bash
# Get your token from browser console
# In your app: await auth.currentUser.getIdToken()

curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

### Test Error Responses
```javascript
// Missing token
fetch('/api/chat', { method: 'POST' })
// Response: 401 { error: 'Unauthorized: Missing or invalid Authorization header' }

// Invalid token
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer invalid_token' }
})
// Response: 401 { error: 'Unauthorized: Authentication failed' }

// Expired token (auto-handled by authClient helpers)
// Will automatically refresh and retry
```

## 🚨 Security Notes

1. **Never send userId in request body** - Always use `req.user.uid` from verified token
2. **Token expiration** - Tokens expire after 1 hour; use `getIdToken(true)` to force refresh
3. **HTTPS only in production** - Never send tokens over HTTP
4. **Admin routes** - Require both valid token AND admin claim/email whitelist
5. **Rate limiting** - Consider adding rate limiting middleware for production

## 🎯 Best Practices

1. **Use helper functions** - Use `authClient.js` utilities for consistency
2. **Error handling** - Always wrap API calls in try-catch
3. **Loading states** - Show loading UI while fetching token/making requests
4. **Logout cleanup** - Clear any cached tokens on logout
5. **Token refresh** - Helper functions auto-retry with fresh token on expiration

## 📝 Example Component

```javascript
import { useState } from 'react';
import { authenticatedPost } from '../lib/authClient';

export default function ChatComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (message) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedPost('/api/chat', {
        messages: [{ role: 'user', content: message }],
        model: 'gpt-4o-mini'
      });
      
      console.log('AI Response:', response.reply);
    } catch (err) {
      setError(err.message);
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {loading && <div>Loading...</div>}
      {/* Your UI here */}
    </div>
  );
}
```

## 🔧 Troubleshooting

### "Firebase Admin not initialized"
- Check environment variables are set correctly
- Verify service account JSON is valid
- Restart dev server after adding env vars

### "Unauthorized: Token expired"
- Use helper functions (auto-retry with refresh)
- Or call `getIdToken(true)` to force refresh

### "Forbidden: Admin access required"
- Add your email to `ADMIN_EMAILS` env var
- Or set custom claims: `admin.auth().setCustomUserClaims(uid, { admin: true })`

### "User not authenticated"
- Ensure user is logged in before making API calls
- Check `auth.currentUser` is not null
- Wait for auth state: `onAuthStateChanged(auth, callback)`

## 📚 Additional Resources

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Firebase Auth Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
