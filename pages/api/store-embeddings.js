// API endpoint to store embeddings
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { withAuth } from '../../lib/authMiddleware';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // User is authenticated - use req.user.uid instead of userId from body
    const userId = req.user.uid;
    const { fileId, chunks, embeddings } = req.body;

    if (!fileId || !chunks || !embeddings) {
      return res.status(400).json({ error: 'fileId, chunks, and embeddings are required' });
    }

    if (chunks.length !== embeddings.length) {
      return res.status(400).json({ error: 'Chunks and embeddings must have the same length' });
    }

    const embeddingsRef = collection(db, 'users', userId, 'embeddings');
    
    const docIds = [];
    for (let i = 0; i < chunks.length; i++) {
      const docRef = await addDoc(embeddingsRef, {
        fileId,
        chunkIndex: i,
        chunkText: chunks[i],
        embedding: embeddings[i],
        createdAt: new Date().toISOString(),
      });
      docIds.push(docRef.id);
    }

    return res.status(200).json({ docIds, count: docIds.length });

  } catch (error) {
    console.error('Error storing embeddings:', error);
    return res.status(500).json({ 
      error: 'Failed to store embeddings',
      details: error.message 
    });
  }
}

// Export with authentication middleware
export default withAuth(handler);
