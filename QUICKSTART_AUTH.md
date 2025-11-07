# 🚀 Quick Start: API Authentication

## ⚡ 5-Minute Setup

### Step 1: Get Firebase Admin Credentials (2 min)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **PromptedTech/AI-Platform**
3. Click ⚙️ **Project Settings** → **Service Accounts** tab
4. Click **Generate New Private Key** → Download JSON file
5. Copy the entire JSON content

### Step 2: Set Environment Variables (1 min)
Create/edit `.env.local` in your project root:

```bash
# Paste your Firebase Admin credentials (ENTIRE JSON on one line)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'

# Add your admin email
ADMIN_EMAILS=your.email@example.com

# Your existing vars should already be here:
NEXT_PUBLIC_FIREBASE_API_KEY=...
OPENAI_API_KEY=sk-...
```

**Important**: The JSON must be on a single line, wrapped in single quotes!

### Step 3: Restart Dev Server (30 sec)
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Test Authentication (1 min)
Open browser console on your app and run:

```javascript
// Get your auth token
const token = await firebase.auth().currentUser.getIdToken();
console.log('Token:', token);

// Test API call
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const data = await response.json();
console.log('Response:', data);
```

✅ If you see a response, authentication is working!
❌ If you see `401 Unauthorized`, check your env vars and restart server.

---

## 🔄 Update Your Client Code

### Example: Update Dashboard Chat

**Before:**
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.uid, // ❌ Remove this
    messages: [...],
  })
});
```

**After:**
```javascript
import { authenticatedPost } from '../lib/authClient';

const response = await authenticatedPost('/api/chat', {
  messages: [...], // ✅ userId auto-extracted from token
});
```

---

## 📋 Complete Migration Checklist

### Backend (Already Done ✅)
- [x] Install `firebase-admin`
- [x] Create authentication middleware
- [x] Update all API routes
- [x] Remove `userId` from API handlers (use `req.user.uid`)

### Frontend (You Need to Do)
- [ ] Add Firebase Admin credentials to `.env.local`
- [ ] Import `authClient` helpers in components
- [ ] Replace `fetch()` calls with `authenticatedPost()`, `authenticatedGet()`, etc.
- [ ] Remove `userId` from request bodies
- [ ] Test each feature (chat, image gen, file upload, payments)

### Routes That Need Client Updates

Find and replace in these files:

1. **Chat Routes** - Anywhere you call `/api/chat` or `/api/chat/stream`
   - Import: `import { authenticatedPost } from '../lib/authClient'`
   - Replace: `fetch('/api/chat', ...)` → `authenticatedPost('/api/chat', ...)`
   - Remove: `userId` from request body

2. **Image Generation** - Anywhere you call `/api/image`
   - Same pattern as chat

3. **File Upload** - Anywhere you call `/api/upload`
   - Import: `import { authenticatedUpload } from '../lib/authClient'`
   - Replace: `fetch('/api/upload', ...)` → `authenticatedUpload('/api/upload', formData)`
   - Remove: `formData.append('uid', userId)`

4. **Vector Search** - Anywhere you call `/api/search-embeds`
   - Remove: `userId` from request body

5. **Payments** - Anywhere you call `/api/razorpay/*`
   - Remove: `userId` from request bodies

---

## 🎯 Common Files to Update

Based on your project structure:

```
pages/
  ├── dashboard.js          ← Update chat API calls
  ├── my-ais.js            ← Update if it calls APIs
  └── profile.js           ← Update if it calls APIs

components/
  ├── BuyCreditsModal.js   ← Update payment API calls
  └── DemoMode.js          ← Already uses demo-chat (works without auth)
```

---

## 🔍 Finding API Calls to Update

Search your codebase for:
```bash
# Find all fetch calls to /api/
grep -r "fetch('/api/" pages/ components/

# Find all axios calls to /api/
grep -r "axios" pages/ components/
```

---

## ⚠️ Common Issues & Fixes

### Issue: "Firebase Admin not initialized"
**Fix**: Check `.env.local` has `FIREBASE_SERVICE_ACCOUNT_KEY` and restart server

### Issue: "Unauthorized: Missing Authorization header"
**Fix**: Use `authenticatedPost()` instead of `fetch()`, ensure user is logged in

### Issue: "User not authenticated"
**Fix**: Check `auth.currentUser` exists before making API calls

### Issue: Token expired errors
**Fix**: Helpers auto-retry, but if persisting, force refresh:
```javascript
const token = await auth.currentUser.getIdToken(true); // force refresh
```

---

## 🧪 Test Each Feature

After updating, test:
- [ ] Chat (text generation)
- [ ] Image generation
- [ ] File upload
- [ ] Vector search (if implemented)
- [ ] Buy credits / payments
- [ ] Profile updates (if any)

---

## 📚 Full Documentation

- **Setup Guide**: `AUTH_SETUP_GUIDE.md`
- **Code Examples**: `MIGRATION_EXAMPLES.js`
- **Implementation Summary**: `AUTHENTICATION_IMPLEMENTATION.md`

---

## 🎉 You're Done!

Once you've:
1. ✅ Added Firebase Admin credentials to `.env.local`
2. ✅ Restarted dev server
3. ✅ Updated client code to use `authClient` helpers
4. ✅ Tested all features

Your Nova AI platform now has **enterprise-grade security**! 🔐

All user actions are verified server-side with Firebase Admin SDK. No more userId spoofing! 🎯

---

## 🚀 Deploy to Production

When ready to deploy:

1. Add Firebase Admin credentials to Vercel/hosting platform env vars
2. Set `NODE_ENV=production`
3. Ensure HTTPS is enabled (required for secure tokens)
4. Test thoroughly before going live

**Vercel Environment Variables:**
- `FIREBASE_SERVICE_ACCOUNT_KEY` (same as local)
- `ADMIN_EMAILS` (comma-separated)
- All your existing `NEXT_PUBLIC_*` vars

That's it! 🎊
