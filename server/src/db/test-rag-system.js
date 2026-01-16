/**
 * RAG System Testing Guide
 * 
 * This file provides comprehensive tests for the RAG system endpoints.
 * Run these tests to verify the system is working correctly.
 */

// ============================================================================
// Test 1: Check Database Connection
// ============================================================================

import { pool } from '../config/db.js';

export async function testDatabaseConnection() {
  console.log('\n[TEST 1] Database Connection...');
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connected:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
}

// ============================================================================
// Test 2: Check RAG Embeddings Table
// ============================================================================

export async function testRagEmbeddingsTable() {
  console.log('\n[TEST 2] RAG Embeddings Table...');
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'rag_embeddings'
      )
    `);

    if (result.rows[0].exists) {
      console.log('✓ rag_embeddings table exists');

      // Get table info
      const tableInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'rag_embeddings'
        ORDER BY ordinal_position
      `);

      console.log('  Columns:');
      tableInfo.rows.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}`);
      });

      return true;
    } else {
      console.error('✗ rag_embeddings table does not exist');
      return false;
    }
  } catch (error) {
    console.error('✗ Error checking rag_embeddings table:', error.message);
    return false;
  }
}

// ============================================================================
// Test 3: Check Ollama Connection (Optional)
// ============================================================================

export async function testOllamaConnection() {
  console.log('\n[TEST 3] Ollama Embeddings Service...');
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();

    if (data.models && data.models.length > 0) {
      console.log('✓ Ollama is running with models:');
      data.models.forEach(model => {
        console.log(`    - ${model.name}`);
      });

      // Check for nomic-embed-text
      const hasNomic = data.models.some(m => m.name.includes('nomic-embed-text'));
      if (!hasNomic) {
        console.warn('  ⚠ nomic-embed-text model not found. Run: ollama pull nomic-embed-text');
      }

      return true;
    } else {
      console.error('✗ No models found in Ollama');
      return false;
    }
  } catch (error) {
    console.warn('⚠ Ollama not available:', error.message);
    console.log('  (Will use mock embeddings for testing)');
    return false;
  }
}

// ============================================================================
// Test 4: Check Groq API Connection
// ============================================================================

export async function testGroqApiConnection() {
  console.log('\n[TEST 4] Groq API Connection...');

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('✗ GROQ_API_KEY not set in environment');
    return false;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: 'Say "Groq API works"' }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Groq API is responding');
      console.log('  Response:', data.choices[0].message.content);
      return true;
    } else {
      console.error('✗ Groq API returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('✗ Groq API connection failed:', error.message);
    return false;
  }
}

// ============================================================================
// Test 5: Test RAG Endpoints (requires running server)
// ============================================================================

export async function testRagEndpoints() {
  console.log('\n[TEST 5] RAG Endpoints...');

  const baseUrl = 'http://localhost:5175';
  const testToken = 'test-token'; // Replace with actual token

  // Test GET /api/rag/stats
  try {
    const response = await fetch(`${baseUrl}/api/rag/stats`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✓ GET /api/rag/stats works');
      console.log('  Total embeddings:', data.total_embeddings);
    } else {
      console.warn('⚠ GET /api/rag/stats returned:', response.status);
    }
  } catch (error) {
    console.warn('⚠ GET /api/rag/stats failed (server may not be running)');
  }
}

// ============================================================================
// Test 6: Test PDF Extraction
// ============================================================================

export async function testPdfExtraction() {
  console.log('\n[TEST 6] PDF Extraction...');

  try {
    const { extractPdfText } = await import('./services/rag/pdf-extractor.js');

    // Create a test PDF (or use existing)
    console.log('  (Requires PDF file to test)');
    console.log('  ✓ PDF extractor module loaded');

    return true;
  } catch (error) {
    console.error('✗ PDF extraction test failed:', error.message);
    return false;
  }
}

// ============================================================================
// Test 7: Test Text Chunking
// ============================================================================

export async function testTextChunking() {
  console.log('\n[TEST 7] Text Chunking...');

  try {
    const { chunkText, estimateTokens } = await import('./services/rag/text-chunker.js');

    const testText = `
      This is a sample tender document. It contains information about project requirements,
      eligibility criteria, submission guidelines, and evaluation methodology.
      
      Section 1: Project Overview
      The project aims to develop a comprehensive management system.
      
      Section 2: Requirements
      The solution must support multi-user access and data analytics.
    `.trim();

    const chunks = chunkText(testText);
    const tokenCount = estimateTokens(testText);

    console.log('✓ Text chunking works');
    console.log(`  Input: ${testText.length} characters`);
    console.log(`  Tokens: ${tokenCount}`);
    console.log(`  Chunks: ${chunks.length}`);

    if (chunks.length > 0) {
      console.log(`  First chunk: ${chunks[0].substring(0, 60)}...`);
    }

    return true;
  } catch (error) {
    console.error('✗ Text chunking test failed:', error.message);
    return false;
  }
}

// ============================================================================
// Test 8: Test Embedding Service
// ============================================================================

export async function testEmbeddingService() {
  console.log('\n[TEST 8] Embedding Service...');

  try {
    const { generateEmbedding } = await import('./services/rag/embedding.service.js');

    const testText = 'This is a test document for embedding generation.';
    const embedding = await generateEmbedding(testText);

    if (embedding && embedding.length > 0) {
      console.log('✓ Embedding generation works');
      console.log(`  Embedding dimension: ${embedding.length}`);
      console.log(`  Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      return true;
    } else {
      console.warn('⚠ Embedding returned empty');
      return false;
    }
  } catch (error) {
    console.error('✗ Embedding service test failed:', error.message);
    return false;
  }
}

// ============================================================================
// Run All Tests
// ============================================================================

export async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           RAG System - Comprehensive Test Suite            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = {
    database: await testDatabaseConnection(),
    ragTable: await testRagEmbeddingsTable(),
    ollama: await testOllamaConnection(),
    groq: await testGroqApiConnection(),
    endpoints: await testRagEndpoints(),
    extraction: await testPdfExtraction(),
    chunking: await testTextChunking(),
    embedding: await testEmbeddingService()
  };

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      Test Summary                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  let passCount = 0;
  let failCount = 0;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${test}`);
    if (passed) passCount++;
    else failCount++;
  });

  console.log(`\nTotal: ${passCount} passed, ${failCount} failed`);

  return { results, passCount, failCount };
}

// ============================================================================
// Main
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(() => {
    console.log('\n[INFO] All tests completed. Check results above.');
    process.exit(0);
  }).catch(error => {
    console.error('[ERROR] Test suite failed:', error);
    process.exit(1);
  });
}

export default { runAllTests };
