import OpenAI from 'openai';
import { searchSimilarChunks } from '../../lib/vectorStore';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, query, k = 6, fileIds = [] } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (!query || typeof query !== 'string') return res.status(400).json({ error: 'query required' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const emb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = emb?.data?.[0]?.embedding || [];

    const results = await searchSimilarChunks(userId, queryEmbedding, Math.max(1, Math.min(20, k)), Array.isArray(fileIds) ? fileIds : []);

    return res.status(200).json({ results });
  } catch (err) {
    console.error('[api/search-embeds] error', err);
    return res.status(500).json({ error: 'search failed', details: err?.message || String(err) });
  }
}


