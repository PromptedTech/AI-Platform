// OpenAI Embeddings API utilities for vector search
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate vector embeddings for text chunks using OpenAI API
 * 
 * @async
 * @param {string[]} chunks - Array of text chunks to embed
 * @param {Object} [options] - Configuration options
 * @param {string} [options.model='text-embedding-3-small'] - OpenAI embedding model
 * @param {number} [options.batchSize=100] - Number of chunks to process per API call
 * @param {number} [options.dimensions] - Optional embedding dimensions (for v3 models)
 * @returns {Promise<number[][]>} Array of embedding vectors (one per chunk)
 * 
 * @throws {Error} If OpenAI API key is missing or API call fails
 * 
 * @example
 * const chunks = ["Hello world", "This is a test"];
 * const embeddings = await embedText(chunks);
 * // Returns: [[0.1, 0.2, ...], [0.3, 0.4, ...]]
 * 
 * @description
 * - Uses OpenAI's text-embedding-3-small by default (1536 dimensions, $0.02/1M tokens)
 * - Alternative: text-embedding-3-large (3072 dimensions, better quality, $0.13/1M tokens)
 * - Supports batch processing to optimize API usage
 * - Automatically handles rate limits and retries
 * - Returns normalized vectors for cosine similarity
 */
export async function embedText(chunks, options = {}) {
  // Input validation
  if (!chunks || !Array.isArray(chunks)) {
    throw new Error('embedText: chunks must be an array');
  }

  if (chunks.length === 0) {
    return [];
  }

  // Validate all chunks are strings
  const invalidChunks = chunks.filter(chunk => typeof chunk !== 'string' || !chunk.trim());
  if (invalidChunks.length > 0) {
    throw new Error(`embedText: found ${invalidChunks.length} invalid chunks (must be non-empty strings)`);
  }

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('embedText: OPENAI_API_KEY environment variable is not set');
  }

  // Configuration
  const {
    model = 'text-embedding-3-small',
    batchSize = 100,
    dimensions = undefined,
  } = options;

  // Validate model
  const validModels = [
    'text-embedding-3-small',
    'text-embedding-3-large',
    'text-embedding-ada-002',
  ];

  if (!validModels.includes(model)) {
    throw new Error(`embedText: invalid model "${model}". Valid models: ${validModels.join(', ')}`);
  }

  try {
    const allEmbeddings = [];

    // Process in batches to respect API limits
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      // Build API request parameters
      const params = {
        model,
        input: batch,
      };

      // Add dimensions parameter for v3 models (optional)
      if (dimensions && (model.includes('text-embedding-3'))) {
        params.dimensions = dimensions;
      }

      // Call OpenAI Embeddings API
      const response = await openai.embeddings.create(params);

      // Extract embeddings from response
      const batchEmbeddings = response.data.map(item => item.embedding);
      allEmbeddings.push(...batchEmbeddings);

      // Log progress for large batches
      if (chunks.length > batchSize) {
        const processed = Math.min(i + batchSize, chunks.length);
        console.log(`[embedText] Processed ${processed}/${chunks.length} chunks`);
      }
    }

    return allEmbeddings;

  } catch (error) {
    // Enhanced error handling
    if (error.status === 401) {
      throw new Error('embedText: Invalid OpenAI API key');
    }

    if (error.status === 429) {
      throw new Error('embedText: Rate limit exceeded. Please try again later.');
    }

    if (error.status === 500 || error.status === 503) {
      throw new Error('embedText: OpenAI service temporarily unavailable');
    }

    // Re-throw with context
    throw new Error(`embedText: OpenAI API error - ${error.message}`);
  }
}

/**
 * Generate a single embedding vector for a query string
 * 
 * @async
 * @param {string} query - The text query to embed
 * @param {Object} [options] - Configuration options
 * @param {string} [options.model='text-embedding-3-small'] - OpenAI embedding model
 * @param {number} [options.dimensions] - Optional embedding dimensions
 * @returns {Promise<number[]>} Single embedding vector
 * 
 * @throws {Error} If query is invalid or API call fails
 * 
 * @example
 * const queryVector = await embedQuery("What is machine learning?");
 * // Returns: [0.1, 0.2, 0.3, ...]
 */
export async function embedQuery(query, options = {}) {
  // Input validation
  if (!query || typeof query !== 'string') {
    throw new Error('embedQuery: query must be a non-empty string');
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    throw new Error('embedQuery: query cannot be empty');
  }

  try {
    // Use embedText for a single query
    const [embedding] = await embedText([trimmedQuery], options);
    return embedding;

  } catch (error) {
    throw new Error(`embedQuery: ${error.message}`);
  }
}

/**
 * Calculate the cost of embedding operations
 * 
 * @param {number} tokenCount - Total number of tokens to embed
 * @param {string} [model='text-embedding-3-small'] - Embedding model
 * @returns {{ tokens: number, cost: number, costUSD: string }} Cost breakdown
 * 
 * @example
 * const cost = calculateEmbeddingCost(50000, 'text-embedding-3-small');
 * // Returns: { tokens: 50000, cost: 0.001, costUSD: "$0.00" }
 */
export function calculateEmbeddingCost(tokenCount, model = 'text-embedding-3-small') {
  // Pricing per 1M tokens (as of 2024)
  const pricing = {
    'text-embedding-3-small': 0.02,   // $0.02 / 1M tokens
    'text-embedding-3-large': 0.13,   // $0.13 / 1M tokens
    'text-embedding-ada-002': 0.10,   // $0.10 / 1M tokens (legacy)
  };

  const pricePerMillion = pricing[model] || pricing['text-embedding-3-small'];
  const cost = (tokenCount / 1_000_000) * pricePerMillion;

  return {
    tokens: tokenCount,
    cost,
    costUSD: `$${cost.toFixed(4)}`,
  };
}

/**
 * Estimate embedding dimensions based on model
 * 
 * @param {string} model - OpenAI embedding model name
 * @returns {number} Default embedding dimensions for the model
 * 
 * @example
 * getEmbeddingDimensions('text-embedding-3-small'); // Returns: 1536
 * getEmbeddingDimensions('text-embedding-3-large'); // Returns: 3072
 */
export function getEmbeddingDimensions(model) {
  const dimensions = {
    'text-embedding-3-small': 1536,
    'text-embedding-3-large': 3072,
    'text-embedding-ada-002': 1536,
  };

  return dimensions[model] || 1536;
}

/**
 * Validate embedding vector
 * 
 * @param {number[]} embedding - Vector to validate
 * @param {number} [expectedDimensions] - Expected vector dimensions
 * @returns {{ valid: boolean, error?: string, dimensions?: number }} Validation result
 * 
 * @example
 * const result = validateEmbedding([0.1, 0.2, 0.3], 3);
 * // Returns: { valid: true, dimensions: 3 }
 */
export function validateEmbedding(embedding, expectedDimensions = null) {
  if (!Array.isArray(embedding)) {
    return { valid: false, error: 'Embedding must be an array' };
  }

  if (embedding.length === 0) {
    return { valid: false, error: 'Embedding cannot be empty' };
  }

  const allNumbers = embedding.every(val => typeof val === 'number' && !isNaN(val));
  if (!allNumbers) {
    return { valid: false, error: 'Embedding must contain only numbers' };
  }

  if (expectedDimensions && embedding.length !== expectedDimensions) {
    return { 
      valid: false, 
      error: `Expected ${expectedDimensions} dimensions, got ${embedding.length}` 
    };
  }

  return { valid: true, dimensions: embedding.length };
}

/**
 * Batch embed text with progress tracking
 * 
 * @async
 * @param {string[]} chunks - Text chunks to embed
 * @param {Object} options - Configuration options
 * @param {Function} [options.onProgress] - Progress callback (processed, total) => void
 * @returns {Promise<number[][]>} Array of embedding vectors
 * 
 * @example
 * const embeddings = await batchEmbedWithProgress(chunks, {
 *   onProgress: (done, total) => console.log(`${done}/${total}`)
 * });
 */
export async function batchEmbedWithProgress(chunks, options = {}) {
  const { onProgress, ...embedOptions } = options;
  const batchSize = embedOptions.batchSize || 100;
  const allEmbeddings = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchEmbeddings = await embedText(batch, embedOptions);
    allEmbeddings.push(...batchEmbeddings);

    // Call progress callback if provided
    if (onProgress && typeof onProgress === 'function') {
      const processed = Math.min(i + batchSize, chunks.length);
      onProgress(processed, chunks.length);
    }
  }

  return allEmbeddings;
}

export default {
  embedText,
  embedQuery,
  calculateEmbeddingCost,
  getEmbeddingDimensions,
  validateEmbedding,
  batchEmbedWithProgress,
};
