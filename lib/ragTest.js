// Test and example usage for RAG utility functions
// Run with: node --experimental-modules lib/ragTest.js

import { chunkText, countTokens, validateChunkConfig } from './chunkText.js';
import { embedText, embedQuery, calculateEmbeddingCost } from './embeddings.js';
import { storeEmbeddings, retrieveSimilar, getEmbeddingStats } from './vectorStore.js';

/**
 * Test 1: Text Chunking
 */
async function testChunking() {
  console.log('=== TEST 1: Text Chunking ===\n');

  const sampleText = `
    Machine learning is a subset of artificial intelligence that focuses on 
    developing algorithms and statistical models. These systems can learn from 
    and make decisions based on data without being explicitly programmed.
    
    Deep learning, a subset of machine learning, uses neural networks with 
    multiple layers to analyze various factors of data. It's particularly 
    effective for image recognition, natural language processing, and speech recognition.
    
    The main types of machine learning are supervised learning, unsupervised learning,
    and reinforcement learning. Each has its own use cases and methodologies.
  `.trim();

  // Validate config
  const configValid = validateChunkConfig(100, 20);
  console.log('Config validation:', configValid);

  // Count tokens
  const tokenCount = countTokens(sampleText);
  console.log(`Total tokens: ${tokenCount}\n`);

  // Chunk text
  const chunks = chunkText(sampleText, 100, 20);
  console.log(`Created ${chunks.length} chunks:\n`);

  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1} (${countTokens(chunk)} tokens):`);
    console.log(`  ${chunk.substring(0, 80)}...\n`);
  });

  return chunks;
}

/**
 * Test 2: Embeddings Generation
 */
async function testEmbeddings() {
  console.log('\n=== TEST 2: Embeddings Generation ===\n');

  const testChunks = [
    "Machine learning is a powerful tool",
    "Deep learning uses neural networks",
    "AI is transforming technology"
  ];

  try {
    // Calculate cost first
    const totalTokens = testChunks.reduce((sum, chunk) => sum + countTokens(chunk), 0);
    const cost = calculateEmbeddingCost(totalTokens, 'text-embedding-3-small');
    console.log('Cost estimate:', cost);

    // Generate embeddings
    console.log('\nGenerating embeddings...');
    const embeddings = await embedText(testChunks, {
      model: 'text-embedding-3-small'
    });

    console.log(`✅ Generated ${embeddings.length} embeddings`);
    console.log(`   Dimensions: ${embeddings[0].length}`);
    console.log(`   Sample values: [${embeddings[0].slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);

    // Generate single query embedding
    const queryVector = await embedQuery("What is AI?");
    console.log(`✅ Query embedding generated`);
    console.log(`   Dimensions: ${queryVector.length}\n`);

    return { chunks: testChunks, embeddings };

  } catch (error) {
    console.error('❌ Embedding test failed:', error.message);
    console.error('   Make sure OPENAI_API_KEY is set in .env.local\n');
    return null;
  }
}

/**
 * Test 3: Vector Storage and Retrieval
 */
async function testVectorStore() {
  console.log('\n=== TEST 3: Vector Storage & Retrieval ===\n');

  const userId = 'test_user_123';
  const fileId = 'test_file_456';

  const testData = [
    "Machine learning algorithms can learn from data without explicit programming.",
    "Neural networks are inspired by the human brain's structure and function.",
    "Deep learning is a subset of machine learning using multi-layer neural networks.",
    "Supervised learning uses labeled data to train models.",
    "Unsupervised learning finds patterns in unlabeled data.",
    "Reinforcement learning trains agents through rewards and penalties.",
  ];

  try {
    // Generate embeddings
    console.log('Generating embeddings for test data...');
    const embeddings = await embedText(testData);
    console.log(`✅ Generated ${embeddings.length} embeddings\n`);

    // Store in Firestore
    console.log('Storing embeddings in Firestore...');
    const docIds = await storeEmbeddings(userId, fileId, testData, embeddings);
    console.log(`✅ Stored ${docIds.length} embeddings\n`);

    // Retrieve similar chunks
    console.log('Testing similarity search...');
    const queries = [
      "What is deep learning?",
      "How does supervised learning work?",
      "Tell me about neural networks"
    ];

    for (const query of queries) {
      console.log(`\nQuery: "${query}"`);
      const results = await retrieveSimilar(userId, query, 3, {
        minScore: 0.5
      });

      console.log(`Found ${results.length} results:\n`);
      results.forEach((result, i) => {
        console.log(`  ${i + 1}. Score: ${result.score.toFixed(3)}`);
        console.log(`     ${result.chunkText}`);
      });
    }

    // Get stats
    console.log('\n\nEmbedding Statistics:');
    const stats = await getEmbeddingStats(userId);
    console.log(stats);

    console.log('\n✅ Vector store test completed successfully!\n');

  } catch (error) {
    console.error('❌ Vector store test failed:', error.message);
    console.error('   Make sure Firebase is configured and OPENAI_API_KEY is set\n');
  }
}

/**
 * Complete RAG Pipeline Example
 */
async function ragPipelineExample() {
  console.log('\n=== COMPLETE RAG PIPELINE EXAMPLE ===\n');

  const userId = 'demo_user';
  const fileId = 'demo_document';

  const document = `
    Artificial Intelligence (AI) has become one of the most transformative 
    technologies of the 21st century. It encompasses various subfields including 
    machine learning, natural language processing, computer vision, and robotics.

    Machine learning, a core component of AI, enables systems to learn and improve 
    from experience without being explicitly programmed. It uses statistical 
    techniques to give computers the ability to "learn" from data.

    Deep learning, a subset of machine learning, employs artificial neural networks 
    with multiple layers. These networks can automatically discover representations 
    needed for feature detection or classification from raw data.

    The applications of AI are vast and growing. From healthcare diagnostics to 
    autonomous vehicles, from personalized recommendations to climate modeling, 
    AI is reshaping every industry.

    Ethical considerations in AI development include bias in algorithms, privacy 
    concerns, job displacement, and the need for transparency and accountability 
    in AI systems.
  `.trim();

  try {
    // === STEP 1: Chunk the document ===
    console.log('STEP 1: Chunking document...');
    const chunks = chunkText(document, 150, 30);
    console.log(`✅ Created ${chunks.length} chunks\n`);

    // === STEP 2: Calculate cost ===
    console.log('STEP 2: Calculating embedding cost...');
    const totalTokens = chunks.reduce((sum, c) => sum + countTokens(c), 0);
    const cost = calculateEmbeddingCost(totalTokens, 'text-embedding-3-small');
    console.log(`✅ Estimated cost: ${cost.costUSD} for ${cost.tokens} tokens\n`);

    // === STEP 3: Generate embeddings ===
    console.log('STEP 3: Generating embeddings...');
    const embeddings = await embedText(chunks);
    console.log(`✅ Generated ${embeddings.length} embeddings (${embeddings[0].length}D)\n`);

    // === STEP 4: Store in Firestore ===
    console.log('STEP 4: Storing in Firestore...');
    const docIds = await storeEmbeddings(userId, fileId, chunks, embeddings);
    console.log(`✅ Stored ${docIds.length} embeddings\n`);

    // === STEP 5: Query and retrieve ===
    console.log('STEP 5: Querying for relevant context...\n');

    const userQueries = [
      "What is deep learning?",
      "What are the ethical concerns in AI?",
      "How is AI used in healthcare?"
    ];

    for (const userQuery of userQueries) {
      console.log(`\n📝 User Query: "${userQuery}"\n`);

      const results = await retrieveSimilar(userId, userQuery, 2, {
        minScore: 0.6
      });

      if (results.length === 0) {
        console.log('   No relevant context found.\n');
        continue;
      }

      console.log(`   Found ${results.length} relevant chunks:\n`);
      results.forEach((result, i) => {
        console.log(`   ${i + 1}. [Similarity: ${(result.score * 100).toFixed(1)}%]`);
        console.log(`      ${result.chunkText}\n`);
      });

      // === STEP 6: Use for RAG ===
      const context = results.map(r => r.chunkText).join('\n\n');
      
      console.log('   💡 RAG Prompt:\n');
      console.log('   ```');
      console.log('   Context:');
      console.log('   ' + context.split('\n').join('\n   '));
      console.log('\n   Question: ' + userQuery);
      console.log('   \n   Answer based on the context above:');
      console.log('   [LLM generates answer here...]');
      console.log('   ```\n');
    }

    console.log('\n✅ RAG Pipeline completed successfully!\n');

  } catch (error) {
    console.error('❌ RAG Pipeline failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check OPENAI_API_KEY in .env.local');
    console.error('  2. Verify Firebase configuration');
    console.error('  3. Ensure internet connection\n');
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   RAG UTILITIES TEST SUITE                ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Test 1: Chunking (no API needed)
    await testChunking();

    // Test 2: Embeddings (requires OpenAI API key)
    await testEmbeddings();

    // Test 3: Vector store (requires Firebase + OpenAI)
    // Uncomment to test:
    // await testVectorStore();

    // Complete RAG pipeline
    // Uncomment to test:
    // await ragPipelineExample();

    console.log('\n✅ All tests completed!\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

// Export for use in other files
export {
  testChunking,
  testEmbeddings,
  testVectorStore,
  ragPipelineExample,
  runAllTests
};
