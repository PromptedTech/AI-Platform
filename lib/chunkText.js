// Text chunking utilities for RAG

/**
 * Split text into chunks with overlap
 * @param {string} text - The text to chunk
 * @param {number} chunkSize - Maximum tokens per chunk (approximately 4 characters per token)
 * @param {number} overlap - Number of tokens to overlap between chunks (approximately 4 characters per token)
 * @returns {string[]} - Array of text chunks
 */
export function chunkText(text, chunkSize = 2000, overlap = 200) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Approximate token count (roughly 4 chars per token for GPT models)
  const charChunkSize = chunkSize * 4;
  const charOverlap = overlap * 4;
  const step = charChunkSize - charOverlap;
  
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + charChunkSize;
    
    // Try to end at a sentence boundary
    if (end < text.length) {
      // Look for sentence endings (., !, ?) followed by space or newline
      const sentenceEnd = text.substring(start, end).lastIndexOf(/\. |! |\? /);
      if (sentenceEnd > step) {
        end = start + sentenceEnd + 2;
      }
    }
    
    const chunk = text.substring(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start += step;
  }
  
  return chunks;
}

/**
 * Count approximate tokens in text
 * @param {string} text - The text to count
 * @returns {number} - Approximate token count
 */
export function countTokens(text) {
  if (!text) return 0;
  // Rough estimate: 4 characters per token for English text
  return Math.ceil(text.length / 4);
}

