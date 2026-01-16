/**
 * RAG Ingestion Service
 * Handles PDF processing, chunking, embedding, and storage
 */

import { createRequire } from 'module';
import axios from 'axios';
import { pool } from '../../config/db.js';
import { generateEmbedding } from './embedding.service.js';
import { chunkText } from './chunking.service.js';

// pdf-parse is CommonJS, need to use require
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Ingest a PDF document into the RAG system
 * @param {string} pdfUrl - URL or path to PDF
 * @param {string} sessionId - Session identifier
 * @param {string} tenderId - Tender ID for reference
 */
export async function ingestPdf(pdfUrl, sessionId, tenderId) {
  try {
    console.log(`[RAG Ingestion] Starting for session ${sessionId}`);
    
    // Step 1: Download/Read PDF
    const pdfBuffer = await downloadPdf(pdfUrl);
    
    // Step 2: Extract text from PDF
    const pdfData = await pdf(pdfBuffer);
    const fullText = pdfData.text;
    const pageCount = pdfData.numpages;
    
    console.log(`[RAG Ingestion] Extracted ${fullText.length} chars from ${pageCount} pages`);
    
    // Step 3: Chunk the text
    const chunks = chunkText(fullText, {
      chunkSize: 800,
      chunkOverlap: 200,
    });
    
    console.log(`[RAG Ingestion] Created ${chunks.length} chunks`);
    
    // Step 4: Generate embeddings and store
    const batchSize = 10;
    let stored = 0;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (chunk, idx) => {
          try {
            // Generate embedding
            const embedding = await generateEmbedding(chunk.text);
            
            // Store in database
            await pool.query(
              `INSERT INTO rag_embeddings 
               (embedding, text, scope, source_pdf, section, page_no, session_id, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
              [
                JSON.stringify(embedding), // pgvector expects array format
                chunk.text,
                'session',
                pdfUrl,
                chunk.section || 'general',
                chunk.page || Math.floor(chunk.index / 10) + 1,
                sessionId,
              ]
            );
            
            stored++;
            
            if (stored % 20 === 0) {
              console.log(`[RAG Ingestion] Stored ${stored}/${chunks.length} chunks`);
            }
          } catch (err) {
            console.error(`[RAG Ingestion] Failed to embed chunk ${i + idx}:`, err.message);
          }
        })
      );
    }
    
    console.log(`[RAG Ingestion] Completed. Stored ${stored} embeddings for session ${sessionId}`);
    
    return {
      session_id: sessionId,
      chunks_created: chunks.length,
      chunks_stored: stored,
      pages: pageCount,
    };
  } catch (error) {
    console.error('[RAG Ingestion] Error:', error);
    throw error;
  }
}

/**
 * Download PDF from URL or read from file system
 */
async function downloadPdf(url) {
  try {
    // If it's a URL, download it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      return Buffer.from(response.data);
    }
    
    // If it's a local file path
    const fs = await import('fs/promises');
    return await fs.readFile(url);
  } catch (error) {
    console.error('[RAG Ingestion] PDF download failed:', error.message);
    throw new Error('Failed to download PDF: ' + error.message);
  }
}

/**
 * Ingest global reference PDFs (one-time setup)
 */
export async function ingestGlobalPdfs(pdfDirectory) {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const files = await fs.readdir(pdfDirectory);
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));
  
  console.log(`[RAG Global] Found ${pdfFiles.length} PDFs to ingest`);
  
  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(pdfDirectory, pdfFile);
    
    try {
      const pdfBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdf(pdfBuffer);
      const chunks = chunkText(pdfData.text, { chunkSize: 800, chunkOverlap: 200 });
      
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.text);
        
        await pool.query(
          `INSERT INTO rag_embeddings 
           (embedding, text, scope, source_pdf, section, page_no, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            JSON.stringify(embedding),
            chunk.text,
            'global',
            pdfFile,
            chunk.section || 'general',
            chunk.page || 1,
          ]
        );
      }
      
      console.log(`[RAG Global] Ingested ${chunks.length} chunks from ${pdfFile}`);
    } catch (error) {
      console.error(`[RAG Global] Failed to ingest ${pdfFile}:`, error.message);
    }
  }
  
  console.log('[RAG Global] Global ingestion complete');
}
