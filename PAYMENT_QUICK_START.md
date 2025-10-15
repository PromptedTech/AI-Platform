# 🚀 Payment System Quick Start

## What's Been Added?

✅ **Razorpay Payment Integration** - India-friendly payment gateway
✅ **3 Credit Packages** - 100, 500, and 1000 credits
✅ **Secure Payment Flow** - Server-side verification
✅ **Transaction History** - All payments stored in Firestore
✅ **Success Notifications** - Toast messages after purchase

## 🎯 Quick Setup (5 minutes)

### 1. Get Razorpay Test Keys

```bash
1. Go to: https://dashboard.razorpay.com/signup
2. Sign up (free for testing)
3. Navigate to: Settings → API Keys
4. Copy your Test Key ID (starts with rzp_test_)
5. Click "Show" and copy your Key Secret
```

### 2. Add Keys to .env.local

Open `.env.local` and update:

```env
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
```

### 3. Restart Server

```bash
# Kill the current server (Ctrl+C)
npm run dev
```

### 4. Test Payment

1. Open your app: http://localhost:3000
2. Login to your account
3. Click the **Coins icon** in the header
4. Click **"View Credit Packages"**
5. Select any package and click **"Buy Now"**
6. Use test card:
   - **Card:** 4111 1111 1111 1111
   - **CVV:** 123
   - **Expiry:** 12/25
   - **Name:** Test User
7. Complete payment
8. ✅ Credits should be added instantly!

## 📦 Pricing Tiers

| Package | Price | Savings |
|---------|-------|---------|
| 100 credits | ₹99 | - |
| 500 credits | ₹399 | 20% off |
| 1000 credits | ₹699 | 30% off |

## 🔒 Security Features

- ✅ Payment signature verification
- ✅ Server-side order creation
- ✅ Secure Firestore rules
- ✅ Amount validation
- ✅ Immutable payment records

## 🎨 User Experience

1. User clicks "Buy Credits" button
2. Beautiful modal shows 3 pricing tiers
3. Razorpay checkout opens (secure, PCI-compliant)
4. After payment:
   - Credits added automatically
   - Success toast appears
   - Dashboard updates in real-time
   - Transaction saved in Firestore

## 📊 Where to View Transactions

### In Your App
- Check Firestore console: `payments` collection
- Each payment includes:
  - `userId`
  - `amount` (in rupees)
  - `creditsPurchased`
  - `timestamp`
  - `paymentId`
  - `orderId`
  - `status`

### In Razorpay Dashboard
- Go to: https://dashboard.razorpay.com/
- Navigate to: **Transactions** → **Payments**
- View all test/live payments

## 🧪 Test Cards

| Card Number | Result |
|-------------|--------|
| 4111 1111 1111 1111 | Success |
| 4000 0000 0000 0002 | Declined |
| 5555 5555 5555 4444 | Success (Mastercard) |

More test cards: https://razorpay.com/docs/payments/payments/test-card-details/

## 🚀 Going Live

When ready for production:

1. Complete KYC on Razorpay
2. Get Live API Keys (rzp_live_...)
3. Update `.env.local` with live keys
4. Test with small real payment
5. Deploy!

## 📁 Files Added/Modified

```
pages/api/razorpay/
  ├── create-order.js      # Creates payment order
  └── verify-payment.js    # Verifies and processes payment

components/
  ├── BuyCreditsModal.js   # Payment UI
  └── CreditsModal.js      # Updated to integrate payment

firestore.rules              # Added payment security rules
.env.local                   # Added Razorpay keys
```

## 🆘 Common Issues

**"Invalid Key ID" error**
→ Check `.env.local` has correct keys
→ Restart server after updating .env

**Credits not added after payment**
→ Check browser console for errors
→ Verify Firestore rules are deployed

**Razorpay checkout not opening**
→ Check internet connection
→ Disable ad blockers
→ Try different browser

## 📚 Full Documentation

For detailed setup, troubleshooting, and production deployment:
→ See `RAZORPAY_SETUP.md`

## 💡 Tips

- Always test in Test Mode first
- Use test cards for development
- Check Razorpay Dashboard for payment logs
- Monitor Firestore `payments` collection
- Set up webhooks for production (optional)

---

**Ready to test?** Just add your Razorpay keys and restart the server! 🎉

