# Razorpay Payment Integration Setup Guide

This guide will help you set up Razorpay payment integration for your AI Platform credit purchase system.

## Overview

The payment system allows users to purchase credits using Razorpay (India-friendly payment gateway). It includes:
- 3 pricing tiers: 100, 500, and 1000 credits
- Secure payment verification
- Automatic credit addition after successful payment
- Transaction history stored in Firestore

## Step 1: Create a Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/signup)
2. Sign up for a new account (or log in if you already have one)
3. Complete the KYC verification process (required for live payments)

## Step 2: Get Your API Keys

### For Testing (Test Mode)

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. In the left sidebar, click on **Settings** → **API Keys**
3. Under **Test Mode**, you'll see:
   - **Key ID** (starts with `rzp_test_`)
   - Click **Generate Test Key** if you don't have one
   - Click **Show** next to Key Secret to reveal it
4. Copy both the Key ID and Key Secret

### For Production (Live Mode)

1. Complete KYC verification on Razorpay
2. Switch to **Live Mode** using the toggle in the top-left corner
3. Go to **Settings** → **API Keys**
4. Under **Live Mode**:
   - **Key ID** (starts with `rzp_live_`)
   - Click **Generate Live Key** if you don't have one
   - Click **Show** next to Key Secret to reveal it
5. Copy both the Key ID and Key Secret

## Step 3: Configure Environment Variables

1. Open your `.env.local` file in the project root
2. Add your Razorpay credentials:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
```

**Important Notes:**
- For testing, use keys starting with `rzp_test_`
- For production, use keys starting with `rzp_live_`
- Never commit `.env.local` to version control
- The Key ID is safe to expose in frontend code (it's used in the Razorpay checkout)
- The Key Secret must remain secret and only be used on the server side

## Step 4: Test the Payment Flow

### Using Test Mode

1. Make sure you're using test keys (`rzp_test_...`)
2. Start your development server:
   ```bash
   npm run dev
   ```
3. Log in to your app and click on the credits icon in the dashboard
4. Click "View Credit Packages"
5. Select a package and click "Buy Now"
6. In the Razorpay checkout, use test card details:
   - **Card Number:** 4111 1111 1111 1111
   - **CVV:** Any 3 digits (e.g., 123)
   - **Expiry:** Any future date (e.g., 12/25)
   - **Name:** Any name
7. Complete the payment
8. Verify that:
   - Credits are added to your account
   - A success message appears
   - The transaction is recorded in Firestore under `payments` collection

### Other Test Payment Methods

Razorpay provides various test credentials:

**UPI:**
- UPI ID: `success@razorpay`
- Status: Success

**Net Banking:**
- Select any bank
- Use the test credentials provided on the Razorpay test page

**Wallets:**
- Select any wallet
- Use test credentials

For more test credentials, visit: [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

## Step 5: Go Live

### Prerequisites
1. Complete KYC verification on Razorpay
2. Add your business details
3. Set up your settlement account (bank account for receiving payments)

### Steps
1. Switch to Live Mode in Razorpay Dashboard
2. Generate Live API Keys
3. Update `.env.local` with live keys:
   ```env
   RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
   ```
4. Test with a small real payment
5. Deploy your application

## Pricing Tiers

The current pricing structure is:

| Credits | Price (INR) | Cost per Credit |
|---------|-------------|-----------------|
| 100     | ₹99         | ₹0.99           |
| 500     | ₹399        | ₹0.80 (20% off) |
| 1000    | ₹699        | ₹0.70 (30% off) |

To modify pricing, edit `/components/BuyCreditsModal.js`:

```javascript
const CREDIT_TIERS = [
  {
    credits: 100,
    price: 99,
    amount: 9900, // in paise (99 * 100)
    popular: false,
    features: ['100 AI Credits', '~100 Chat Messages', '~20 Images', 'Valid Forever'],
  },
  // ... add more tiers
];
```

**Important:** Also update the validation in `/pages/api/razorpay/create-order.js`:

```javascript
const validTiers = {
  100: 9900,  // ₹99 in paise
  500: 39900, // ₹399 in paise
  1000: 69900 // ₹699 in paise
};
```

## Security Features

✅ **Signature Verification:** All payments are verified using HMAC SHA256 signature
✅ **Server-side Validation:** Order creation and verification happen on the server
✅ **Firestore Rules:** Payment records can only be created by the API, not directly by users
✅ **Amount Validation:** Server validates that the amount matches the credit tier
✅ **Immutable Records:** Payment records cannot be modified or deleted once created

## Troubleshooting

### Payment fails with "Invalid Key ID"
- Verify that `RAZORPAY_KEY_ID` in `.env.local` is correct
- Make sure you're using the right key for the mode (test vs live)
- Restart your Next.js server after updating `.env.local`

### Payment succeeds but credits not added
- Check browser console for errors
- Check server logs for API errors
- Verify Firestore rules allow writing to `profiles` collection
- Check that the user is authenticated

### "Failed to load Razorpay SDK" error
- Check your internet connection
- Verify that the Razorpay script is not blocked by ad blockers
- Try in a different browser

### Signature verification fails
- Ensure `RAZORPAY_KEY_SECRET` is correct
- Check that the order ID and payment ID are being passed correctly
- Verify that the signature format matches Razorpay's specification

## Webhook Setup (Optional but Recommended)

For production, set up webhooks to handle payment events:

1. Go to Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Enter your webhook URL: `https://yourdomain.com/api/razorpay/webhook`
4. Select events to listen to:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Copy the **Webhook Secret**
6. Create `/pages/api/razorpay/webhook.js` to handle webhook events

## Support

- **Razorpay Documentation:** https://razorpay.com/docs/
- **Razorpay Support:** https://razorpay.com/support/
- **Test Credentials:** https://razorpay.com/docs/payments/payments/test-card-details/

## Files Modified

- ✅ `/pages/api/razorpay/create-order.js` - Creates Razorpay order
- ✅ `/pages/api/razorpay/verify-payment.js` - Verifies payment and adds credits
- ✅ `/components/BuyCreditsModal.js` - Payment UI with pricing tiers
- ✅ `/components/CreditsModal.js` - Updated to integrate BuyCreditsModal
- ✅ `/firestore.rules` - Added rules for `payments` collection
- ✅ `.env.local` - Added Razorpay credentials

## Next Steps

1. ✅ Set up Razorpay account
2. ✅ Get API keys (test mode)
3. ✅ Update `.env.local` with your keys
4. ✅ Test the payment flow
5. ⏳ Complete KYC for live mode
6. ⏳ Switch to live keys
7. ⏳ Deploy to production

---

**Note:** Always test thoroughly in test mode before going live with real payments!

