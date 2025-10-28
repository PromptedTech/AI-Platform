// API endpoint for SSE streaming chat functionality
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
    const { messages, model, temperature, max_tokens, customPrompt } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Ensure server is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Server not configured: missing OPENAI_API_KEY' });
    }

    // Prepend custom prompt as system message if provided
    let finalMessages = [...messages];
    if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim()) {
      const hasSystemMessage = finalMessages.some(msg => msg.role === 'system');
      if (!hasSystemMessage) {
        finalMessages = [
          { role: 'system', content: customPrompt.trim() },
          ...messages
        ];
      }
    }

    const primaryModel = model || 'gpt-4o-mini';
    const temperatureValue = typeof temperature === 'number' ? Math.min(Math.max(temperature, 0), 2) : 0.7;
    const maxTokensValue = typeof max_tokens === 'number' ? Math.max(Math.min(max_tokens, 4000), 1) : 1000;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: primaryModel,
      messages: finalMessages,
      temperature: temperatureValue,
      max_tokens: maxTokensValue,
      stream: true,
    });

    // Stream tokens
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
      }
      
      // Handle finish
      if (chunk.choices?.[0]?.finish_reason) {
        res.write(`data: ${JSON.stringify({ type: 'done', finish_reason: chunk.choices[0].finish_reason })}\n\n`);
        
        // Send usage info if available
        if (chunk.usage) {
          res.write(`data: ${JSON.stringify({ type: 'usage', usage: chunk.usage })}\n\n`);
        }
        break;
      }
    }

    res.end();

  } catch (error) {
    console.error('Error in streaming chat API:', error);
    
    // Send error via SSE
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
}

