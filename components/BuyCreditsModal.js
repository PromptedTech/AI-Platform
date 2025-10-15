import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Check, Loader } from 'lucide-react';
import axios from 'axios';

const CREDIT_TIERS = [
  {
    credits: 100,
    price: 99,
    amount: 9900, // in paise
    popular: false,
    features: ['100 AI Credits', '~100 Chat Messages', '~20 Images', 'Valid Forever'],
  },
  {
    credits: 500,
    price: 399,
    amount: 39900,
    popular: true,
    features: ['500 AI Credits', '~500 Chat Messages', '~100 Images', 'Valid Forever', '20% Savings'],
  },
  {
    credits: 1000,
    price: 699,
    amount: 69900,
    popular: false,
    features: ['1000 AI Credits', '~1000 Chat Messages', '~200 Images', 'Valid Forever', '30% Savings'],
  },
];

export default function BuyCreditsModal({ isOpen, onClose, userId, onSuccess }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (tier) => {
    if (!userId) {
      setError('Please login to purchase credits');
      return;
    }

    setProcessing(true);
    setError('');
    setSelectedTier(tier);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order
      const orderResponse = await axios.post('/api/razorpay/create-order', {
        amount: tier.amount,
        credits: tier.credits,
        userId,
      });

      const { orderId, amount, currency, keyId } = orderResponse.data;

      // Razorpay payment options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'AI Platform',
        description: `Purchase ${tier.credits} Credits`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post('/api/razorpay/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId,
              credits: tier.credits,
              amount: tier.amount,
            });

            if (verifyResponse.data.success) {
              onSuccess(verifyResponse.data.newBalance);
              onClose();
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
            setSelectedTier(null);
          }
        },
        prefill: {
          email: '',
          contact: '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setSelectedTier(null);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || 'Failed to initiate payment');
      setProcessing(false);
      setSelectedTier(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Buy Credits</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose a plan that works for you
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Pricing Tiers */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREDIT_TIERS.map((tier) => (
              <motion.div
                key={tier.credits}
                whileHover={{ y: -8 }}
                className={`relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border-2 transition-all ${
                  tier.popular
                    ? 'border-primary-500 shadow-xl'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-400'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Credits */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    {tier.credits}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Credits</div>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    ₹{tier.price}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">One-time payment</div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Buy Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePurchase(tier)}
                  disabled={processing}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {processing && selectedTier?.credits === tier.credits ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Secure payment powered by Razorpay • Credits never expire • Instant delivery
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

