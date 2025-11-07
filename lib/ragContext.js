// RAG Context Injection Utilities for Nova AI
// Retrieves relevant context from knowledge base and augments prompts

import { retrieveSimilar } from './vectorStore';
import { countTokens } from './chunkText';

/**
 * Retrieve relevant context for a user query
 * 
 * @async
 * @param {string} userId - User ID
 * @param {string} query - User's query text
 * @param {Object} [options] - Configuration options
 * @param {number} [options.k=6] - Number of chunks to retrieve
 * @param {number} [options.minScore=0.7] - Minimum similarity threshold
 * @param {string[]} [options.fileIds] - Filter by specific files
 * @param {number} [options.maxTokens=2000] - Max tokens for context
 * @returns {Promise<{context: string, sources: Array<{fileId: string, chunkIndex: number, score: number, preview: string}>}>}
 * 
 * @example
 * const { context, sources } = await getRelevantContext("user123", "What is AI?");
 */
export async function getRelevantContext(userId, query, options = {}) {
  const {
    k = 6,
    minScore = 0.7,
    fileIds = [],
    maxTokens = 2000,
  } = options;

  try {
    // Retrieve similar chunks
    const results = await retrieveSimilar(userId, query, k, {
      minScore,
      fileIds: fileIds.length > 0 ? fileIds : undefined,
    });

    if (results.length === 0) {
      return {
        context: '',
        sources: [],
      };
    }

    // Build context within token limit
    const contextChunks = [];
    const sources = [];
    let currentTokens = 0;

    for (const result of results) {
      const chunkTokens = countTokens(result.chunkText);
      
      // Stop if adding this chunk would exceed limit
      if (currentTokens + chunkTokens > maxTokens) {
        break;
      }

      contextChunks.push(result.chunkText);
      currentTokens += chunkTokens;

      sources.push({
        fileId: result.fileId,
        chunkIndex: result.chunkIndex,
        score: result.score,
        preview: result.chunkText.substring(0, 100) + '...',
      });
    }

    // Format context
    const context = contextChunks.join('\n\n');

    return {
      context,
      sources,
    };

  } catch (error) {
    console.error('[ragContext] getRelevantContext error:', error);
    return {
      context: '',
      sources: [],
    };
  }
}

/**
 * Augment user messages with RAG context
 * 
 * @param {Array<{role: string, content: string}>} messages - Chat messages
 * @param {string} context - Retrieved context
 * @param {Object} [options] - Formatting options
 * @param {string} [options.contextLabel="KNOWLEDGE BASE"] - Label for context section
 * @param {boolean} [options.addToLastUserMessage=true] - Add to last user message vs system message
 * @returns {Array<{role: string, content: string}>} Augmented messages
 * 
 * @example
 * const augmented = augmentMessagesWithContext(messages, context);
 */
export function augmentMessagesWithContext(messages, context, options = {}) {
  const {
    contextLabel = 'KNOWLEDGE BASE',
    addToLastUserMessage = true,
  } = options;

  if (!context || context.trim().length === 0) {
    return messages;
  }

  const augmentedMessages = [...messages];

  if (addToLastUserMessage) {
    // Find last user message
    for (let i = augmentedMessages.length - 1; i >= 0; i--) {
      if (augmentedMessages[i].role === 'user') {
        const originalContent = augmentedMessages[i].content;
        
        // Augment with context
        augmentedMessages[i] = {
          ...augmentedMessages[i],
          content: formatContextPrompt(originalContent, context, contextLabel),
        };
        break;
      }
    }
  } else {
    // Add as system message
    const systemMessage = {
      role: 'system',
      content: `${contextLabel}:\n\n${context}\n\nPlease answer the user's question using the information from the knowledge base above when relevant.`,
    };

    // Insert after existing system messages or at beginning
    let insertIndex = 0;
    for (let i = 0; i < augmentedMessages.length; i++) {
      if (augmentedMessages[i].role === 'system') {
        insertIndex = i + 1;
      } else {
        break;
      }
    }

    augmentedMessages.splice(insertIndex, 0, systemMessage);
  }

  return augmentedMessages;
}

/**
 * Format context into a prompt template
 * 
 * @param {string} userQuery - User's query
 * @param {string} context - Retrieved context
 * @param {string} [label="KNOWLEDGE BASE"] - Context label
 * @returns {string} Formatted prompt
 */
export function formatContextPrompt(userQuery, context, label = 'KNOWLEDGE BASE') {
  return `${label}:
---
${context}
---

QUESTION: ${userQuery}

Please answer the question above using the information from the knowledge base. If the knowledge base doesn't contain relevant information, you can provide a general answer but mention that it's not from the knowledge base.`;
}

/**
 * Extract file names from sources for display
 * 
 * @async
 * @param {string} userId - User ID
 * @param {Array<{fileId: string}>} sources - Source references
 * @returns {Promise<Array<{fileId: string, fileName: string}>>} File info
 */
export async function getSourceFileNames(userId, sources) {
  if (!sources || sources.length === 0) {
    return [];
  }

  try {
    const { getUserFiles } = await import('./vectorStore');
    const files = await getUserFiles(userId);
    
    const fileMap = new Map(files.map(f => [f.id, f.name]));
    const uniqueFileIds = [...new Set(sources.map(s => s.fileId))];

    return uniqueFileIds.map(fileId => ({
      fileId,
      fileName: fileMap.get(fileId) || 'Unknown file',
    }));

  } catch (error) {
    console.error('[ragContext] getSourceFileNames error:', error);
    return sources.map(s => ({
      fileId: s.fileId,
      fileName: 'Unknown file',
    }));
  }
}

/**
 * Check if user has knowledge base content
 * 
 * @async
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user has uploaded files
 */
export async function hasKnowledgeBase(userId) {
  try {
    const { getUserFiles } = await import('./vectorStore');
    const files = await getUserFiles(userId);
    return files.length > 0;
  } catch (error) {
    console.error('[ragContext] hasKnowledgeBase error:', error);
    return false;
  }
}

/**
 * Get knowledge base statistics
 * 
 * @async
 * @param {string} userId - User ID
 * @returns {Promise<{fileCount: number, totalChunks: number}>} Stats
 */
export async function getKnowledgeStats(userId) {
  try {
    const { getEmbeddingStats } = await import('./vectorStore');
    const stats = await getEmbeddingStats(userId);
    return {
      fileCount: stats.fileCount || 0,
      totalChunks: stats.totalChunks || 0,
    };
  } catch (error) {
    console.error('[ragContext] getKnowledgeStats error:', error);
    return {
      fileCount: 0,
      totalChunks: 0,
    };
  }
}

export default {
  getRelevantContext,
  augmentMessagesWithContext,
  formatContextPrompt,
  getSourceFileNames,
  hasKnowledgeBase,
  getKnowledgeStats,
};
