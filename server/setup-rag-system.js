#!/usr/bin/env node

/**
 * RAG System - Quick Setup Script
 * 
 * This script automates the setup of the RAG system:
 * 1. Checks dependencies
 * 2. Creates necessary directories
 * 3. Tests database connection
 * 4. Verifies external services (Ollama, Groq)
 * 5. Displays configuration summary
 * 
 * Usage: node setup-rag-system.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '─'.repeat(60));
  log(title, 'cyan');
  console.log('─'.repeat(60) + '\n');
}

// ============================================================================
// Step 1: Check Node.js Version
// ============================================================================

async function checkNodeVersion() {
  header('Step 1: Node.js Version');
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);

  if (major >= 18) {
    log(`✓ Node.js version: ${version}`, 'green');
    return true;
  } else {
    log(`✗ Node.js v18+ required (current: ${version})`, 'red');
    return false;
  }
}

// ============================================================================
// Step 2: Check Dependencies
// ============================================================================

async function checkDependencies() {
  header('Step 2: Required Dependencies');

  const requiredPackages = ['pdf-parse', 'node-fetch', 'express', 'pg'];
  let allPresent = true;

  for (const pkg of requiredPackages) {
    try {
      await import(pkg);
      log(`✓ ${pkg} installed`, 'green');
    } catch (error) {
      log(`✗ ${pkg} not found`, 'red');
      allPresent = false;
    }
  }

  if (!allPresent) {
    log('\nInstall missing packages:', 'yellow');
    log('  npm install pdf-parse', 'yellow');
  }

  return allPresent;
}

// ============================================================================
// Step 3: Create Directory Structure
// ============================================================================

async function createDirectories() {
  header('Step 3: Directory Structure');

  const baseDir = path.join(__dirname, '../..');
  const directories = [
    'data/global_pdfs',
    'data/sessions',
    'logs'
  ];

  for (const dir of directories) {
    const fullPath = path.join(baseDir, dir);
    try {
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        log(`✓ Created: ${dir}`, 'green');
      } else {
        log(`✓ Exists: ${dir}`, 'green');
      }
    } catch (error) {
      log(`✗ Failed to create ${dir}: ${error.message}`, 'red');
      return false;
    }
  }

  return true;
}

// ============================================================================
// Step 4: Check Environment Variables
// ============================================================================

async function checkEnvironment() {
  header('Step 4: Environment Variables');

  const required = {
    'DATABASE_URL': 'Supabase PostgreSQL connection',
    'GROQ_API_KEY': 'Groq API key for LLM'
  };

  const optional = {
    'OLLAMA_URL': 'Ollama embeddings service (default: http://localhost:11434)',
    'SESSION_TIMEOUT': 'Session expiry time in ms (default: 24 hours)',
    'CLEANUP_INTERVAL': 'Cleanup check interval in ms (default: 1 hour)'
  };

  log('Required Variables:', 'yellow');
  let allSet = true;
  for (const [key, desc] of Object.entries(required)) {
    if (process.env[key]) {
      log(`✓ ${key} = ${process.env[key].substring(0, 20)}...`, 'green');
    } else {
      log(`✗ ${key} not set - ${desc}`, 'red');
      allSet = false;
    }
  }

  log('\nOptional Variables:', 'yellow');
  for (const [key, desc] of Object.entries(optional)) {
    if (process.env[key]) {
      log(`✓ ${key} = ${process.env[key]}`, 'green');
    } else {
      log(`○ ${key} - ${desc}`, 'blue');
    }
  }

  return allSet;
}

// ============================================================================
// Step 5: Test Database Connection
// ============================================================================

async function testDatabaseConnection() {
  header('Step 5: Database Connection');

  try {
    const { pool } = await import('./src/config/db.js');

    const result = await pool.query('SELECT NOW()');
    log(`✓ Connected to PostgreSQL`, 'green');
    log(`  Time from DB: ${result.rows[0].now}`, 'cyan');

    // Check for pgvector extension
    const ext = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')`
    );

    if (ext.rows[0].exists) {
      log(`✓ pgvector extension available`, 'green');
    } else {
      log(`✗ pgvector extension not found - enabling...`, 'yellow');
      try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
        log(`✓ pgvector extension enabled`, 'green');
      } catch (error) {
        log(`⚠ Could not enable pgvector: ${error.message}`, 'yellow');
      }
    }

    return true;
  } catch (error) {
    log(`✗ Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

// ============================================================================
// Step 6: Test Ollama Connection (Optional)
// ============================================================================

async function testOllamaConnection() {
  header('Step 6: Ollama Embeddings Service (Optional)');

  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);

    if (response.ok) {
      const data = await response.json();
      log(`✓ Ollama is running at ${ollamaUrl}`, 'green');

      if (data.models && data.models.length > 0) {
        log(`✓ Available models: ${data.models.length}`, 'green');

        const hasNomic = data.models.some(m => m.name.includes('nomic-embed-text'));
        if (hasNomic) {
          log(`✓ nomic-embed-text model found`, 'green');
        } else {
          log(`⚠ nomic-embed-text not found. Install with:`, 'yellow');
          log(`  ollama pull nomic-embed-text`, 'yellow');
        }
      }

      return true;
    } else {
      log(`⚠ Ollama responded with status ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`⚠ Ollama not available: ${error.message}`, 'yellow');
    log(`  Will use mock embeddings for development`, 'yellow');
    log(`  To use real embeddings, start Ollama: ollama serve`, 'yellow');
    return false;
  }
}

// ============================================================================
// Step 7: Test Groq API Connection
// ============================================================================

async function testGroqApiConnection() {
  header('Step 7: Groq API Connection');

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    log(`✗ GROQ_API_KEY not set`, 'red');
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
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 5
      })
    });

    if (response.ok) {
      const data = await response.json();
      log(`✓ Groq API is responding`, 'green');
      log(`  Model: mixtral-8x7b-32768`, 'cyan');
      return true;
    } else {
      log(`✗ Groq API error: ${response.status}`, 'red');
      const error = await response.text();
      log(`  ${error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Groq API connection failed: ${error.message}`, 'red');
    return false;
  }
}

// ============================================================================
// Step 8: Summary & Next Steps
// ============================================================================

async function showSummary(results) {
  header('Setup Summary');

  const status = {
    '✓': 0,
    '✗': 0,
    '⚠': 0
  };

  // Count results (simplified)
  const passed = Object.values(results).filter(r => r === true).length;
  const failed = Object.values(results).filter(r => r === false).length;

  log(`Checks Passed: ${passed}/${Object.keys(results).length}`, 'green');
  if (failed > 0) {
    log(`Checks Failed: ${failed}`, 'red');
  }

  header('Next Steps');

  log('1. Install dependencies (if needed):', 'cyan');
  log('   cd server && npm install pdf-parse', 'yellow');

  log('\n2. Add sample PDF files:', 'cyan');
  log('   cp /path/to/reference/pdfs/* server/data/global_pdfs/', 'yellow');

  log('\n3. Start Ollama service (optional for real embeddings):', 'cyan');
  log('   ollama pull nomic-embed-text', 'yellow');
  log('   ollama serve', 'yellow');

  log('\n4. Start the server:', 'cyan');
  log('   npm run dev', 'yellow');

  log('\n5. Test RAG endpoints:', 'cyan');
  log('   POST /api/rag/ingest-global (admin auth required)', 'yellow');
  log('   POST /api/rag/analyze (user auth required)', 'yellow');

  header('Documentation');
  log('For detailed setup instructions, see: RAG_SETUP_GUIDE.md', 'cyan');
  log('For API reference, see: server/src/routes/rag.routes.js', 'cyan');

  console.log('');
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('\n' + '═'.repeat(60));
  log('    RAG System - Quick Setup', 'cyan');
  console.log('═'.repeat(60));

  const results = {
    nodeVersion: await checkNodeVersion(),
    dependencies: await checkDependencies(),
    directories: await createDirectories(),
    environment: await checkEnvironment(),
    database: await testDatabaseConnection(),
    ollama: await testOllamaConnection(),
    groq: await testGroqApiConnection()
  };

  await showSummary(results);

  const allCriticalPassed = results.nodeVersion &&
    results.directories &&
    results.environment &&
    results.database &&
    results.groq;

  if (allCriticalPassed) {
    log('\n✓ Setup completed successfully!', 'green');
    process.exit(0);
  } else {
    log('\n⚠ Setup completed with warnings. Check errors above.', 'yellow');
    process.exit(1);
  }
}

// Run setup
main().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
