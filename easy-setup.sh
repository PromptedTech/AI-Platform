#!/bin/bash

# AI Platform - Interactive Easy Setup
# This script makes setup as easy as possible!

clear

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║           🚀 AI Platform - Interactive Setup 🚀               ║"
echo "║                                                               ║"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo ""
echo "This script will guide you through the setup process step by step."
echo "I'll help you create all the necessary configuration files!"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Firebase Project
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Firebase Project Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "First, you need to create a Firebase project."
echo ""
echo "I'll open Firebase Console for you in 3 seconds..."
sleep 1
echo "Opening in 2..."
sleep 1
echo "Opening in 1..."
sleep 1

# Open Firebase Console
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://console.firebase.google.com/"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://console.firebase.google.com/"
else
    echo "Please open: https://console.firebase.google.com/"
fi

echo ""
echo -e "${GREEN}✓${NC} Firebase Console opened in your browser!"
echo ""
echo "In the Firebase Console:"
echo "  1. Click 'Add project' or 'Create a project'"
echo "  2. Enter project name (e.g., 'ai-platform')"
echo "  3. Click through the setup (enable Analytics if you want)"
echo "  4. Wait for project creation"
echo ""
read -p "Press ENTER when you've created the project..."

# Step 2: Get Project ID
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Get Your Firebase Project ID${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "In Firebase Console:"
echo "  1. Click the ⚙️ (gear icon) → Project settings"
echo "  2. Find 'Project ID' (NOT project name)"
echo "  3. Copy it (looks like: ai-platform-abc123)"
echo ""
read -p "Enter your Firebase Project ID: " FIREBASE_PROJECT_ID

# Update .firebaserc
echo ""
echo -e "${GREEN}✓${NC} Updating .firebaserc with your Project ID..."
cat > .firebaserc << EOF
{
  "projects": {
    "default": "$FIREBASE_PROJECT_ID"
  }
}
EOF
echo -e "${GREEN}✓${NC} .firebaserc updated!"

# Step 3: Get Firebase Config
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Get Firebase Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Still in Project Settings, scroll down to 'Your apps'"
echo "  1. Click the </> icon (Web app)"
echo "  2. App nickname: 'ai-platform-web'"
echo "  3. Don't check 'Firebase Hosting'"
echo "  4. Click 'Register app'"
echo ""
read -p "Press ENTER when you see the Firebase config code..."

echo ""
echo "Now copy each value from the Firebase config:"
echo ""

read -p "Enter apiKey (starts with AIza...): " FIREBASE_API_KEY
read -p "Enter authDomain (ends with .firebaseapp.com): " FIREBASE_AUTH_DOMAIN
read -p "Enter projectId (same as before): " FIREBASE_PROJECT_ID_CONFIRM
read -p "Enter storageBucket (ends with .appspot.com): " FIREBASE_STORAGE_BUCKET
read -p "Enter messagingSenderId (numbers only): " FIREBASE_MESSAGING_SENDER_ID
read -p "Enter appId (starts with 1:...): " FIREBASE_APP_ID

# Step 4: Get OpenAI API Key
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4: Get OpenAI API Key${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Opening OpenAI API Keys page..."
sleep 1

if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://platform.openai.com/api-keys"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://platform.openai.com/api-keys"
else
    echo "Please open: https://platform.openai.com/api-keys"
fi

echo ""
echo "In OpenAI Platform:"
echo "  1. Click 'Create new secret key'"
echo "  2. Copy the key (you won't see it again!)"
echo ""
read -p "Enter your OpenAI API Key (starts with sk-): " OPENAI_API_KEY

# Step 5: Create .env.local
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 5: Creating .env.local${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✓${NC} Creating .env.local with your credentials..."

cat > .env.local << EOF
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID_CONFIRM
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID

# OpenAI API Key
OPENAI_API_KEY=$OPENAI_API_KEY
EOF

echo -e "${GREEN}✓${NC} .env.local created successfully!"

# Step 6: Enable Services
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 6: Enable Firebase Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Back in Firebase Console, you need to enable 2 services:"
echo ""
echo -e "${YELLOW}A. Enable Authentication:${NC}"
echo "  1. Click 'Authentication' in sidebar"
echo "  2. Click 'Get started'"
echo "  3. Enable 'Email/Password' → Save"
echo "  4. Enable 'Google' → Save"
echo ""
read -p "Press ENTER when Authentication is enabled..."

echo ""
echo -e "${YELLOW}B. Enable Firestore:${NC}"
echo "  1. Click 'Firestore Database' in sidebar"
echo "  2. Click 'Create database'"
echo "  3. Select 'Production mode' → Next"
echo "  4. Choose location (e.g., us-central) → Enable"
echo "  5. Wait 30-60 seconds"
echo ""
read -p "Press ENTER when Firestore is enabled..."

# Step 7: Deploy Firestore Config
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 7: Deploy Firestore Rules & Indexes${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Now I'll deploy your Firestore configuration automatically..."
echo ""

firebase deploy --only firestore

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Firestore configuration deployed successfully!"
else
    echo ""
    echo -e "${YELLOW}⚠${NC} Deployment had an issue. You can deploy manually later with:"
    echo "   firebase deploy --only firestore"
fi

# Step 8: Run Setup Checker
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 8: Verifying Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Let me check if everything is set up correctly..."
echo ""

./check-setup.sh

# Step 9: Final Instructions
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Setup Complete! 🎉${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Your AI Platform is ready to run!"
echo ""
echo -e "${YELLOW}To start your app:${NC}"
echo "  npm run dev"
echo ""
echo -e "${YELLOW}Then open in your browser:${NC}"
echo "  http://localhost:3000"
echo ""
echo -e "${YELLOW}What you can do:${NC}"
echo "  ✓ Sign up with email or Google"
echo "  ✓ Chat with GPT-4"
echo "  ✓ Generate images with DALL-E 3"
echo "  ✓ All data saves to Firestore automatically"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
echo "════════════════════════════════════════════════════════════════"

