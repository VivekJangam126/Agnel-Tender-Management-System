/**
 * Database Migration: Create RAG Sessions Table
 * Tracks tender analysis sessions
 */

import { pool } from '../../config/db.js';

export async function createRagSessionsTable() {
  const client = await pool.connect();

  try {
    // Check if table exists
    const result = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'rag_sessions'
      )`
    );

    if (result.rows[0].exists) {
      console.log('✓ rag_sessions table already exists');
      return true;
    }

    console.log('Creating rag_sessions table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS rag_sessions (
        id BIGSERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        tender_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_status CHECK (status IN ('PROCESSING', 'READY', 'FAILED'))
      )
    `);

    // Create indexes
    await client.query(`CREATE INDEX idx_rag_sessions_session_id ON rag_sessions(session_id)`);
    await client.query(`CREATE INDEX idx_rag_sessions_tender_id ON rag_sessions(tender_id)`);
    await client.query(`CREATE INDEX idx_rag_sessions_user_id ON rag_sessions(user_id)`);
    await client.query(`CREATE INDEX idx_rag_sessions_status ON rag_sessions(status)`);

    console.log('✓ rag_sessions table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating rag_sessions table:', error);
    throw error;
  } finally {
    client.release();
  }
}
