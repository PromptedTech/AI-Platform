#!/bin/bash

# AI Platform Setup Checker
# This script checks if you've completed all setup steps

echo "════════════════════════════════════════════════════════════════"
echo "           🔍 AI Platform Setup Checker"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
TOTAL_CHECKS=7

# Check 1: .env.local exists
echo -n "1. Checking .env.local file... "
if [ -f ".env.local" ]; then
    if grep -q "NEXT_PUBLIC_FIREBASE_API_KEY" .env.local && ! grep -q "your_firebase_api_key" .env.local; then
        echo -e "${GREEN}✓ EXISTS and configured${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠ EXISTS but not configured${NC}"
        echo "   → Add your Firebase config to .env.local"
    fi
else
    echo -e "${RED}✗ MISSING${NC}"
    echo "   → Create .env.local with Firebase and OpenAI credentials"
fi

# Check 2: .firebaserc updated
echo -n "2. Checking .firebaserc... "
if [ -f ".firebaserc" ]; then
    if grep -q "your-project-id" .firebaserc; then
        echo -e "${RED}✗ NOT UPDATED${NC}"
        echo "   → Replace 'your-project-id' with your actual Firebase Project ID"
    else
        echo -e "${GREEN}✓ UPDATED${NC}"
        ((CHECKS_PASSED++))
    fi
else
    echo -e "${RED}✗ MISSING${NC}"
fi

# Check 3: node_modules exists
echo -n "3. Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ INSTALLED${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT INSTALLED${NC}"
    echo "   → Run: npm install"
fi

# Check 4: Firebase rules file exists
echo -n "4. Checking firestore.rules... "
if [ -f "firestore.rules" ]; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ MISSING${NC}"
fi

# Check 5: Firebase indexes file exists
echo -n "5. Checking firestore.indexes.json... "
if [ -f "firestore.indexes.json" ]; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ MISSING${NC}"
fi

# Check 6: Firebase CLI logged in
echo -n "6. Checking Firebase CLI... "
if command -v firebase &> /dev/null; then
    if firebase projects:list &> /dev/null; then
        echo -e "${GREEN}✓ LOGGED IN${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠ NOT LOGGED IN${NC}"
        echo "   → Run: firebase login"
    fi
else
    echo -e "${RED}✗ NOT INSTALLED${NC}"
    echo "   → Run: npm install -g firebase-tools"
fi

# Check 7: All required files exist
echo -n "7. Checking project files... "
MISSING_FILES=0
for file in "pages/dashboard.js" "pages/_app.js" "lib/firebase.js" "components/Login.js"; do
    if [ ! -f "$file" ]; then
        ((MISSING_FILES++))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}✓ ALL PRESENT${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ $MISSING_FILES FILES MISSING${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Results: $CHECKS_PASSED/$TOTAL_CHECKS checks passed"
echo "════════════════════════════════════════════════════════════════"
echo ""

if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}🎉 All checks passed! You're ready to deploy!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. firebase deploy --only firestore"
    echo "  2. npm run dev"
    echo "  3. Open http://localhost:3000"
elif [ $CHECKS_PASSED -ge 5 ]; then
    echo -e "${YELLOW}⚠ Almost there! Complete the remaining steps.${NC}"
    echo ""
    echo "See: START_HERE.md for step-by-step instructions"
else
    echo -e "${RED}❌ Several steps incomplete. Follow the setup guide.${NC}"
    echo ""
    echo "Start here: START_HERE.md"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"

