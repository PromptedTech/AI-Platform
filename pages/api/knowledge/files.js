/**
 * API endpoint to list user's knowledge base files
 * GET /api/knowledge/files
 * 
 * Returns array of uploaded files with metadata
 */

import { withAuth } from '../../../lib/authMiddleware';
import { getUserFiles } from '../../../lib/vectorStore';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user.uid;

    // Get user's files from Firestore
    const files = await getUserFiles(userId);

    return res.status(200).json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error) {
    console.error('[knowledge/files] Error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve files',
      details: error.message,
    });
  }
}

export default withAuth(handler);
