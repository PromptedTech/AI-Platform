// Multipart file upload API using formidable
import formidable from 'formidable';
import path from 'path';

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

    const result = {
      ok: true,
      filename: path.basename(f.filepath || f.path || f.originalFilename || 'upload'),
      mimetype: f.mimetype || f.mime || 'application/octet-stream',
      size: typeof f.size === 'number' ? f.size : 0,
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('[api/upload] multipart error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error?.message || String(error) });
  }
}

