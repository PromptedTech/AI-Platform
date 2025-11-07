# RAG Utility Functions Documentation

## Overview

This document describes the RAG (Retrieval-Augmented Generation) utility functions for text chunking, embedding, and similarity retrieval in the Nova AI platform.

## 📦 Modules

### 1. **`lib/chunkText.js`** - Text Chunking
### 2. **`lib/embeddings.js`** - OpenAI Embeddings API
### 3. **`lib/vectorStore.js`** - Firestore Vector Storage & Retrieval

---

## 🔪 Text Chunking (`lib/chunkText.js`)

### `chunkText(text, chunkTokens = 500, overlap = 50)`

Splits text into overlapping chunks for vector embeddings.

**Parameters:**
- `text` (string) - The text to chunk
- `chunkTokens` (number, default: 500) - Target tokens per chunk
- `overlap` (number, default: 50) - Overlap between chunks in tokens

**Returns:** `string[]` - Array of text chunks

**Example:**
```javascript
import { chunkText } from '../lib/chunkText';

const document = "Long text content...";
const chunks = chunkText(document, 500, 50);
// Returns: ["chunk1...", "...overlap...chunk2...", ...]

console.log(`Created ${chunks.length} chunks`);
```

**Features:**
- ✅ Character-based approximation (4 chars ≈ 1 token)
- ✅ Sentence boundary detection for semantic coherence
- ✅ Configurable overlap for context continuity
- ✅ Handles edge cases (empty input, short text)

---

### `countTokens(text)`

Estimates token count using character-based heuristic.

**Parameters:**
- `text` (string) - Text to analyze

**Returns:** `number` - Estimated token count

**Example:**
```javascript
import { countTokens } from '../lib/chunkText';

const tokens = countTokens("Hello, world!");
console.log(tokens); // ~3 tokens
```

---

### `splitParagraphs(text)`

Splits text into paragraphs.

**Parameters:**
- `text` (string) - Text to split

**Returns:** `string[]` - Array of paragraphs

**Example:**
```javascript
import { splitParagraphs } from '../lib/chunkText';

const paragraphs = splitParagraphs("Para 1\n\nPara 2\n\nPara 3");
// Returns: ["Para 1", "Para 2", "Para 3"]
```

---

### `validateChunkConfig(chunkTokens, overlap)`

Validates chunking parameters.

**Parameters:**
- `chunkTokens` (number) - Chunk size
- `overlap` (number) - Overlap size

**Returns:** `{ valid: boolean, error?: string }`

**Example:**
```javascript
import { validateChunkConfig } from '../lib/chunkText';

const result = validateChunkConfig(500, 50);
if (!result.valid) {
  console.error(result.error);
}
```

---

## 🧠 Embeddings (`lib/embeddings.js`)

### `embedText(chunks, options = {})`

Generate vector embeddings for text chunks using OpenAI API.

**Parameters:**
- `chunks` (string[]) - Array of text chunks to embed
- `options` (object) - Configuration options
  - `model` (string, default: 'text-embedding-3-small') - Embedding model
  - `batchSize` (number, default: 100) - Chunks per API call
  - `dimensions` (number, optional) - Custom dimensions for v3 models

**Returns:** `Promise<number[][]>` - Array of embedding vectors

**Throws:** `Error` - If API key missing or API call fails

**Example:**
```javascript
import { embedText } from '../lib/embeddings';

const chunks = ["Hello world", "This is a test"];
const embeddings = await embedText(chunks);
// Returns: [[0.1, 0.2, ...], [0.3, 0.4, ...]]

console.log(`Generated ${embeddings.length} embeddings`);
console.log(`Dimensions: ${embeddings[0].length}`);
```

**Supported Models:**
- `text-embedding-3-small` - 1536 dimensions, $0.02/1M tokens (default)
- `text-embedding-3-large` - 3072 dimensions, $0.13/1M tokens (higher quality)
- `text-embedding-ada-002` - 1536 dimensions, $0.10/1M tokens (legacy)

---

### `embedQuery(query, options = {})`

Generate embedding for a single query string.

**Parameters:**
- `query` (string) - Search query text
- `options` (object) - Configuration options

**Returns:** `Promise<number[]>` - Single embedding vector

**Example:**
```javascript
import { embedQuery } from '../lib/embeddings';

const queryVector = await embedQuery("What is machine learning?");
// Returns: [0.1, 0.2, 0.3, ...]

console.log(`Query embedding dimensions: ${queryVector.length}`);
```

---

### `calculateEmbeddingCost(tokenCount, model = 'text-embedding-3-small')`

Calculate the cost of embedding operations.

**Parameters:**
- `tokenCount` (number) - Total tokens to embed
- `model` (string) - Embedding model

**Returns:** `{ tokens: number, cost: number, costUSD: string }`

**Example:**
```javascript
import { calculateEmbeddingCost } from '../lib/embeddings';

const cost = calculateEmbeddingCost(50000, 'text-embedding-3-small');
console.log(cost);
// { tokens: 50000, cost: 0.001, costUSD: "$0.0010" }
```

---

### `batchEmbedWithProgress(chunks, options = {})`

Batch embed text with progress tracking.

**Parameters:**
- `chunks` (string[]) - Text chunks
- `options` (object) - Options including `onProgress` callback

**Returns:** `Promise<number[][]>` - Embedding vectors

**Example:**
```javascript
import { batchEmbedWithProgress } from '../lib/embeddings';

const embeddings = await batchEmbedWithProgress(chunks, {
  model: 'text-embedding-3-small',
  onProgress: (done, total) => {
    console.log(`Progress: ${done}/${total} (${Math.round(done/total*100)}%)`);
  }
});
```

---

## 🔍 Vector Store (`lib/vectorStore.js`)

### `storeEmbeddings(userId, fileId, chunks, embeddings)`

Store embeddings in Firestore for a user.

**Parameters:**
- `userId` (string) - User ID (for data isolation)
- `fileId` (string) - File ID
- `chunks` (string[]) - Text chunks
- `embeddings` (number[][]) - Vector embeddings

**Returns:** `Promise<string[]>` - Array of created document IDs

**Throws:** `Error` - If validation fails or Firestore error

**Example:**
```javascript
import { storeEmbeddings } from '../lib/vectorStore';

const docIds = await storeEmbeddings(
  "user123",
  "file456",
  ["chunk1", "chunk2"],
  [[0.1, 0.2, ...], [0.3, 0.4, ...]]
);

console.log(`Stored ${docIds.length} embeddings`);
```

**Firestore Structure:**
```
users/{userId}/embeddings/{docId}
  ├── fileId: "file456"
  ├── chunkIndex: 0
  ├── chunkText: "chunk1"
  ├── embedding: [0.1, 0.2, ...]
  └── createdAt: Timestamp
```

---

### `retrieveSimilar(uid, query, k = 6, options = {})`

**⭐ Main RAG function** - Retrieve top-k semantically similar chunks.

**Parameters:**
- `uid` (string) - User ID
- `query` (string) - Search query text
- `k` (number, default: 6) - Number of top results
- `options` (object) - Additional options
  - `fileIds` (string[]) - Filter by file IDs
  - `minScore` (number) - Minimum similarity threshold (0-1)
  - `model` (string) - Embedding model for query

**Returns:** `Promise<Array<{ id, chunkText, fileId, chunkIndex, score }>>` - Similar chunks

**Throws:** `Error` - If validation fails

**Example:**
```javascript
import { retrieveSimilar } from '../lib/vectorStore';

const results = await retrieveSimilar(
  "user123",
  "What is machine learning?",
  6,
  { 
    minScore: 0.7,
    fileIds: ["file1", "file2"]
  }
);

console.log(`Found ${results.length} similar chunks`);
results.forEach(result => {
  console.log(`Score: ${result.score.toFixed(3)} - ${result.chunkText.substring(0, 100)}...`);
});
```

**How It Works:**
1. Embeds query using OpenAI API
2. Retrieves stored embeddings from Firestore
3. Calculates cosine similarity for each embedding
4. Returns top-k most similar chunks sorted by score

---

### `searchSimilarChunks(userId, queryEmbedding, topK = 6, fileIds = [])`

Search stored embeddings using a pre-computed query vector.

**Parameters:**
- `userId` (string) - User ID
- `queryEmbedding` (number[]) - Query vector
- `topK` (number, default: 6) - Top results count
- `fileIds` (string[]) - Optional file filter

**Returns:** `Promise<Array<{ id, chunkText, fileId, chunkIndex, score }>>`

**Example:**
```javascript
import { embedQuery } from '../lib/embeddings';
import { searchSimilarChunks } from '../lib/vectorStore';

const queryVector = await embedQuery("machine learning");
const results = await searchSimilarChunks("user123", queryVector, 10);
```

---

### `deleteFileEmbeddings(userId, fileId)`

Delete all embeddings for a file.

**Parameters:**
- `userId` (string) - User ID
- `fileId` (string) - File ID

**Returns:** `Promise<number>` - Number of embeddings deleted

**Example:**
```javascript
import { deleteFileEmbeddings } from '../lib/vectorStore';

const count = await deleteFileEmbeddings("user123", "file456");
console.log(`Deleted ${count} embeddings`);
```

---

### `getUserFiles(userId)`

Get all files for a user with metadata.

**Parameters:**
- `userId` (string) - User ID

**Returns:** `Promise<Array<{ id, name, type, size, chunkCount, createdAt }>>`

**Example:**
```javascript
import { getUserFiles } from '../lib/vectorStore';

const files = await getUserFiles("user123");
files.forEach(file => {
  console.log(`${file.name} - ${file.chunkCount} chunks`);
});
```

---

### `deleteFile(userId, fileId)`

Delete a file and all its embeddings.

**Parameters:**
- `userId` (string) - User ID
- `fileId` (string) - File ID

**Returns:** `Promise<{ file: boolean, embeddings: number }>`

**Example:**
```javascript
import { deleteFile } from '../lib/vectorStore';

const result = await deleteFile("user123", "file456");
console.log(`Deleted file and ${result.embeddings} embeddings`);
```

---

### `getEmbeddingStats(userId)`

Get embedding statistics for a user.

**Parameters:**
- `userId` (string) - User ID

**Returns:** `Promise<{ totalEmbeddings, fileCount, totalChunks }>`

**Example:**
```javascript
import { getEmbeddingStats } from '../lib/vectorStore';

const stats = await getEmbeddingStats("user123");
console.log(`Files: ${stats.fileCount}, Embeddings: ${stats.totalEmbeddings}`);
```

---

## 🎯 Complete RAG Workflow Example

```javascript
import { chunkText, countTokens } from '../lib/chunkText';
import { embedText, calculateEmbeddingCost } from '../lib/embeddings';
import { storeEmbeddings, retrieveSimilar } from '../lib/vectorStore';

// === STEP 1: Chunk Document ===
async function processDocument(userId, fileId, documentText) {
  // Chunk the document
  const chunks = chunkText(documentText, 500, 50);
  console.log(`Created ${chunks.length} chunks`);

  // Estimate cost
  const totalTokens = chunks.reduce((sum, chunk) => sum + countTokens(chunk), 0);
  const cost = calculateEmbeddingCost(totalTokens, 'text-embedding-3-small');
  console.log(`Cost estimate: ${cost.costUSD}`);

  // === STEP 2: Generate Embeddings ===
  const embeddings = await embedText(chunks, {
    model: 'text-embedding-3-small',
    batchSize: 100
  });
  console.log(`Generated ${embeddings.length} embeddings`);

  // === STEP 3: Store in Firestore ===
  const docIds = await storeEmbeddings(userId, fileId, chunks, embeddings);
  console.log(`Stored ${docIds.length} embeddings in Firestore`);

  return { chunks: chunks.length, embeddings: embeddings.length };
}

// === STEP 4: Query for Similar Content ===
async function searchDocuments(userId, query) {
  const results = await retrieveSimilar(
    userId,
    query,
    6, // top 6 results
    {
      minScore: 0.7, // only return if similarity > 0.7
      model: 'text-embedding-3-small'
    }
  );

  console.log(`\nQuery: "${query}"`);
  console.log(`Found ${results.length} relevant chunks:\n`);

  results.forEach((result, i) => {
    console.log(`${i + 1}. [Score: ${result.score.toFixed(3)}]`);
    console.log(`   ${result.chunkText.substring(0, 150)}...`);
    console.log(`   File: ${result.fileId}, Chunk: ${result.chunkIndex}\n`);
  });

  return results;
}

// === USAGE ===
const userId = "user123";
const fileId = "doc456";
const document = "Your long document text here...";

// Process and store
await processDocument(userId, fileId, document);

// Search
const results = await searchDocuments(userId, "What is machine learning?");

// Use results for RAG
const context = results.map(r => r.chunkText).join('\n\n');
console.log('Context for LLM:', context);
```

---

## 🔒 Security Notes

- ✅ All functions validate input parameters
- ✅ User-isolated storage (Firestore subcollections)
- ✅ API routes should use `req.user.uid` from auth middleware
- ✅ Never trust `userId` from client - always use verified token

---

## 💰 Cost Optimization

**Embedding Costs (OpenAI):**
- text-embedding-3-small: $0.02 / 1M tokens
- text-embedding-3-large: $0.13 / 1M tokens

**Tips:**
1. Use `text-embedding-3-small` for most use cases (good quality, low cost)
2. Adjust chunk size to balance retrieval quality vs. cost
3. Use `calculateEmbeddingCost()` before processing large documents
4. Cache embeddings in Firestore to avoid re-embedding

**Example Calculation:**
```javascript
// 100-page document ≈ 50,000 tokens
// Chunked into 100 chunks of 500 tokens each
const cost = calculateEmbeddingCost(50000, 'text-embedding-3-small');
// Result: ~$0.001 (very affordable!)
```

---

## 🧪 Testing

```javascript
// Test chunking
import { chunkText, validateChunkConfig } from '../lib/chunkText';

const valid = validateChunkConfig(500, 50);
assert(valid.valid === true);

const chunks = chunkText("Test text", 100, 10);
assert(Array.isArray(chunks));

// Test embeddings (requires API key)
import { embedText, validateEmbedding } from '../lib/embeddings';

const embeddings = await embedText(["test"]);
const validation = validateEmbedding(embeddings[0], 1536);
assert(validation.valid === true);

// Test similarity
import { retrieveSimilar } from '../lib/vectorStore';

const results = await retrieveSimilar("user123", "test query", 5);
assert(Array.isArray(results));
assert(results.every(r => r.score >= 0 && r.score <= 1));
```

---

## 📚 Additional Resources

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Cosine Similarity Explained](https://en.wikipedia.org/wiki/Cosine_similarity)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

## 🎉 Summary

You now have three well-typed, async utility modules:

1. **`chunkText(text, chunkTokens, overlap)`** - Smart text chunking with overlap
2. **`embedText(chunks, options)`** - OpenAI embeddings generation
3. **`retrieveSimilar(uid, query, k, options)`** - Semantic similarity search

All functions include:
- ✅ TypeScript-style JSDoc documentation
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Async/await patterns
- ✅ Production-ready code

Ready for use in your Nova AI RAG pipeline! 🚀
