import crypto from 'crypto';
import { db } from '../../../lib/firebase';
import { doc, setDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      credits,
      amount,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !credits || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Payment verified - update credits
    const profileRef = doc(db, 'profiles', userId);
    
    // Check if profile exists, if not create it
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        credits: credits,
        displayName: '',
        bio: '',
        profilePic: '',
        createdAt: serverTimestamp()
      });
    } else {
      // Add credits to existing balance
      await setDoc(profileRef, {
        credits: increment(credits)
      }, { merge: true });
    }

    // Store payment record
    const paymentId = `payment_${Date.now()}_${userId}`;
    await setDoc(doc(db, 'payments', paymentId), {
      userId,
      amount: amount / 100, // Convert paise to rupees
      creditsPurchased: credits,
      timestamp: serverTimestamp(),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'success',
    });

    return res.status(200).json({
      success: true,
      message: `Successfully added ${credits} credits`,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      error: 'Failed to verify payment',
      details: error.message,
    });
  }
}

