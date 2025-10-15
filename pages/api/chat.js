// API endpoint for GPT-4 chat functionality
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
      // Check if there's already a system message
      const hasSystemMessage = finalMessages.some(msg => msg.role === 'system');
      if (!hasSystemMessage) {
        // Add custom prompt as first system message
        finalMessages = [
          { role: 'system', content: customPrompt.trim() },
          ...messages
        ];
      }
    }

    const primaryModel = model || 'gpt-4o-mini';
    const fallbacks = ['gpt-3.5-turbo'];
    const tried = new Set();

    async function tryModel(modelName) {
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: finalMessages,
        temperature: typeof temperature === 'number' ? Math.min(Math.max(temperature, 0), 2) : 0.7,
        max_tokens: typeof max_tokens === 'number' ? Math.max(Math.min(max_tokens, 4000), 1) : 1000,
      });
      return completion;
    }

    let completion;
    let lastErr;
    const modelsToTry = [primaryModel, ...fallbacks.filter((m) => m !== primaryModel)];
    for (const m of modelsToTry) {
      if (tried.has(m)) continue;
      tried.add(m);
      try {
        completion = await tryModel(m);
        break;
      } catch (e) {
        lastErr = e;
        // If model not found or access denied, continue to next fallback
        const msg = String(e?.message || '');
        if (msg.includes('does not exist') || msg.includes('You do not have access') || msg.includes('model_not_found')) {
          continue;
        }
        // For other errors (network, etc.), break and handle below
        break;
      }
    }

    if (!completion) {
      throw lastErr || new Error('OpenAI request failed');
    }

    const reply = completion.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply, usage: completion.usage });

  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
}

