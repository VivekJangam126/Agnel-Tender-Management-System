/**
 * RAG Retrieval Service
 * Performs hybrid retrieval (vector + keyword search)
 */

import { pool } from '../../config/db.js';
import { generateEmbedding } from './embedding.service.js';

/**
 * Hybrid retrieval: combines vector similarity and keyword search
 * @param {string} query - User query
 * @param {string} sessionId - Session ID for tender-specific context
 * @param {Object} options - Retrieval options
 * @returns {Promise<Object>} - Retrieved chunks from session and global
 */
export async function hybridRetrieve(query, sessionId, options = {}) {
  const {
    topK = 10,
    sessionWeight = 0.7, // Prioritize session chunks
    globalWeight = 0.3,
  } = options;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Retrieve from session embeddings (tender-specific)
  const sessionChunks = await retrieveFromScope(
    embeddingStr,
    query,
    sessionId,
    'session',
    Math.ceil(topK * sessionWeight)
  );

  // Retrieve from global embeddings (reference tenders)
  const globalChunks = await retrieveFromScope(
    embeddingStr,
    query,
    null,
    'global',
    Math.ceil(topK * globalWeight)
  );

  return {
    session_chunks: sessionChunks,
    global_chunks: globalChunks,
    total_chunks: sessionChunks.length + globalChunks.length,
  };
}

/**
 * Retrieve chunks from a specific scope
 */
async function retrieveFromScope(embeddingStr, query, sessionId, scope, limit) {
  try {
    const keywords = extractKeywords(query);
    const keywordPattern = keywords.map(k => `%${k}%`).join('|');

    let sql;
    let params;

    if (scope === 'session') {
      // Session-scoped retrieval
      sql = `
        SELECT 
          id, text, source_pdf, section, page_no,
          1 - (embedding <=> $1::vector) AS similarity,
          CASE 
            WHEN text ILIKE ANY(ARRAY[${keywords.map((_, i) => `$${i + 3}`).join(',')}]) THEN 1
            ELSE 0
          END AS keyword_match
        FROM rag_embeddings
        WHERE scope = 'session' AND session_id = $2
        ORDER BY similarity DESC, keyword_match DESC
        LIMIT $${keywords.length + 3}
      `;
      params = [embeddingStr, sessionId, ...keywords, limit];
    } else {
      // Global-scoped retrieval
      sql = `
        SELECT 
          id, text, source_pdf, section, page_no,
          1 - (embedding <=> $1::vector) AS similarity,
          CASE 
            WHEN text ILIKE ANY(ARRAY[${keywords.map((_, i) => `$${i + 2}`).join(',')}]) THEN 1
            ELSE 0
          END AS keyword_match
        FROM rag_embeddings
        WHERE scope = 'global'
        ORDER BY similarity DESC, keyword_match DESC
        LIMIT $${keywords.length + 2}
      `;
      params = [embeddingStr, ...keywords, limit];
    }

    const result = await pool.query(sql, params);

    return result.rows.map(row => ({
      id: row.id,
      text: row.text,
      source: row.source_pdf,
      section: row.section,
      page_no: row.page_no,
      similarity: parseFloat(row.similarity),
      keyword_match: row.keyword_match === 1,
    }));
  } catch (error) {
    console.error(`[RAG Retrieval] Error retrieving from ${scope}:`, error.message);
    return [];
  }
}

/**
 * Extract keywords from query for hybrid search
 */
function extractKeywords(query) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'what',
    'which', 'who', 'when', 'where', 'why', 'how',
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 5); // Top 5 keywords
}
