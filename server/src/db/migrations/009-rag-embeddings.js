/**
 * Database Migration: Create RAG Embeddings Table with pgvector Support
 * 
 * This migration creates the rag_embeddings table for storing document chunks
 * and their vector embeddings. It's automatically run on server startup.
 * 
 * Requires: Supabase PostgreSQL with pgvector extension enabled
 */

import { pool } from '../../config/db.js';

const MIGRATION_NAME = '009-create-rag-embeddings';

/**
 * Create rag_embeddings table with pgvector support
 */
export async function migrateRagEmbeddings() {
  const client = await pool.connect();

  try {
    // Check if migration already applied
    const result = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'rag_embeddings'
      )`
    );

    if (result.rows[0].exists) {
      console.log('✓ rag_embeddings table already exists');
      return true;
    }

    console.log('Creating rag_embeddings table...');

    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rag_embeddings (
        id BIGSERIAL PRIMARY KEY,
        embedding vector(768),
        text TEXT NOT NULL,
        
        -- Metadata
        scope VARCHAR(50) NOT NULL DEFAULT 'session',
        source_pdf VARCHAR(255) NOT NULL,
        section VARCHAR(255),
        page_no INTEGER,
        
        -- Session tracking
        session_id VARCHAR(255),
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Constraints
        CONSTRAINT valid_scope CHECK (scope IN ('global', 'session'))
      )
    `);

    // Create indexes for performance
    await client.query(`CREATE INDEX idx_rag_scope ON rag_embeddings(scope)`);
    await client.query(`CREATE INDEX idx_rag_session ON rag_embeddings(session_id)`);
    await client.query(`CREATE INDEX idx_rag_source ON rag_embeddings(source_pdf)`);
    await client.query(`CREATE INDEX idx_rag_created ON rag_embeddings(created_at)`);
    
    // Create vector similarity index (HNSW)
    await client.query(`
      CREATE INDEX idx_rag_embedding_hnsw ON rag_embeddings 
      USING hnsw (embedding vector_cosine_ops)
    `).catch(err => {
      // HNSW might not be available on all Supabase plans
      console.warn('⚠ Could not create HNSW index:', err.message);
      console.log('  Falling back to standard index...');
      return client.query(`CREATE INDEX idx_rag_embedding ON rag_embeddings USING ivfflat (embedding vector_cosine_ops)`);
    });

    console.log('✓ rag_embeddings table created successfully with indexes');
    return true;

  } catch (error) {
    console.error('Error creating rag_embeddings table:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Drop rag_embeddings table (for development/testing)
 */
export async function dropRagEmbeddings() {
  const client = await pool.connect();

  try {
    await client.query('DROP TABLE IF EXISTS rag_embeddings CASCADE');
    console.log('✓ rag_embeddings table dropped');
    return true;
  } catch (error) {
    console.error('Error dropping rag_embeddings table:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get migration status
 */
export async function getRagEmbeddingsStatus() {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_embeddings,
        COUNT(DISTINCT session_id) as active_sessions,
        COUNT(DISTINCT source_pdf) as source_documents,
        scope,
        COUNT(*) as count
      FROM rag_embeddings
      GROUP BY scope
      ORDER BY scope`
    );

    const summary = {
      total_embeddings: 0,
      active_sessions: new Set(),
      source_documents: new Set(),
      by_scope: {}
    };

    result.rows.forEach(row => {
      summary.total_embeddings += parseInt(row.total_embeddings);
      summary.by_scope[row.scope] = parseInt(row.count);
    });

    return summary;
  } catch (error) {
    console.error('Error getting RAG embeddings status:', error);
    return null;
  }
}

export default { migrateRagEmbeddings, dropRagEmbeddings, getRagEmbeddingsStatus };
