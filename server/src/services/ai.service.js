import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { ChunkingService } from './chunking.service.js';
import { EmbeddingService } from './embedding.service.js';

const CHAT_MODEL = 'gpt-3.5-turbo';
const MAX_CONTEXT_CHUNKS = 5;

async function callChatCompletion(prompt) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You are a tender assistant. Use ONLY the provided context. If the answer is not in the context, say you do not know.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM API failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

export const AIService = {
  /**
   * Ingest tender content: chunk + embed + store in tender_content_chunk.
   * Runs in a single transaction when no external client is provided.
   */
  async ingestTender(tenderId, options = {}) {
    const { client: externalClient, skipTransaction = false } = options;
    const client = externalClient || (await pool.connect());
    const manageTx = !skipTransaction;

    try {
      if (manageTx) await client.query('BEGIN');

      const tenderRes = await client.query(
        `SELECT tender_id, title, description, status
         FROM tender
         WHERE tender_id = $1`,
        [tenderId]
      );

      if (tenderRes.rows.length === 0) {
        throw new Error('Tender not found');
      }

      const tender = tenderRes.rows[0];

      if (tender.status !== 'PUBLISHED') {
        throw new Error('Tender must be published before ingestion');
      }

      const sectionsRes = await client.query(
        `SELECT section_id, title, order_index, is_mandatory
         FROM tender_section
         WHERE tender_id = $1
         ORDER BY order_index ASC`,
        [tenderId]
      );

      const sections = sectionsRes.rows.map((row) => ({
        sectionId: row.section_id,
        title: row.title,
        content: row.content || '', // content column may not exist; fallback to empty
      }));

      const chunks = ChunkingService.chunkTender({
        tenderId,
        tenderTitle: tender.title,
        tenderDescription: tender.description || '',
        sections,
      });

      if (!chunks.length) {
        throw new Error('No tender content available for ingestion');
      }

      // Remove existing embeddings for this tender
      await client.query('DELETE FROM tender_content_chunk WHERE tender_id = $1', [tenderId]);

      // Insert new chunks with embeddings
      for (const chunk of chunks) {
        const embedding = await EmbeddingService.embed(chunk.content);
        await client.query(
          `INSERT INTO tender_content_chunk (tender_id, section_id, content, embedding)
           VALUES ($1, $2, $3, $4::vector)`,
          [tenderId, chunk.sectionId, chunk.content, embedding]
        );
      }

      if (manageTx) await client.query('COMMIT');
    } catch (err) {
      if (manageTx) await client.query('ROLLBACK');
      throw err;
    } finally {
      if (!externalClient) {
        client.release();
      }
    }
  },

  /**
   * Answer a user question using RAG over tender content.
   */
  async queryTenderAI(tenderId, question) {
    if (!question || !question.trim()) {
      throw new Error('Question is required');
    }

    // Ensure tender exists and is published
    const tenderRes = await pool.query(
      'SELECT status FROM tender WHERE tender_id = $1',
      [tenderId]
    );

    if (tenderRes.rows.length === 0) {
      throw new Error('Tender not found');
    }

    if (tenderRes.rows[0].status !== 'PUBLISHED') {
      throw new Error('Tender must be published to query AI');
    }

    // Embed the question
    const questionEmbedding = await EmbeddingService.embed(question);

    // Vector similarity search for top chunks
    const contextRes = await pool.query(
      `SELECT content
       FROM tender_content_chunk
       WHERE tender_id = $1
       ORDER BY embedding <-> $2::vector
       LIMIT $3`,
      [tenderId, questionEmbedding, MAX_CONTEXT_CHUNKS]
    );

    const contexts = contextRes.rows.map((row) => row.content).filter(Boolean);

    if (!contexts.length) {
      return "I don't have enough information from the tender content to answer that.";
    }

    const prompt = `CONTEXT:\n${contexts.join('\n\n---\n\n')}\n\nUSER QUESTION:\n${question}`;

    const answer = await callChatCompletion(prompt);

    return answer || "I don't have enough information from the tender content to answer that.";
  },

  /**
   * Admin assistance: generate content using only tender metadata (no embeddings).
   */
  async generateTenderContent(tenderId, prompt) {
    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt is required');
    }

    // Fetch tender metadata
    const tenderRes = await pool.query(
      `SELECT tender_id, title, description, status
       FROM tender
       WHERE tender_id = $1`,
      [tenderId]
    );

    if (tenderRes.rows.length === 0) {
      throw new Error('Tender not found');
    }

    const tender = tenderRes.rows[0];

    // Sections metadata
    const sectionsRes = await pool.query(
      `SELECT title, is_mandatory, order_index
       FROM tender_section
       WHERE tender_id = $1
       ORDER BY order_index ASC`,
      [tenderId]
    );

    const sectionLines = sectionsRes.rows.map((s, idx) => {
      const flag = s.is_mandatory ? 'MANDATORY' : 'OPTIONAL';
      return `${idx + 1}. ${s.title} (${flag})`;
    });

    const context = [
      `Title: ${tender.title || ''}`,
      `Description: ${tender.description || ''}`,
      `Status: ${tender.status}`,
      'Sections:',
      sectionLines.length ? sectionLines.join('\n') : 'None',
    ].join('\n');

    const fullPrompt = `TENDER METADATA:\n${context}\n\nUSER REQUEST:\n${prompt}`;

    const response = await callChatCompletion(fullPrompt);

    return response || 'I cannot generate content without sufficient tender metadata.';
  },
};
