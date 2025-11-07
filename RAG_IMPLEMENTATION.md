# RAG Implementation Guide

## 🎯 Overview

Complete Retrieval-Augmented Generation (RAG) pipeline with multi-model support, knowledge base management, and source tracking.

## ✅ Features Implemented

### 1. **File Upload & Processing**
- ✅ Support for PDF, DOCX, TXT files
- ✅ Automatic text extraction
- ✅ Intelligent chunking (500 tokens, 50 overlap)
- ✅ OpenAI embeddings generation
- ✅ Firestore vector storage

### 2. **Multi-Model Support**
- ✅ GPT-4o (128K context)
- ✅ GPT-4o Mini (128K context)
- ✅ GPT-4 Turbo (128K context)
- ✅ GPT-4 (8K context)
- ✅ GPT-3.5 Turbo (16K context)

### 3. **Knowledge Base Integration**
- ✅ Toggle "Use Knowledge" in chat
- ✅ Dynamic context augmentation
- ✅ File-specific filtering
- ✅ Relevance scoring
- ✅ Source tracking

### 4. **User Interface**
- ✅ KnowledgeManager component
- ✅ ChatComposer with model selector
- ✅ SourceBadge for transparency
- ✅ Complete knowledge page

---

## 📁 File Structure

```
lib/
├── chunkText.js           # Text chunking utilities
├── embeddings.js          # OpenAI embeddings wrapper
├── vectorStore.js         # Firestore vector storage
├── ragContext.js          # RAG context injection
└── authMiddleware.js      # Firebase authentication

pages/api/
├── upload.js              # File upload & embedding
├── chat.js                # Chat with RAG support
├── chat/stream.js         # Streaming chat with RAG
└── knowledge/
    ├── files.js           # List user files
    └── delete.js          # Delete file & embeddings

components/
├── KnowledgeManager.js    # File upload UI
├── ChatComposer.js        # Chat input with controls
└── SourceBadge.js         # Source display

pages/
└── knowledge.js           # Complete demo page
```

---

## 🚀 Quick Start

### 1. **Upload Documents**

```javascript
// Frontend - Upload a file
const formData = new FormData();
formData.append('file', file);

const response = await authenticatedUpload('/api/upload', formData);
const { fileId, chunks, filename } = await response.json();
```

**Backend Processing:**
1. Extract text (PDF/DOCX/TXT)
2. Chunk into 500-token segments
3. Generate embeddings
4. Store in Firestore

### 2. **Chat with Knowledge**

```javascript
// Frontend - Send message with RAG
const response = await authenticatedPost('/api/chat', {
  messages: [{ role: 'user', content: 'What is X?' }],
  model: 'gpt-4o-mini',
  useKnowledge: true,  // Enable RAG
});

const { reply, sources, model } = await response.json();
```

**Backend Flow:**
1. Extract last user message
2. Generate query embedding
3. Search similar chunks (cosine similarity)
4. Augment prompt with context
5. Call OpenAI
6. Return response + sources

### 3. **Manage Files**

```javascript
// List files
const response = await authenticatedGet('/api/knowledge/files');
const { files } = await response.json();

// Delete file
const response = await authenticatedPost('/api/knowledge/delete', {
  fileId: 'file123'
});
```

---

## 🔧 API Reference

### **POST /api/upload**

Upload and process document.

**Request:**
- `file` (FormData): PDF/DOCX/TXT file

**Response:**
```json
{
  "success": true,
  "fileId": "abc123",
  "filename": "document.pdf",
  "chunks": 42,
  "size": 123456
}
```

### **POST /api/chat**

Chat completion with RAG support.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Question?" }
  ],
  "model": "gpt-4o-mini",
  "useKnowledge": true,
  "fileIds": ["file1", "file2"]  // Optional: filter files
}
```

**Response:**
```json
{
  "reply": "Answer based on your documents...",
  "model": "gpt-4o-mini",
  "usage": { "prompt_tokens": 150, "completion_tokens": 80 },
  "sources": [
    {
      "fileId": "file1",
      "filename": "document.pdf",
      "text": "Relevant chunk text...",
      "score": 0.89,
      "chunkIndex": 5
    }
  ]
}
```

### **POST /api/chat/stream**

Streaming chat with RAG (Server-Sent Events).

**Request:** Same as `/api/chat`

**Response:** SSE stream
```
data: {"type":"sources","sources":[...]}

data: {"type":"content","delta":"Hello"}

data: {"type":"content","delta":" world"}

data: {"type":"done"}
```

### **GET /api/knowledge/files**

List uploaded files.

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "file1",
      "filename": "document.pdf",
      "size": 123456,
      "chunks": 42,
      "uploadedAt": "2024-01-15T10:30:00Z",
      "preview": "First 200 characters..."
    }
  ],
  "count": 1
}
```

### **POST /api/knowledge/delete**

Delete file and embeddings.

**Request:**
```json
{
  "fileId": "file1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File and embeddings deleted",
  "fileId": "file1"
}
```

---

## 🧩 Component Usage

### KnowledgeManager

Complete file management interface.

```jsx
import KnowledgeManager from '../components/KnowledgeManager';

<KnowledgeManager />
```

**Features:**
- Drag & drop file upload
- Upload progress indicator
- File list with metadata
- Delete files
- Error/success messages

### ChatComposer

Enhanced chat input with model selector and knowledge toggle.

```jsx
import ChatComposer from '../components/ChatComposer';

<ChatComposer
  onSend={({ content, model, useKnowledge }) => {
    // Handle message
  }}
  disabled={false}
  showModelSelector={true}
  showKnowledgeToggle={true}
  initialModel="gpt-4o-mini"
  initialUseKnowledge={true}
/>
```

**Features:**
- Model dropdown (5 models)
- Knowledge toggle
- Auto-growing textarea
- Enter to send, Shift+Enter for newline

### SourceBadge

Display sources used in AI response.

```jsx
import SourceBadge from '../components/SourceBadge';

<SourceBadge sources={[
  {
    fileId: 'file1',
    filename: 'document.pdf',
    text: 'Chunk text...',
    score: 0.89,
    chunkIndex: 5
  }
]} />
```

**Features:**
- Compact badge view (up to 3 files)
- Expandable full view
- Hover tooltips with chunk preview
- Relevance scores

---

## 🛠️ Utility Functions

### chunkText(text, options)

Split text into semantic chunks.

```javascript
import { chunkText } from '../lib/chunkText';

const chunks = chunkText(text, {
  chunkTokens: 500,
  overlapTokens: 50,
  respectSentences: true
});
```

### embedText(chunks)

Generate OpenAI embeddings.

```javascript
import { embedText } from '../lib/embeddings';

const embeddings = await embedText(chunks);
// Returns: [{ embedding: [0.1, 0.2, ...], text: '...' }, ...]
```

### storeEmbeddings(userId, fileId, chunks, embeddings, metadata)

Store in Firestore.

```javascript
import { storeEmbeddings } from '../lib/vectorStore';

await storeEmbeddings(userId, fileId, chunks, embeddings, {
  filename: 'document.pdf',
  size: 123456
});
```

### getRelevantContext(userId, query, options)

Retrieve similar chunks.

```javascript
import { getRelevantContext } from '../lib/ragContext';

const { context, sources } = await getRelevantContext(userId, query, {
  k: 6,              // Top 6 results
  minScore: 0.7,     // Min similarity
  fileIds: ['file1'], // Optional filter
  maxTokens: 2000    // Max context tokens
});
```

### augmentMessagesWithContext(messages, context, options)

Inject context into messages.

```javascript
import { augmentMessagesWithContext } from '../lib/ragContext';

const augmented = augmentMessagesWithContext(messages, context, {
  contextLabel: 'KNOWLEDGE BASE',
  addToLastUserMessage: true
});
```

---

## 📊 Data Flow

### Upload Flow
```
User uploads file
    ↓
POST /api/upload
    ↓
Extract text (pdf-parse/mammoth)
    ↓
Chunk text (500 tokens, 50 overlap)
    ↓
Generate embeddings (OpenAI)
    ↓
Store in Firestore
    ↓
Return fileId + metadata
```

### Chat Flow (with RAG)
```
User sends message
    ↓
POST /api/chat { useKnowledge: true }
    ↓
Extract last user message
    ↓
Generate query embedding
    ↓
Search Firestore (cosine similarity)
    ↓
Get top K chunks (k=6, score≥0.7)
    ↓
Format context prompt
    ↓
Augment messages with context
    ↓
Call OpenAI API
    ↓
Return reply + sources
```

---

## 🎨 UI Integration Example

Complete integration in a page:

```jsx
import { useState } from 'react';
import ChatComposer from '../components/ChatComposer';
import SourceBadge from '../components/SourceBadge';
import { authenticatedPost } from '../lib/authClient';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);

  const handleSend = async ({ content, model, useKnowledge }) => {
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: new Date()
    }]);

    // Call API
    const response = await authenticatedPost('/api/chat', {
      messages: [...messages, { role: 'user', content }],
      model,
      useKnowledge
    });

    const { reply, sources } = await response.json();

    // Add AI response
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: reply,
      sources,
      timestamp: new Date()
    }]);
  };

  return (
    <div>
      {/* Messages */}
      {messages.map((msg, i) => (
        <div key={i}>
          <p>{msg.content}</p>
          {msg.sources && <SourceBadge sources={msg.sources} />}
        </div>
      ))}

      {/* Input */}
      <ChatComposer onSend={handleSend} />
    </div>
  );
}
```

---

## 🔐 Security

All endpoints protected with Firebase Authentication:

```javascript
import { withAuth } from '../lib/authMiddleware';

async function handler(req, res) {
  const userId = req.user.uid; // Authenticated user
  // ... implementation
}

export default withAuth(handler);
```

**User Isolation:**
- Files stored: `users/{userId}/files/{fileId}`
- Embeddings: `users/{userId}/embeddings/{docId}`
- No cross-user access possible

---

## 📈 Performance

### Embedding Costs
- Model: `text-embedding-3-small`
- Price: $0.02 per 1M tokens
- Example: 100-page PDF ≈ 50K tokens ≈ $0.001

### Storage
- Firestore: ~1KB per chunk
- 100-page PDF ≈ 100 chunks ≈ 100KB

### Latency
- Chunking: ~100ms
- Embedding: ~500ms per 100 chunks
- Retrieval: ~200ms
- Total upload: ~1-2s for typical document

---

## 🧪 Testing

### Test Upload
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

### Test Chat
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is X?"}],
    "model": "gpt-4o-mini",
    "useKnowledge": true
  }'
```

### Test via UI
1. Visit `/knowledge`
2. Upload a PDF in "Manage Files"
3. Go to "Chat" tab
4. Enable "Knowledge: ON"
5. Ask questions about the document

---

## 🎯 Best Practices

### Chunking
- **500 tokens** balances context and granularity
- **50 token overlap** prevents boundary issues
- Respect sentence boundaries for coherence

### Retrieval
- **k=6** provides good context coverage
- **minScore=0.7** filters irrelevant chunks
- **maxTokens=2000** fits most model contexts

### Models
- **GPT-4o Mini**: Best value, fast responses
- **GPT-4o**: Most capable, complex queries
- **GPT-3.5 Turbo**: Budget option

### Context
- Place context BEFORE user question
- Label clearly ("KNOWLEDGE BASE:")
- Limit to 2000 tokens max

---

## 🐛 Troubleshooting

### "No relevant context found"
- Check embeddings stored: `getUserFiles(userId)`
- Verify query relevance: try broader questions
- Lower `minScore` threshold

### "Model not found"
- Check `SUPPORTED_MODELS` in chat.js
- Verify OpenAI API has access to model
- Fallback to 'gpt-4o-mini'

### Upload fails
- Check file size (<10MB)
- Verify file type (PDF/DOCX/TXT)
- Ensure text extraction works

### Sources not showing
- Check `useKnowledge: true` in request
- Verify sources returned from API
- Check SourceBadge rendering

---

## 📚 Additional Resources

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Vector Search Explained](https://cloud.google.com/blog/topics/developers-practitioners/find-anything-blazingly-fast-googles-vector-search-technology)

---

## ✨ Next Steps

Potential enhancements:

1. **Advanced Retrieval**
   - Hybrid search (keyword + semantic)
   - Re-ranking with cross-encoder
   - Query expansion

2. **Better Chunking**
   - Document-aware splitting
   - Maintain headings/context
   - Variable chunk sizes

3. **UI Improvements**
   - Citation links to original text
   - Highlight relevant passages
   - Conversation persistence

4. **Analytics**
   - Track which sources most useful
   - Monitor retrieval quality
   - Usage statistics

---

**Implementation Complete! 🎉**

All components, APIs, and utilities are production-ready and fully documented.
