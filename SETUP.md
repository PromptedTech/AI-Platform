# Quick Setup Guide

Follow these steps to get your AI Platform up and running:

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Environment File

Create a file named `.env.local` in the root directory and add your API keys:

```env
# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI API Key (from OpenAI Platform)
OPENAI_API_KEY=sk-your_openai_key
```

## Step 3: Firebase Setup

1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable **Authentication** → Sign-in method → Enable:
   - Email/Password
   - Google
4. Enable **Firestore Database** → Create database in production mode
   - ⚠️ **IMPORTANT**: Follow the detailed Firestore setup in `FIRESTORE_SETUP.md`
   - You must create composite indexes and security rules
5. Copy your Firebase config from Project Settings

## Step 4: OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key and add it to `.env.local`

## Step 5: Run the Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 6: Test the Application

1. Sign up with a new account
2. Try the chat feature with GPT-4
3. Generate an image with DALL-E 3

## Troubleshooting

### Firebase Errors
- Make sure you've enabled the authentication methods in Firebase Console
- Check that your Firebase config values are correct
- Verify Firestore is enabled
- **CRITICAL**: Create Firestore indexes (see FIRESTORE_SETUP.md)
- Apply Firestore security rules (see FIRESTORE_SETUP.md)

### OpenAI Errors
- Ensure your API key is valid and has credits
- Check that you have access to GPT-4 and DALL-E 3
- Monitor your usage at https://platform.openai.com/usage

### Build Errors
- Run `npm install` again
- Delete `.next` folder and rebuild
- Check Node.js version (should be 16+)

## What's Included

✅ Firebase Authentication (Email/Password + Google)  
✅ GPT-4 Chat Interface  
✅ DALL-E 3 Image Generation  
✅ Responsive Design with Tailwind CSS  
✅ User Dashboard  
✅ Secure API Routes  

## Next Steps

- Customize the UI colors in `tailwind.config.js`
- Add more AI features
- Implement chat history storage in Firestore
- Add user profiles
- Deploy to Vercel

## Need Help?

Check the main README.md for detailed documentation.


