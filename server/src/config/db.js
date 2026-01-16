import { Pool } from 'pg';
import { env, loadEnv } from './env.js';

loadEnv();

// Use DATABASE_URL for Supabase connection
const poolConfig = {
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('[DB] ✓ Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle PostgreSQL client:', err);
  process.exit(1);
});
