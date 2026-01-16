/**
 * RAG Embedding Service
 * Generates embeddings using Hugging Face Inference API
 */

import axios from 'axios';

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const EMBEDDING_MODEL = 'sentence-transformers/all-mpnet-base-v2'; // 768 dimensions

if (!HF_API_KEY) {
  console.warn('[RAG Embedding] Warning: HUGGINGFACE_API_KEY not set. Embeddings will fail.');
}

/**
 * Generate embedding vector for text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 768-dimensional embedding vector
 */
export async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${EMBEDDING_MODEL}`,
      {
        inputs: text.substring(0, 5000), // Limit to avoid token limits
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    // Handle different response formats
    let embedding;
    if (Array.isArray(response.data)) {
      embedding = response.data;
    } else if (response.data.embeddings && Array.isArray(response.data.embeddings[0])) {
      embedding = response.data.embeddings[0];
    } else if (Array.isArray(response.data[0])) {
      embedding = response.data[0];
    } else {
      throw new Error('Unexpected embedding response format');
    }

    // Validate dimensions
    if (embedding.length !== 768) {
      throw new Error(`Expected 768 dimensions, got ${embedding.length}`);
    }

    return embedding;
  } catch (error) {
    if (error.response) {
      console.error('[RAG Embedding] API Error:', error.response.data);
      throw new Error(`Embedding API failed: ${error.response.data.error || error.message}`);
    }
    throw error;
  }
}

/**
 * Generate embeddings in batch
 * @param {string[]} texts - Array of texts
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function generateEmbeddingsBatch(texts) {
  return Promise.all(texts.map(text => generateEmbedding(text)));
}
