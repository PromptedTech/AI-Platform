// Chat Templates
const chatTemplates = [
  {
    id: 'study-helper',
    title: '📚 Study Helper',
    description: 'Get help with homework, explanations, and learning new concepts',
    prompt: 'I need help understanding and learning about specific topics. Please explain concepts clearly and help me with my studies.'
  },
  {
    id: 'fitness-coach',
    title: '💪 Fitness Coach',
    description: 'Personalized workout plans and nutrition advice',
    prompt: 'Act as a fitness coach. Help me create workout routines, give nutrition advice, and motivate me to reach my fitness goals.'
  },
  {
    id: 'startup-mentor',
    title: '🚀 Startup Mentor',
    description: 'Business advice, strategy, and entrepreneurship guidance',
    prompt: 'Act as an experienced startup mentor. Help me with business strategy, product development, funding advice, and entrepreneurial challenges.'
  },
  {
    id: 'creative-writer',
    title: '✍️ Creative Writer',
    description: 'Story ideas, creative writing, and brainstorming',
    prompt: 'Help me with creative writing, generate story ideas, develop characters, and improve my writing skills.'
  },
  {
    id: 'code-mentor',
    title: '💻 Code Mentor',
    description: 'Programming help, debugging, and coding best practices',
    prompt: 'Act as a coding mentor. Help me debug code, explain programming concepts, suggest best practices, and improve my coding skills.'
  },
  {
    id: 'language-tutor',
    title: '🌍 Language Tutor',
    description: 'Learn languages through conversation and practice',
    prompt: 'Be my language tutor. Help me practice conversations, correct my grammar, teach vocabulary, and explain cultural nuances.'
  },
  {
    id: 'career-advisor',
    title: '👔 Career Advisor',
    description: 'Resume tips, interview prep, and career guidance',
    prompt: 'Act as a career advisor. Help me with resume writing, interview preparation, career planning, and professional development.'
  },
  {
    id: 'math-tutor',
    title: '🔢 Math Tutor',
    description: 'Math problems, equations, and step-by-step solutions',
    prompt: 'Be my math tutor. Help me solve problems step-by-step, explain mathematical concepts, and improve my problem-solving skills.'
  }
];

// Image Templates
const imageTemplates = [
  {
    id: 'cyberpunk-cityscape',
    title: '🌃 Cyberpunk Cityscape',
    description: 'Futuristic neon-lit city with flying cars',
    prompt: 'A stunning cyberpunk cityscape at night, neon lights reflecting on wet streets, flying cars, holographic advertisements, futuristic skyscrapers, vibrant purple and blue color scheme, highly detailed, 4k'
  },
  {
    id: 'minimalist-logo',
    title: '🎨 Minimalist Logo',
    description: 'Clean and modern logo design',
    prompt: 'A minimalist modern logo design, clean lines, geometric shapes, professional, simple color palette, suitable for a tech startup, vector style'
  },
  {
    id: 'fantasy-character',
    title: '⚔️ Fantasy Character',
    description: 'Epic fantasy warrior or magical being',
    prompt: 'A detailed fantasy character portrait, epic warrior with magical armor, dramatic lighting, fantasy art style, detailed face, mystical atmosphere, high quality digital art'
  },
  {
    id: 'nature-landscape',
    title: '🏞️ Nature Landscape',
    description: 'Beautiful scenic nature photography',
    prompt: 'A breathtaking landscape photograph, majestic mountains, crystal clear lake reflection, golden hour lighting, dramatic clouds, vibrant colors, professional photography, 8k resolution'
  },
  {
    id: 'abstract-art',
    title: '🎭 Abstract Art',
    description: 'Modern abstract artwork with bold colors',
    prompt: 'Modern abstract art, bold geometric shapes, vibrant color palette, fluid forms, contemporary style, gallery-worthy, high contrast, artistic composition'
  },
  {
    id: 'cute-mascot',
    title: '🐾 Cute Mascot',
    description: 'Adorable cartoon character or brand mascot',
    prompt: 'An adorable cartoon mascot character, friendly and approachable, big expressive eyes, cute features, vibrant colors, suitable for branding, 3D render style'
  },
  {
    id: 'product-mockup',
    title: '📱 Product Mockup',
    description: 'Professional product visualization',
    prompt: 'A professional product mockup, sleek modern design, studio lighting, clean white background, high-end commercial photography style, detailed and realistic'
  },
  {
    id: 'sci-fi-scene',
    title: '🚀 Sci-Fi Scene',
    description: 'Futuristic space or technology scene',
    prompt: 'A cinematic sci-fi scene, futuristic space station, advanced technology, dramatic lighting, stars and nebula in background, highly detailed, concept art style, 4k quality'
  },
  {
    id: 'retro-poster',
    title: '📺 Retro Poster',
    description: 'Vintage-style poster design',
    prompt: 'A vintage retro poster design, 1950s aesthetic, bold typography, limited color palette, classic illustration style, nostalgic feel, grain texture'
  },
  {
    id: 'food-photography',
    title: '🍔 Food Photography',
    description: 'Delicious and appetizing food shot',
    prompt: 'Professional food photography, delicious gourmet dish, perfect plating, natural lighting, appetizing presentation, shallow depth of field, restaurant quality, mouth-watering'
  }
];

// Export getter functions
export function getChatTemplates() {
  return chatTemplates;
}

export function getImageTemplates() {
  return imageTemplates;
}

// Export arrays directly as well
export { chatTemplates, imageTemplates };

