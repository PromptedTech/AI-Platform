// Text chunking utilities for RAG (Retrieval-Augmented Generation)

/**
 * Split text into overlapping chunks for vector embeddings
 * 
 * @param {string} text - The text to chunk
 * @param {number} [chunkTokens=500] - Target tokens per chunk (approximate, using 4 chars/token heuristic)
 * @param {number} [overlap=50] - Number of tokens to overlap between consecutive chunks
 * @returns {string[]} Array of text chunks with controlled overlap
 * 
 * @example
 * const text = "Long document...";
 * const chunks = chunkText(text, 500, 50);
 * // Returns: ["chunk1...", "...overlap...chunk2...", ...]
 * 
 * @description
 * - Uses character-based approximation (4 chars ≈ 1 token for English)
 * - Attempts to split at sentence boundaries for better semantic coherence
 * - Overlap ensures context continuity across chunks
 * - Returns empty array for invalid input
 */
export function chunkText(text, chunkTokens = 500, overlap = 50) {
  // Input validation
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Trim and normalize whitespace
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  
  if (normalizedText.length === 0) {
    return [];
  }

  // Convert token counts to character estimates (4 chars ≈ 1 token)
  const CHARS_PER_TOKEN = 4;
  const chunkSizeChars = chunkTokens * CHARS_PER_TOKEN;
  const overlapChars = overlap * CHARS_PER_TOKEN;
  
  // Calculate step size (chunk size minus overlap)
  const stepSize = Math.max(chunkSizeChars - overlapChars, 1);
  
  const chunks = [];
  let position = 0;
  
  while (position < normalizedText.length) {
    // Calculate chunk boundaries
    let endPosition = Math.min(position + chunkSizeChars, normalizedText.length);
    
    // Try to break at sentence boundaries for better semantic coherence
    if (endPosition < normalizedText.length) {
      const searchText = normalizedText.substring(position, endPosition);
      
      // Look for sentence endings: period, exclamation, question mark followed by space
      const sentencePatterns = [
        searchText.lastIndexOf('. '),
        searchText.lastIndexOf('! '),
        searchText.lastIndexOf('? '),
        searchText.lastIndexOf('.\n'),
        searchText.lastIndexOf('!\n'),
        searchText.lastIndexOf('?\n'),
      ];
      
      // Find the last sentence boundary
      const lastSentenceEnd = Math.max(...sentencePatterns);
      
      // Use sentence boundary if it's not too far back (at least 50% of chunk size)
      if (lastSentenceEnd > stepSize / 2) {
        endPosition = position + lastSentenceEnd + 1;
      }
    }
    
    // Extract and clean chunk
    const chunk = normalizedText.substring(position, endPosition).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    // Move to next chunk with overlap
    position += stepSize;
  }
  
  return chunks;
}

/**
 * Count approximate tokens in text using character-based heuristic
 * 
 * @param {string} text - The text to analyze
 * @returns {number} Estimated token count (using 4 chars/token approximation)
 * 
 * @example
 * countTokens("Hello, world!"); // Returns ~3
 * 
 * @description
 * Uses rough estimate: 1 token ≈ 4 characters for English text
 * For precise token counting, use tiktoken library
 */
export function countTokens(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  // Normalize whitespace and trim
  const normalized = text.trim().replace(/\s+/g, ' ');
  
  // Rough estimate: 4 characters per token for English text
  const CHARS_PER_TOKEN = 4;
  return Math.ceil(normalized.length / CHARS_PER_TOKEN);
}

/**
 * Split text by paragraphs for preprocessing
 * 
 * @param {string} text - The text to split
 * @returns {string[]} Array of paragraphs
 * 
 * @example
 * const paragraphs = splitParagraphs("Para 1\n\nPara 2\n\nPara 3");
 * // Returns: ["Para 1", "Para 2", "Para 3"]
 */
export function splitParagraphs(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Split on multiple newlines (paragraph breaks)
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Validate chunk configuration parameters
 * 
 * @param {number} chunkTokens - Desired chunk size in tokens
 * @param {number} overlap - Desired overlap in tokens
 * @returns {{ valid: boolean, error?: string }} Validation result
 * 
 * @example
 * validateChunkConfig(500, 50); // { valid: true }
 * validateChunkConfig(100, 200); // { valid: false, error: "..." }
 */
export function validateChunkConfig(chunkTokens, overlap) {
  if (typeof chunkTokens !== 'number' || chunkTokens <= 0) {
    return { valid: false, error: 'chunkTokens must be a positive number' };
  }
  
  if (typeof overlap !== 'number' || overlap < 0) {
    return { valid: false, error: 'overlap must be a non-negative number' };
  }
  
  if (overlap >= chunkTokens) {
    return { valid: false, error: 'overlap must be less than chunkTokens' };
  }
  
  // Warn if chunk size is too large (embedding models have limits)
  if (chunkTokens > 8000) {
    return { 
      valid: false, 
      error: 'chunkTokens exceeds typical embedding model limits (max ~8000)' 
    };
  }
  
  return { valid: true };
}
