import { env } from '../config/env.js';

const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

export const EmbeddingService = {
  /**
   * Generate embedding for provided text using OpenAI embeddings API.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embed(text) {
    if (!text || !text.trim()) {
      throw new Error('Cannot generate embedding for empty text');
    }

    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Embedding API failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding response');
    }

    if (embedding.length !== 1536) {
      throw new Error(`Unexpected embedding size: ${embedding.length}`);
    }

    return embedding;
  },
};
