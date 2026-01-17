#!/usr/bin/env node

/**
 * Seed Dummy Bidders Script
 * 
 * Usage: npm run seed:dummy-bidders
 * 
 * This script:
 * - Inserts 8 dummy bidder organizations
 * - Creates 1 user per organization
 * - Is idempotent (safe to run multiple times)
 * - Only runs if MVP_MODE=true in .env
 */

import { DummyBidderService } from '../services/dummyBidder.service.js';
import { env, loadEnv } from '../config/env.js';

async function main() {
  try {
    loadEnv();

    console.log('========================================');
    console.log('Dummy Bidder Seeding Script');
    console.log('========================================\n');

    if (!DummyBidderService.isMVPModeEnabled()) {
      console.log('⚠️  MVP_MODE is disabled in .env');
      console.log('To enable, set: MVP_MODE=true');
      process.exit(0);
    }

    console.log('✓ MVP_MODE is enabled\n');
    console.log('Seeding dummy bidders...\n');

    const result = await DummyBidderService.seedDummyBidders();

    console.log('\n========================================');
    console.log('✅ Seeding Complete');
    console.log('========================================');
    console.log(`Seeded: ${result.count} dummy bidders`);
    console.log('\nYou can now:');
    console.log('1. Create a tender in Admin UI');
    console.log('2. Publish the tender');
    console.log('3. 3-7 dummy bids will auto-appear');
    console.log('4. Admin can evaluate the bids\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err.message);
    process.exit(1);
  }
}

main();
