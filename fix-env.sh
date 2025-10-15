#!/bin/bash

# Fix .env.local configuration

cat > .env.local << 'EOF'
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyALqOlJhc7u3_IzM5HM-xtmx070T5c0L6o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-platform-97f30.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-platform-97f30
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-platform-97f30.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=941895844019
NEXT_PUBLIC_FIREBASE_APP_ID=1:941895844019:web:1d6850848d81c54d5630c6

# OpenAI API Key
OPENAI_API_KEY=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
EOF

echo "✅ .env.local fixed!"
echo ""
echo "NEXT STEP: Restart your dev server"
echo "  1. Press Ctrl+C in the terminal running 'npm run dev'"
echo "  2. Run: npm run dev"

