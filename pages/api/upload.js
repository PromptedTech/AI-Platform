// API endpoint for file uploads
import { extractTextFromFile, getFileTypeCategory } from '../../lib/textExtraction';
import { chunkText } from '../../lib/chunkText';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';

// Max file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, userId } = req.body;

    if (!file || !userId) {
      return res.status(400).json({ error: 'File and userId are required' });
    }

    // Parse file data from base64
    const { name, type, data: base64Data } = file;
    
    // Validate file size
    const fileSize = Buffer.from(base64Data, 'base64').length;
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      });
    }

    // Convert base64 to blob
    const binaryData = Buffer.from(base64Data, 'base64');
    const blob = new Blob([binaryData], { type });

    // Extract text
    const text = await extractTextFromFile({
      name,
      type,
      text: async () => blob.text(),
      arrayBuffer: async () => blob.arrayBuffer(),
    });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from file' });
    }

    // Chunk the text
    const chunks = chunkText(text, 500, 50);

    // Store file metadata
    const fileMetadata = {
      name,
      type: getFileTypeCategory({ name, type }),
      size: fileSize,
      chunkCount: chunks.length,
      createdAt: new Date().toISOString(),
    };

    const fileRef = await addDoc(collection(db, 'users', userId, 'files'), fileMetadata);
    
    // Store chunks with fileId reference
    const chunkDocs = [];
    for (let i = 0; i < chunks.length; i++) {
      await addDoc(collection(db, 'users', userId, 'chunks'), {
        fileId: fileRef.id,
        chunkIndex: i,
        chunkText: chunks[i],
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({ 
      fileId: fileRef.id,
      chunks: chunks.length,
      metadata: fileMetadata,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message 
    });
  }
}

