import { Pool } from 'pg';
import dns from 'dns';
import { env, loadEnv } from './env.js';

// Force IPv4 DNS resolution to avoid ENETUNREACH on IPv6
dns.setDefaultResultOrder('ipv4first');

loadEnv();

// Parse the DATABASE_URL to extract components
const url = new URL(env.DATABASE_URL);

const poolConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  database: url.pathname.slice(1) || 'postgres',
  user: url.username,
  password: decodeURIComponent(url.password),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('[DB] Connection established to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle PostgreSQL client:', err);
  process.exit(1);
});
