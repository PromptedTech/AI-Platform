// Multipart file upload API using formidable
import formidable from 'formidable';
import path from 'path';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { chunkText } from '../../lib/chunkText';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '25mb',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Configure formidable to write to /tmp and keep extensions
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      uploadDir: '/tmp',
      maxFileSize: 25 * 1024 * 1024,
      filter: (part) => part.name === 'file' || part.name === 'uid',
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        return resolve({ fields, files });
      });
    });

    const uid = typeof fields.uid === 'string' ? fields.uid : Array.isArray(fields.uid) ? fields.uid[0] : undefined;
    const file = files.file;

    if (!uid) {
      return res.status(400).json({ error: 'Missing uid' });
    }
    if (!file) {
      return res.status(400).json({ error: 'Missing file' });
    }

    // Support array or single file depending on formidable version/field usage
    const f = Array.isArray(file) ? file[0] : file;

    // Read file buffer
    const filepath = f.filepath || f.path;
    const mimetype = f.mimetype || f.mime || 'application/octet-stream';
    const size = typeof f.size === 'number' ? f.size : 0;
    const buffer = await fs.readFile(filepath);

    // Extract text
    let text = '';
    try {
      if (mimetype.includes('pdf')) {
        const data = await pdfParse(buffer);
        text = data.text || '';
      } else if (mimetype.includes('word') || mimetype.includes('officedocument') || filepath.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || '';
      } else if (mimetype.startsWith('text/') || filepath.endsWith('.txt') || filepath.endsWith('.md')) {
        text = buffer.toString('utf8');
      }
    } catch (e) {
      console.error('[api/upload] text extraction failed', e);
    }

    if (!text || !text.trim()) {
      return res.status(200).json({ ok: true, filename: path.basename(filepath || f.originalFilename || 'upload'), mimetype, size, fileId: null, chunks: 0 });
    }

    // Chunk and embed
    const chunks = chunkText(text, 500, 50);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const emb = await openai.embeddings.create({ model: 'text-embedding-3-small', input: chunks });
    const embeddings = emb.data.map(d => d.embedding);

    // Store file metadata
    const fileDoc = await addDoc(collection(db, 'users', uid, 'files'), {
      name: path.basename(filepath || f.originalFilename || 'upload'),
      type: mimetype,
      size,
      chunkCount: chunks.length,
      createdAt: new Date().toISOString(),
    });

    // Store chunks + embeddings
    for (let i = 0; i < chunks.length; i++) {
      await addDoc(collection(db, 'users', uid, 'embeddings'), {
        fileId: fileDoc.id,
        chunkIndex: i,
        chunkText: chunks[i],
        embedding: embeddings[i],
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      ok: true,
      filename: path.basename(filepath || f.originalFilename || 'upload'),
      mimetype,
      size,
      fileId: fileDoc.id,
      chunks: chunks.length,
    });
  } catch (error) {
    console.error('[api/upload] multipart error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error?.message || String(error) });
  }
}

