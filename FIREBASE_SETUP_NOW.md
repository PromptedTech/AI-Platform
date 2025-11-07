# 🔥 Firebase Setup Required - Quick Guide

## ⚠️ Current Issue

Your app is trying to load but Firebase is not configured. You need to add your Firebase credentials to `.env.local`.

## ✅ Quick Fix (5 Minutes)

### Step 1: Go to Firebase Console
Visit: https://console.firebase.google.com

### Step 2: Create or Select Project
- If you don't have a project, click "Add project"
- Follow the wizard (name it, disable analytics for now)
- If you have a project, select it

### Step 3: Get Client Credentials

1. **Click the gear icon ⚙️** next to "Project Overview"
2. **Click "Project settings"**
3. **Scroll down to "Your apps"**
4. **Click the `</>` (Web) icon** to add a web app
   - Give it a nickname (e.g., "Nova AI")
   - Click "Register app"
5. **Copy the config values** - you'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Step 4: Get Admin SDK Credentials

1. **Stay in Project Settings**
2. **Click "Service accounts" tab**
3. **Click "Generate new private key"**
4. **Download the JSON file**
5. **Open the JSON file** - it contains:
   - `project_id`
   - `client_email`
   - `private_key`

### Step 5: Update .env.local

Open the `.env.local` file in your project and replace the placeholders:

```bash
# Replace these with values from Step 3
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Replace these with values from Step 4 (service account JSON)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important for FIREBASE_ADMIN_PRIVATE_KEY:**
- Keep the quotes
- Keep the `\n` for newlines
- Copy the entire private_key value from the JSON file

### Step 6: Enable Authentication

1. **In Firebase Console**, click "Authentication" in left menu
2. **Click "Get started"**
3. **Click "Sign-in method" tab**
4. **Enable "Email/Password"** - toggle it ON
5. **Enable "Google"** (optional but recommended)
   - Toggle ON
   - Add support email
   - Click Save

### Step 7: Enable Firestore

1. **In Firebase Console**, click "Firestore Database" in left menu
2. **Click "Create database"**
3. **Select "Start in production mode"** (we'll add rules next)
4. **Choose location** (nam5 for US, eur3 for Europe)
5. **Click "Enable"**

### Step 8: Add Firestore Rules

1. **Click "Rules" tab** in Firestore
2. **Replace with:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-specific data (authenticated access only)
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Shared content (read by owner or anyone with link)
    match /shared/{shareId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. **Click "Publish"**

### Step 9: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 10: Test

Visit http://localhost:3000 - the error should be gone!

---

## 🎯 Quick Copy-Paste Template

Here's a template for `.env.local` with all variables:

```bash
# OpenAI API (already configured)
OPENAI_API_KEY=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

# Firebase Client (from Firebase Console → Project Settings → General)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (from downloaded service account JSON)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Environment
NODE_ENV=development
```

---

## 🐛 Still Having Issues?

### Error: "Firebase: Error (auth/invalid-api-key)"
- Double-check the API key is copied correctly
- Make sure there are no extra spaces
- Ensure the key starts with `AIzaSy`

### Error: "Firebase Admin SDK error"
- Check the private key format
- Ensure `\n` are present for newlines
- Wrap the private key in double quotes

### Error: "Permission denied"
- Check Firestore rules are published
- Ensure user is authenticated
- Verify userId matches in the path

---

## ✅ Done!

Once configured, your Firebase services will be ready:
- ✅ Authentication (Email/Password, Google)
- ✅ Firestore Database (user data storage)
- ✅ Ready for RAG implementation

Firebase is now ready! 🎉
