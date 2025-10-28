// Simple in-memory vector store for Firestore
// Stores embeddings in Firestore subcollection

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
  increment
} from 'firebase/firestore';

/**
 * Store embeddings in Firestore
 * @param {string} userId - User ID
 * @param {string} fileId - File ID
 * @param {Array} chunks - Text chunks
 * @param {Array} embeddings - Vector embeddings
 * @returns {Promise<string[]>} - Array of document IDs
 */
export async function storeEmbeddings(userId, fileId, chunks, embeddings) {
  if (!chunks || !embeddings || chunks.length !== embeddings.length) {
    throw new Error('Chunks and embeddings must have the same length');
  }

  const docIds = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const docRef = await addDoc(collection(db, 'users', userId, 'embeddings'), {
      fileId,
      chunkIndex: i,
      chunkText: chunks[i],
      embedding: embeddings[i],
      createdAt: new Date().toISOString(),
    });
    
    docIds.push(docRef.id);
  }
  
  return docIds;
}

/**
 * Retrieve top-k similar chunks using cosine similarity
 * @param {string} userId - User ID
 * @param {Array} queryEmbedding - Query vector
 * @param {number} topK - Number of top results to return
 * @param {Array<string>} fileIds - Optional filter by file IDs
 * @returns {Promise<Array>} - Array of {chunkText, fileId, score}
 */
export async function searchSimilarChunks(userId, queryEmbedding, topK = 6, fileIds = []) {
  const embeddingsRef = collection(db, 'users', userId, 'embeddings');
  
  // Build query with optional file filter
  let q = query(embeddingsRef);
  if (fileIds.length > 0) {
    q = query(embeddingsRef, where('fileId', 'in', fileIds));
  }
  
  const snapshot = await getDocs(q);
  const results = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    const storedEmbedding = data.embedding;
    
    if (storedEmbedding) {
      const score = cosineSimilarity(queryEmbedding, storedEmbedding);
      results.push({
        id: doc.id,
        chunkText: data.chunkText,
        fileId: data.fileId,
        chunkIndex: data.chunkIndex,
        score,
      });
    }
  });
  
  // Sort by score and return top-k
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Cosine similarity score
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  
  if (magA === 0 || magB === 0) return 0;
  
  return dotProduct / (magA * magB);
}

/**
 * Delete all embeddings for a file
 * @param {string} userId - User ID
 * @param {string} fileId - File ID
 */
export async function deleteFileEmbeddings(userId, fileId) {
  const embeddingsRef = collection(db, 'users', userId, 'embeddings');
  const q = query(embeddingsRef, where('fileId', '==', fileId));
  const snapshot = await getDocs(q);
  
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

/**
 * Get file info from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of file metadata
 */
export async function getUserFiles(userId) {
  const filesRef = collection(db, 'users', userId, 'files');
  const snapshot = await getDocs(filesRef);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Delete a file and its embeddings
 * @param {string} userId - User ID
 * @param {string} fileId - File ID
 */
export async function deleteFile(userId, fileId) {
  await deleteFileEmbeddings(userId, fileId);
  
  const fileRef = doc(db, 'users', userId, 'files', fileId);
  await deleteDoc(fileRef);
}

