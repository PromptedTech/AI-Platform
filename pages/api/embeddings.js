// API endpoint for generating embeddings
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embeddings for text chunks
 * @param {Array<string>} chunks - Text chunks to embed
 * @returns {Promise<Array<number[]>>} - Array of embedding vectors
 */
export async function generateEmbeddings(chunks) {
  if (!chunks || chunks.length === 0) {
    return [];
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chunks } = req.body;

    if (!chunks || !Array.isArray(chunks)) {
      return res.status(400).json({ error: 'Chunks array is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Server not configured: missing OPENAI_API_KEY' });
    }

    const embeddings = await generateEmbeddings(chunks);

    return res.status(200).json({ embeddings });

  } catch (error) {
    console.error('Error in embeddings API:', error);
    return res.status(500).json({ 
      error: 'Failed to generate embeddings',
      details: error.message 
    });
  }
}

