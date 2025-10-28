// API endpoint to get chunks for a file
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, fileId } = req.query;

    if (!userId || !fileId) {
      return res.status(400).json({ error: 'userId and fileId are required' });
    }

    const chunksRef = collection(db, 'users', userId, 'chunks');
    const q = query(chunksRef, where('fileId', '==', fileId));
    const snapshot = await getDocs(q);

    const chunks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ chunks });

  } catch (error) {
    console.error('Error fetching chunks:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch chunks',
      details: error.message 
    });
  }
}

