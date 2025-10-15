# 🎯 Setup Checklist - Analytics & Payment System

## ✅ What's Been Completed

### Analytics System
- [x] Created `lib/analytics.js` with tracking utilities
- [x] Integrated chat tracking in dashboard
- [x] Integrated image tracking in dashboard
- [x] Added login tracking in `_app.js`
- [x] Added real-time stats to profile page
- [x] Updated Firestore rules for stats collection
- [x] Deployed Firestore rules

### Payment System
- [x] Installed Razorpay SDK
- [x] Created `/api/razorpay/create-order` endpoint
- [x] Created `/api/razorpay/verify-payment` endpoint
- [x] Built `BuyCreditsModal` component
- [x] Integrated payment modal into `CreditsModal`
- [x] Added Firestore rules for payments collection
- [x] Deployed Firestore rules
- [x] Created comprehensive documentation

---

## 🚀 What You Need to Do

### Step 1: Get Razorpay Keys (5 minutes)

1. **Sign up for Razorpay:**
   - Go to: https://dashboard.razorpay.com/signup
   - Create a free account

2. **Get Test Keys:**
   - Navigate to: **Settings** → **API Keys**
   - Under **Test Mode**, copy:
     - Key ID (starts with `rzp_test_`)
     - Key Secret (click "Show" to reveal)

### Step 2: Update Environment Variables (1 minute)

1. **Open `.env.local`** in your project root

2. **Find these lines:**
   ```env
   RAZORPAY_KEY_ID=your_razorpay_key_id_here
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
   ```

3. **Replace with your actual keys:**
   ```env
   RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET
   ```

4. **Save the file**

### Step 3: Test Everything (5 minutes)

#### ✅ Test Analytics

1. **Open your app:** http://localhost:3000
2. **Log in** to your account
3. **Send a chat message**
   - Go to Chat tab
   - Send any message
   - Wait for response
4. **Check profile:**
   - Click your name → Profile
   - Verify "Total Chats" increased
5. **Generate an image** (optional)
   - Go to Image Generator tab
   - Enter a prompt
   - Generate image
6. **Check profile again:**
   - Verify "Total Images" increased

#### ✅ Test Payment System

1. **Click the Coins icon** in the header
2. **Click "View Credit Packages"**
3. **Select any package** and click "Buy Now"
4. **In Razorpay checkout, use test card:**
   ```
   Card Number: 4111 1111 1111 1111
   CVV: 123
   Expiry: 12/25
   Name: Test User
   ```
5. **Complete payment**
6. **Verify:**
   - Success message appears
   - Credits added to your balance
   - Balance updates in header

7. **Check Firestore:**
   - Go to Firebase Console
   - Navigate to Firestore Database
   - Check `payments` collection
   - Verify your transaction is recorded

---

## 📋 Quick Reference

### Test Cards

| Card Number | Result |
|-------------|--------|
| 4111 1111 1111 1111 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Declined |
| 5555 5555 5555 4444 | ✅ Success (Mastercard) |

### Pricing

| Credits | Price | Savings |
|---------|-------|---------|
| 100 | ₹99 | - |
| 500 | ₹399 | 20% off |
| 1000 | ₹699 | 30% off |

### Where to Find Things

- **Analytics:** `users/{uid}/stats/summary` in Firestore
- **Payments:** `payments/{paymentId}` in Firestore
- **Razorpay Dashboard:** https://dashboard.razorpay.com/
- **Documentation:** See `PAYMENT_QUICK_START.md`

---

## 🐛 Troubleshooting

### "Invalid Key ID" Error
```bash
# 1. Check .env.local has correct keys
# 2. Restart the server
pkill -f "next dev" && npm run dev
```

### Credits Not Added After Payment
```bash
# Check browser console for errors
# Verify Firestore rules are deployed
firebase deploy --only firestore
```

### Analytics Not Updating
```bash
# Check Firestore rules deployed
# Verify user is authenticated
# Check browser console for errors
```

---

## 📚 Documentation Files

1. **PAYMENT_QUICK_START.md** - Quick setup guide (start here!)
2. **RAZORPAY_SETUP.md** - Detailed setup and troubleshooting
3. **IMPLEMENTATION_SUMMARY.md** - Technical details and architecture
4. **This file** - Your action checklist

---

## ✨ Features You Can Now Use

### For Users
- 💳 Purchase credits with Razorpay
- 📊 View usage analytics on profile
- 🎁 Daily login rewards (10 credits)
- 📈 Track chat and image generation history
- 💰 Real-time credit balance updates

### For You (Admin)
- 📊 Monitor user activity in Firestore
- 💳 Track all transactions
- 📈 View payment analytics in Razorpay Dashboard
- 🔒 Secure payment verification
- 📝 Complete transaction history

---

## 🎉 You're All Set!

Once you've completed the steps above, your AI Platform will have:
- ✅ Full analytics tracking
- ✅ Working payment system
- ✅ Secure transaction handling
- ✅ Real-time updates
- ✅ Beautiful UI

**Next:** Add your Razorpay keys and test the payment flow!

---

## 🆘 Need Help?

1. Check `PAYMENT_QUICK_START.md` for quick answers
2. See `RAZORPAY_SETUP.md` for detailed troubleshooting
3. Check browser console for errors
4. Verify Firestore rules are deployed
5. Ensure `.env.local` has correct keys

---

**Status:** Ready to test! 🚀
**Server:** Running on http://localhost:3000
**Action Required:** Add Razorpay keys to `.env.local`

