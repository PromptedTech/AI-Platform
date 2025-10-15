import { motion } from 'framer-motion';
import { Check, Zap, Crown } from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    features: [
      '50 free credits on signup',
      'Access to GPT-4 chat',
      'Image generation',
      'Basic templates',
      'Chat history saved',
      'Community support'
    ],
    buttonText: 'Start Free',
    popular: false
  },
  {
    name: 'Credit Packs',
    price: '$5',
    period: 'per 100 credits',
    description: 'Pay as you grow',
    icon: Crown,
    gradient: 'from-purple-500 to-pink-500',
    features: [
      '100 credits for $5',
      '500 credits for $20',
      '1000 credits for $35',
      'Never expires',
      'Daily login rewards',
      'Priority support',
      'All premium features'
    ],
    buttonText: 'Get Credits',
    popular: true
  }
];

export default function Pricing() {
  const router = useRouter();
  const { user } = useAuth();

  const handlePlanClick = (plan) => {
    if (user) {
      if (plan.name === 'Credit Packs') {
        router.push('/dashboard?modal=credits');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/signup');
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Start free, upgrade when you need more. No subscriptions, no hidden fees.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -8 }}
              className={`relative bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 transition-all duration-300 ${
                plan.popular
                  ? 'border-primary-500 shadow-2xl scale-105'
                  : 'border-gray-200 dark:border-gray-700 shadow-lg hover:border-primary-400'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${plan.gradient} mb-6`}>
                <plan.icon className="w-7 h-7 text-white" />
              </div>

              {/* Plan Details */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center mt-0.5`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {plan.buttonText}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Credit Usage Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            How Credits Work
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Chat Messages</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">1 credit per message</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Image Generation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">5 credits per image</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

