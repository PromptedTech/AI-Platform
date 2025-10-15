# Quick Start Guide - AI Platform

Get your AI Platform running in 5 minutes!

## What You Built

✅ **Full-stack AI Platform** with:
- User authentication (Email + Google)
- GPT-4 chat with conversation history
- DALL-E 3 image generation with gallery
- Real-time Firestore persistence
- Beautiful responsive UI

## Prerequisites Checklist

Before starting, get these ready:
- [ ] Node.js 16+ installed
- [ ] Firebase account (free tier is fine)
- [ ] OpenAI API key with credits

## 5-Minute Setup

### 1️⃣ Install Dependencies (30 seconds)

```bash
npm install
```

### 2️⃣ Create Firebase Project (2 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project" → Enter name → Continue
3. **Authentication**: 
   - Click "Get started"
   - Enable "Email/Password" 
   - Enable "Google"
4. **Firestore**:
   - Click "Create database" → Production mode → Next
   - Choose location → Enable

### 3️⃣ Get Your Keys (1 minute)

**Firebase Config:**
- Firebase Console → Project Settings → Scroll down
- Copy your config values

**OpenAI Key:**
- Go to https://platform.openai.com/api-keys
- Create new key → Copy it

### 4️⃣ Create `.env.local` (1 minute)

Create a file named `.env.local` in the root folder:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

OPENAI_API_KEY=sk-your_openai_key_here
```

### 5️⃣ Start the App (30 seconds)

```bash
npm run dev
```

Open http://localhost:3000

## First Use

1. **Sign Up** - Create an account or use Google
2. **Chat** - Ask GPT-4 anything
3. **Generate** - Create images with AI

## ⚠️ Important: Firestore Setup

On first use, you might see an error about **missing indexes**. This is normal!

**When you see the error:**
1. Click the link in the error message
2. It will open Firebase Console
3. Click "Create Index"
4. Wait 2-3 minutes for index to build
5. Refresh your app

**Or set up manually:**
Follow the detailed guide in [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)

## What Works Now

✅ Sign up / Login (Email + Google)  
✅ Chat with GPT-4  
✅ Generate images with DALL-E 3  
✅ Chat history saved & loaded  
✅ Image gallery saved & loaded  
✅ Real-time sync across devices  
✅ User-specific data (secure)  

## Project Structure

```
ai-platform/
├── pages/
│   ├── _app.js          # App wrapper with auth
│   ├── index.js         # Login/Signup page
│   ├── dashboard.js     # Main app (chat + images)
│   └── api/
│       ├── chat.js      # GPT-4 endpoint
│       └── image.js     # DALL-E endpoint
├── components/
│   ├── Login.js         # Login form
│   └── Signup.js        # Signup form
├── lib/
│   └── firebase.js      # Firebase config
└── .env.local           # Your secrets (CREATE THIS)
```

## Helpful Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Check for errors
```

## Documentation

- 📖 **README.md** - Full documentation
- ✅ **PHASE_1_COMPLETE.md** - Feature checklist
- 🔧 **SETUP.md** - Detailed setup guide
- 🔥 **FIRESTORE_SETUP.md** - Database configuration
- ✓ **TESTING_CHECKLIST.md** - Test all features

## Common Issues

### "Missing permissions" error
→ Create Firestore indexes (see FIRESTORE_SETUP.md)

### "Invalid API key" error
→ Check your `.env.local` file has correct keys

### Chat not working
→ Verify you have OpenAI credits and GPT-4 access

### Images not generating
→ Verify you have DALL-E 3 access on OpenAI

## Next Steps

1. ✅ **Test it out** - Use TESTING_CHECKLIST.md
2. 🔧 **Customize** - Change colors in tailwind.config.js
3. 🚀 **Deploy** - Push to Vercel (it's free!)
4. 📱 **Share** - Show off your AI platform!

## Need Help?

1. Check the error in browser console (F12)
2. Read FIRESTORE_SETUP.md for database issues
3. Verify all environment variables are set
4. Check Firebase Console for auth/database status

---

**Ready to use your AI Platform!** 🎉

Start at: http://localhost:3000

