// Vector store utilities for Firestore-based semantic search
// Stores embeddings in Firestore subcollections with efficient retrieval

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  updateDoc,
  increment,
  Timestamp
} from 'firebase/firestore';
import { embedQuery } from './embeddings';

/**
 * Store embeddings in Firestore for a user
 * 
 * @async
 * @param {string} userId - User ID (for data isolation)
 * @param {string} fileId - File ID these embeddings belong to
 * @param {string[]} chunks - Text chunks
 * @param {number[][]} embeddings - Vector embeddings (one per chunk)
 * @returns {Promise<string[]>} Array of created document IDs
 * 
 * @throws {Error} If chunks and embeddings length mismatch or invalid input
 * 
 * @example
 * const docIds = await storeEmbeddings(
 *   "user123",
 *   "file456", 
 *   ["chunk1", "chunk2"],
 *   [[0.1, 0.2], [0.3, 0.4]]
 * );
 * 
 * @description
 * - Stores in Firestore path: users/{userId}/embeddings/{docId}
 * - Each document contains: fileId, chunkIndex, chunkText, embedding, createdAt
 * - User-isolated for security and multi-tenancy
 */
export async function storeEmbeddings(userId, fileId, chunks, embeddings) {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('storeEmbeddings: userId must be a non-empty string');
  }

  if (!fileId || typeof fileId !== 'string') {
    throw new Error('storeEmbeddings: fileId must be a non-empty string');
  }

  if (!Array.isArray(chunks) || !Array.isArray(embeddings)) {
    throw new Error('storeEmbeddings: chunks and embeddings must be arrays');
  }

  if (chunks.length !== embeddings.length) {
    throw new Error(
      `storeEmbeddings: chunks (${chunks.length}) and embeddings (${embeddings.length}) must have the same length`
    );
  }

  if (chunks.length === 0) {
    throw new Error('storeEmbeddings: cannot store empty arrays');
  }

  try {
    const embeddingsRef = collection(db, 'users', userId, 'embeddings');
    const docIds = [];
    const timestamp = Timestamp.now();
    
    // Store each chunk with its embedding
    for (let i = 0; i < chunks.length; i++) {
      const docRef = await addDoc(embeddingsRef, {
        fileId,
        chunkIndex: i,
        chunkText: chunks[i],
        embedding: embeddings[i],
        createdAt: timestamp,
      });
      
      docIds.push(docRef.id);
    }
    
    return docIds;

  } catch (error) {
    throw new Error(`storeEmbeddings: Firestore error - ${error.message}`);
  }
}

/**
 * Retrieve top-k semantically similar chunks for a query
 * 
 * @async
 * @param {string} uid - User ID
 * @param {string} query - Search query text
 * @param {number} [k=6] - Number of top similar results to return
 * @param {Object} [options] - Additional options
 * @param {string[]} [options.fileIds] - Filter results by specific file IDs
 * @param {number} [options.minScore] - Minimum similarity score threshold (0-1)
 * @param {string} [options.model] - Embedding model to use for query
 * @returns {Promise<Array<{id: string, chunkText: string, fileId: string, chunkIndex: number, score: number}>>} 
 *          Top-k similar chunks with similarity scores
 * 
 * @throws {Error} If uid or query is invalid
 * 
 * @example
 * const results = await retrieveSimilar(
 *   "user123",
 *   "What is machine learning?",
 *   6,
 *   { minScore: 0.7 }
 * );
 * // Returns: [
 * //   { id: "doc1", chunkText: "ML is...", score: 0.92, ... },
 * //   { id: "doc2", chunkText: "Machine learning...", score: 0.88, ... },
 * //   ...
 * // ]
 * 
 * @description
 * - Embeds query using OpenAI API
 * - Searches user's stored embeddings in Firestore
 * - Calculates cosine similarity between query and stored vectors
 * - Returns top-k most similar chunks sorted by relevance
 * - Supports filtering by file IDs and minimum score threshold
 */
export async function retrieveSimilar(uid, query, k = 6, options = {}) {
  // Input validation
  if (!uid || typeof uid !== 'string') {
    throw new Error('retrieveSimilar: uid must be a non-empty string');
  }

  if (!query || typeof query !== 'string') {
    throw new Error('retrieveSimilar: query must be a non-empty string');
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    throw new Error('retrieveSimilar: query cannot be empty');
  }

  if (typeof k !== 'number' || k <= 0) {
    throw new Error('retrieveSimilar: k must be a positive number');
  }

  const { fileIds = [], minScore = 0, model = 'text-embedding-3-small' } = options;

  try {
    // Step 1: Generate embedding for the query
    const queryEmbedding = await embedQuery(trimmedQuery, { model });

    // Step 2: Search for similar chunks
    const results = await searchSimilarChunks(
      uid,
      queryEmbedding,
      k,
      fileIds
    );

    // Step 3: Filter by minimum score if specified
    const filteredResults = minScore > 0
      ? results.filter(result => result.score >= minScore)
      : results;

    return filteredResults;

  } catch (error) {
    throw new Error(`retrieveSimilar: ${error.message}`);
  }
}

/**
 * Search stored embeddings for similar chunks using cosine similarity
 * 
 * @async
 * @param {string} userId - User ID
 * @param {number[]} queryEmbedding - Query vector embedding
 * @param {number} [topK=6] - Number of top results to return
 * @param {string[]} [fileIds=[]] - Optional filter by file IDs
 * @returns {Promise<Array<{id: string, chunkText: string, fileId: string, chunkIndex: number, score: number}>>}
 *          Array of similar chunks with similarity scores
 * 
 * @example
 * const queryVector = [0.1, 0.2, 0.3, ...];
 * const results = await searchSimilarChunks("user123", queryVector, 10);
 */
export async function searchSimilarChunks(userId, queryEmbedding, topK = 6, fileIds = []) {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('searchSimilarChunks: userId must be a non-empty string');
  }

  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    throw new Error('searchSimilarChunks: queryEmbedding must be a non-empty array');
  }

  if (typeof topK !== 'number' || topK <= 0) {
    throw new Error('searchSimilarChunks: topK must be a positive number');
  }

  try {
    const embeddingsRef = collection(db, 'users', userId, 'embeddings');
    
    // Build query with optional file filter
    let q = query(embeddingsRef);
    
    if (Array.isArray(fileIds) && fileIds.length > 0) {
      // Firestore 'in' query supports up to 10 items
      if (fileIds.length <= 10) {
        q = query(embeddingsRef, where('fileId', 'in', fileIds));
      } else {
        console.warn('searchSimilarChunks: fileIds filter limited to first 10 files');
        q = query(embeddingsRef, where('fileId', 'in', fileIds.slice(0, 10)));
      }
    }
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }

    const results = [];
    
    // Calculate similarity for each stored embedding
    snapshot.forEach((doc) => {
      const data = doc.data();
      const storedEmbedding = data.embedding;
      
      if (Array.isArray(storedEmbedding) && storedEmbedding.length > 0) {
        const score = cosineSimilarity(queryEmbedding, storedEmbedding);
        
        results.push({
          id: doc.id,
          chunkText: data.chunkText || '',
          fileId: data.fileId || '',
          chunkIndex: data.chunkIndex ?? 0,
          score,
          createdAt: data.createdAt,
        });
      }
    });
    
    // Sort by similarity score (highest first) and return top-k
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, topK);

  } catch (error) {
    throw new Error(`searchSimilarChunks: Firestore error - ${error.message}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 * 
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity score (range: -1 to 1, typically 0 to 1 for embeddings)
 * 
 * @example
 * const similarity = cosineSimilarity([1, 0, 0], [1, 0, 0]); // Returns: 1.0 (identical)
 * const similarity = cosineSimilarity([1, 0], [0, 1]); // Returns: 0.0 (orthogonal)
 * 
 * @description
 * Cosine similarity measures the cosine of the angle between two vectors
 * - Score of 1: Vectors point in same direction (most similar)
 * - Score of 0: Vectors are orthogonal (no similarity)
 * - Score of -1: Vectors point in opposite directions (least similar)
 * - For normalized embeddings, scores typically range from 0 to 1
 */
function cosineSimilarity(vecA, vecB) {
  // Input validation
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    console.error('cosineSimilarity: inputs must be arrays');
    return 0;
  }
  
  if (vecA.length === 0 || vecB.length === 0) {
    console.error('cosineSimilarity: vectors cannot be empty');
    return 0;
  }

  if (vecA.length !== vecB.length) {
    console.error(`cosineSimilarity: dimension mismatch (${vecA.length} vs ${vecB.length})`);
    return 0;
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  // Calculate dot product and magnitudes in single pass
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    
    // Validate numeric values
    if (typeof a !== 'number' || typeof b !== 'number' || isNaN(a) || isNaN(b)) {
      console.error('cosineSimilarity: vectors contain non-numeric values');
      return 0;
    }
    
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }
  
  // Take square roots for magnitudes
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  // Calculate and return cosine similarity
  const similarity = dotProduct / (magnitudeA * magnitudeB);
  
  // Clamp to valid range (handle floating point errors)
  return Math.max(-1, Math.min(1, similarity));
}

/**
 * Delete all embeddings associated with a file
 * 
 * @async
 * @param {string} userId - User ID
 * @param {string} fileId - File ID whose embeddings should be deleted
 * @returns {Promise<number>} Number of embeddings deleted
 * 
 * @throws {Error} If Firestore operation fails
 * 
 * @example
 * const deletedCount = await deleteFileEmbeddings("user123", "file456");
 * console.log(`Deleted ${deletedCount} embeddings`);
 */
export async function deleteFileEmbeddings(userId, fileId) {
  if (!userId || !fileId) {
    throw new Error('deleteFileEmbeddings: userId and fileId are required');
  }

  try {
    const embeddingsRef = collection(db, 'users', userId, 'embeddings');
    const q = query(embeddingsRef, where('fileId', '==', fileId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 0;
    }

    const deletePromises = snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref));
    await Promise.all(deletePromises);
    
    return snapshot.size;

  } catch (error) {
    throw new Error(`deleteFileEmbeddings: Firestore error - ${error.message}`);
  }
}

/**
 * Get all files for a user with metadata
 * 
 * @async
 * @param {string} userId - User ID
 * @returns {Promise<Array<{id: string, name: string, type: string, size: number, chunkCount: number, createdAt: any}>>}
 *          Array of file metadata objects
 * 
 * @example
 * const files = await getUserFiles("user123");
 * // Returns: [
 * //   { id: "file1", name: "document.pdf", type: "application/pdf", size: 1024, ... },
 * //   ...
 * // ]
 */
export async function getUserFiles(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('getUserFiles: userId must be a non-empty string');
  }

  try {
    const filesRef = collection(db, 'users', userId, 'files');
    const snapshot = await getDocs(filesRef);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

  } catch (error) {
    throw new Error(`getUserFiles: Firestore error - ${error.message}`);
  }
}

/**
 * Delete a file and all its associated embeddings
 * 
 * @async
 * @param {string} userId - User ID
 * @param {string} fileId - File ID to delete
 * @returns {Promise<{file: boolean, embeddings: number}>} Deletion result
 * 
 * @throws {Error} If Firestore operation fails
 * 
 * @example
 * const result = await deleteFile("user123", "file456");
 * // Returns: { file: true, embeddings: 15 }
 */
export async function deleteFile(userId, fileId) {
  if (!userId || !fileId) {
    throw new Error('deleteFile: userId and fileId are required');
  }

  try {
    // Delete embeddings first
    const embeddingsDeleted = await deleteFileEmbeddings(userId, fileId);
    
    // Delete file metadata
    const fileRef = doc(db, 'users', userId, 'files', fileId);
    await deleteDoc(fileRef);
    
    return {
      file: true,
      embeddings: embeddingsDeleted,
    };

  } catch (error) {
    throw new Error(`deleteFile: ${error.message}`);
  }
}

/**
 * Get embedding statistics for a user
 * 
 * @async
 * @param {string} userId - User ID
 * @returns {Promise<{totalEmbeddings: number, fileCount: number, totalChunks: number}>}
 *          Statistics object
 * 
 * @example
 * const stats = await getEmbeddingStats("user123");
 * // Returns: { totalEmbeddings: 150, fileCount: 5, totalChunks: 150 }
 */
export async function getEmbeddingStats(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('getEmbeddingStats: userId must be a non-empty string');
  }

  try {
    const [files, embeddings] = await Promise.all([
      getUserFiles(userId),
      getDocs(collection(db, 'users', userId, 'embeddings')),
    ]);

    return {
      totalEmbeddings: embeddings.size,
      fileCount: files.length,
      totalChunks: embeddings.size,
    };

  } catch (error) {
    throw new Error(`getEmbeddingStats: ${error.message}`);
  }
}

/**
 * Batch delete multiple files and their embeddings
 * 
 * @async
 * @param {string} userId - User ID
 * @param {string[]} fileIds - Array of file IDs to delete
 * @returns {Promise<{filesDeleted: number, embeddingsDeleted: number}>} Deletion summary
 * 
 * @example
 * const result = await batchDeleteFiles("user123", ["file1", "file2"]);
 * // Returns: { filesDeleted: 2, embeddingsDeleted: 30 }
 */
export async function batchDeleteFiles(userId, fileIds) {
  if (!userId || !Array.isArray(fileIds)) {
    throw new Error('batchDeleteFiles: userId (string) and fileIds (array) are required');
  }

  if (fileIds.length === 0) {
    return { filesDeleted: 0, embeddingsDeleted: 0 };
  }

  try {
    const results = await Promise.all(
      fileIds.map(fileId => deleteFile(userId, fileId))
    );

    const summary = results.reduce(
      (acc, result) => ({
        filesDeleted: acc.filesDeleted + (result.file ? 1 : 0),
        embeddingsDeleted: acc.embeddingsDeleted + result.embeddings,
      }),
      { filesDeleted: 0, embeddingsDeleted: 0 }
    );

    return summary;

  } catch (error) {
    throw new Error(`batchDeleteFiles: ${error.message}`);
  }
}

// Export all functions
export default {
  storeEmbeddings,
  retrieveSimilar,
  searchSimilarChunks,
  deleteFileEmbeddings,
  getUserFiles,
  deleteFile,
  getEmbeddingStats,
  batchDeleteFiles,
};