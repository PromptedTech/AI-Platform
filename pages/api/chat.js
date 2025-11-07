// API endpoint for GPT-4 chat functionality with RAG support
import OpenAI from 'openai';
import { withAuth } from '../../lib/authMiddleware';
import { getRelevantContext, augmentMessagesWithContext } from '../../lib/ragContext';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supported OpenAI models
const SUPPORTED_MODELS = {
  'gpt-4o': { name: 'GPT-4o', maxTokens: 4096, contextWindow: 128000 },
  'gpt-4o-mini': { name: 'GPT-4o Mini', maxTokens: 4096, contextWindow: 128000 },
  'gpt-4-turbo': { name: 'GPT-4 Turbo', maxTokens: 4096, contextWindow: 128000 },
  'gpt-4': { name: 'GPT-4', maxTokens: 4096, contextWindow: 8192 },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', maxTokens: 4096, contextWindow: 16385 },
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
        // Get last user message for context retrieval
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
        console.error('[chat] RAG error:', ragError);
        // Continue without RAG if it fails
      }
    }

    // Validate and set model
    const primaryModel = model && SUPPORTED_MODELS[model] ? model : 'gpt-4o-mini';
    const fallbacks = ['gpt-3.5-turbo'];
    const tried = new Set();

    async function tryModel(modelName) {
      const modelConfig = SUPPORTED_MODELS[modelName] || SUPPORTED_MODELS['gpt-4o-mini'];
      
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: finalMessages,
        temperature: typeof temperature === 'number' ? Math.min(Math.max(temperature, 0), 2) : 0.7,
        max_tokens: typeof max_tokens === 'number' 
          ? Math.max(Math.min(max_tokens, modelConfig.maxTokens), 1) 
          : 1000,
      });
      return completion;
    }

    let completion;
    let lastErr;
    let usedModel = primaryModel;
    const modelsToTry = [primaryModel, ...fallbacks.filter((m) => m !== primaryModel)];
    
    for (const m of modelsToTry) {
      if (tried.has(m)) continue;
      tried.add(m);
      try {
        completion = await tryModel(m);
        usedModel = m;
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
    
    return res.status(200).json({ 
      reply, 
      usage: completion.usage,
      model: usedModel,
      sources: sources.length > 0 ? sources : undefined,
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
}

// Export with authentication middleware
export default withAuth(handler);
