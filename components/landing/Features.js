import { motion } from 'framer-motion';
import { MessageSquare, Image, Sparkles, BookTemplate, Zap, Lock } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Chat Assistant',
    description: 'Engage with GPT-4 powered AI for intelligent conversations, coding help, creative writing, and more.',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Context-aware responses', 'Multiple AI models', 'Conversation history']
  },
  {
    icon: Image,
    title: 'Image Generation',
    description: 'Create stunning, professional images from text descriptions using DALL-E 3 technology.',
    gradient: 'from-purple-500 to-pink-500',
    features: ['High-resolution outputs', 'Multiple styles', 'Image library']
  },
  {
    icon: Sparkles,
    title: 'Custom AI Personas',
    description: 'Design your own AI assistants with unique personalities, expertise, and behavior patterns.',
    gradient: 'from-orange-500 to-red-500',
    features: ['Personalized responses', 'Custom prompts', 'Unlimited personas']
  },
  {
    icon: BookTemplate,
    title: 'Prompt Templates',
    description: 'Access pre-built templates for common tasks to accelerate your creative workflow.',
    gradient: 'from-green-500 to-emerald-500',
    features: ['Ready-to-use prompts', 'Chat & image templates', 'Time-saving shortcuts']
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900 transition-colors duration-200">
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
            Powerful Features for
            <span className="block bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Creative Minds
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Everything you need to unlock your creativity with AI-powered tools
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {feature.description}
                </p>

                {/* Feature list */}
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {[
            { icon: Zap, title: 'Lightning Fast', description: 'Instant responses and real-time generation' },
            { icon: Lock, title: 'Secure & Private', description: 'Your data is encrypted and protected' },
            { icon: Sparkles, title: 'Always Improving', description: 'Regular updates with new features' }
          ].map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {benefit.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

