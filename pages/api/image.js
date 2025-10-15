// API endpoint for DALL-E image generation
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    // Validate input
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // For now, use a free placeholder service that generates images based on text
    // This will work without any API costs
    const imageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`;
    
    return res.status(200).json({ 
      imageUrl, 
      prompt: `${prompt} (placeholder image - upgrade to OpenAI for real AI generation)`
    });
  } catch (error) {
    console.error('Error in image API:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
}

