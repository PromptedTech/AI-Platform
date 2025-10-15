import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, credits, userId } = req.body;

    if (!amount || !credits || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate amount matches credit tier
    const validTiers = {
      100: 9900,  // ₹99 in paise
      500: 39900, // ₹399 in paise
      1000: 69900 // ₹699 in paise
    };

    if (validTiers[credits] !== amount) {
      return res.status(400).json({ error: 'Invalid amount for credit tier' });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create order
    const options = {
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: `${userId.slice(0,8)}_${Date.now().toString().slice(-8)}`,
      notes: {
        userId,
        credits: credits.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      error: 'Failed to create order',
      details: error.message,
    });
  }
}

