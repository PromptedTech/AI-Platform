/**
 * API endpoint to delete a knowledge base file and its embeddings
 * POST /api/knowledge/delete
 * 
 * Body: { fileId: string }
 * Deletes file metadata and all associated embeddings
 */

import { withAuth } from '../../../lib/authMiddleware';
import { deleteFile } from '../../../lib/vectorStore';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user.uid;
    const { fileId } = req.body;

    // Validate input
    if (!fileId || typeof fileId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'fileId is required',
      });
    }

    // Delete file and embeddings
    const deleted = await deleteFile(userId, fileId);

    if (!deleted) {
      return res.status(404).json({
        error: 'File not found',
        details: 'File may have already been deleted',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'File and embeddings deleted successfully',
      fileId,
    });
  } catch (error) {
    console.error('[knowledge/delete] Error:', error);
    return res.status(500).json({
      error: 'Failed to delete file',
      details: error.message,
    });
  }
}

export default withAuth(handler);
