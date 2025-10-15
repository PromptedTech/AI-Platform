// Brand Configuration for AI Platform
export const brand = {
  // App Information
  name: 'AI Platform',
  tagline: 'Your AI-Powered Creative Assistant',
  description: 'Chat with advanced AI, generate stunning images, and create custom AI personas. All in one powerful platform.',
  
  // URLs
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  domain: 'ai-platform.com', // Update with your actual domain
  
  // Contact & Social
  email: 'support@ai-platform.com',
  twitter: '@aiplatform',
  
  // SEO
  keywords: [
    'AI chat',
    'GPT-4',
    'AI image generation',
    'DALL-E',
    'custom AI',
    'AI assistant',
    'artificial intelligence',
    'AI platform',
    'chatbot',
    'AI tools'
  ],
  
  // Features for marketing
  features: [
    {
      title: 'Advanced AI Chat',
      description: 'Powered by GPT-4 for intelligent conversations',
      icon: 'MessageSquare'
    },
    {
      title: 'Image Generation',
      description: 'Create stunning visuals with AI',
      icon: 'Image'
    },
    {
      title: 'Custom AI Personas',
      description: 'Build and train your own AI assistants',
      icon: 'Sparkles'
    },
    {
      title: 'Template Library',
      description: 'Pre-built prompts for quick results',
      icon: 'Library'
    }
  ],
  
  // Pricing
  pricing: {
    freeTier: {
      credits: 50,
      features: ['GPT-4 Chat', 'Image Generation', 'Custom AI', 'Templates']
    },
    creditPacks: [
      { credits: 100, price: 99, currency: 'INR' },
      { credits: 500, price: 399, currency: 'INR' },
      { credits: 1000, price: 699, currency: 'INR' }
    ]
  },
  
  // Social Media Images
  ogImage: '/images/og-image.png', // 1200x630px
  twitterImage: '/images/twitter-card.png', // 1200x600px
  
  // Theme Colors
  colors: {
    primary: '#2563eb', // primary-600
    primaryDark: '#1d4ed8', // primary-700
    secondary: '#9333ea', // purple-600
    background: '#ffffff',
    backgroundDark: '#111827'
  }
};

// SEO Configuration
export const seo = {
  defaultTitle: 'AI Platform - Your AI-Powered Creative Assistant',
  titleTemplate: '%s | AI Platform',
  defaultDescription: 'Chat with GPT-4, generate AI images, and create custom AI personas. Start for free with 50 credits.',
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: brand.url,
    siteName: brand.name,
    images: [
      {
        url: `${brand.url}${brand.ogImage}`,
        width: 1200,
        height: 630,
        alt: brand.name
      }
    ]
  },
  
  twitter: {
    handle: brand.twitter,
    site: brand.twitter,
    cardType: 'summary_large_image'
  }
};

export default brand;

