// API endpoint for SSE streaming chat functionality with RAG support
import OpenAI from 'openai';
import { withAuth } from '../../../lib/authMiddleware';
import { getRelevantContext, augmentMessagesWithContext } from '../../../lib/ragContext';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supported OpenAI models
const SUPPORTED_MODELS = {
  'gpt-4o': { name: 'GPT-4o', maxTokens: 4096 },
  'gpt-4o-mini': { name: 'GPT-4o Mini', maxTokens: 4096 },
  'gpt-4-turbo': { name: 'GPT-4 Turbo', maxTokens: 4096 },
  'gpt-4': { name: 'GPT-4', maxTokens: 4096 },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', maxTokens: 4096 },
};

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // User is authenticated - req.user.uid is available
    const userId = req.user.uid;
    const { 
      messages, 
      model, 
      temperature, 
      max_tokens, 
      customPrompt,
      useKnowledge = false,
      fileIds = [],
    } = req.body;

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

    // RAG: Augment with knowledge base if enabled
    let sources = [];
    if (useKnowledge) {
      try {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        
        if (lastUserMessage) {
          const { context, sources: retrievedSources } = await getRelevantContext(
            userId,
            lastUserMessage.content,
            {
              k: 6,
              minScore: 0.7,
              fileIds: fileIds.length > 0 ? fileIds : undefined,
              maxTokens: 2000,
            }
          );

          if (context) {
            finalMessages = augmentMessagesWithContext(finalMessages, context, {
              contextLabel: 'KNOWLEDGE BASE',
              addToLastUserMessage: true,
            });
            sources = retrievedSources;
          }
        }
      } catch (ragError) {
        console.error('[chat/stream] RAG error:', ragError);
      }
    }

    const primaryModel = model && SUPPORTED_MODELS[model] ? model : 'gpt-4o-mini';
    const modelConfig = SUPPORTED_MODELS[primaryModel] || SUPPORTED_MODELS['gpt-4o-mini'];
    
    const temperatureValue = typeof temperature === 'number' ? Math.min(Math.max(temperature, 0), 2) : 0.7;
    const maxTokensValue = typeof max_tokens === 'number' 
      ? Math.max(Math.min(max_tokens, modelConfig.maxTokens), 1) 
      : 1000;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Send sources first if available
    if (sources.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
    }

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

// Export with authentication middleware
export default withAuth(handler);

