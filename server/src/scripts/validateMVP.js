#!/usr/bin/env node

/**
 * Validation Script: MVP Bidder Simulation
 * 
 * Tests that the dummy bidder system is properly configured
 * Usage: npm run validate:mvp
 */

import { pool } from '../config/db.js';
import { env, loadEnv } from '../config/env.js';

const CHECKS = {
  ENV_MVP_MODE: { pass: false, message: '' },
  DUMMY_BIDDERS_EXIST: { pass: false, message: '' },
  EVALUATION_TABLE: { pass: false, message: '' },
  DUMMY_BIDDER_SERVICE: { pass: false, message: '' },
};

async function runValidation() {
  try {
    loadEnv();

    console.log('====================================');
    console.log('MVP Bidder System Validation');
    console.log('====================================\n');

    // Check 1: MVP_MODE in environment
    console.log('1️⃣  Checking MVP_MODE environment variable...');
    if (env.MVP_MODE === 'true' || env.MVP_MODE === true) {
      CHECKS.ENV_MVP_MODE.pass = true;
      CHECKS.ENV_MVP_MODE.message = '✅ MVP_MODE=true (Dummy data generation ENABLED)';
    } else {
      CHECKS.ENV_MVP_MODE.pass = false;
      CHECKS.ENV_MVP_MODE.message = '⚠️  MVP_MODE=false (Dummy data generation DISABLED)';
    }
    console.log(`   ${CHECKS.ENV_MVP_MODE.message}\n`);

    // Check 2: Dummy bidders exist in database
    console.log('2️⃣  Checking for dummy bidder organizations...');
    try {
      const bidderCount = await pool.query(
        `SELECT COUNT(*) as count FROM organization WHERE type = 'BIDDER'`
      );
      const count = parseInt(bidderCount.rows[0].count);

      if (count >= 8) {
        CHECKS.DUMMY_BIDDERS_EXIST.pass = true;
        CHECKS.DUMMY_BIDDERS_EXIST.message = `✅ Found ${count} dummy bidder organizations`;
      } else if (count > 0) {
        CHECKS.DUMMY_BIDDERS_EXIST.pass = false;
        CHECKS.DUMMY_BIDDERS_EXIST.message = `⚠️  Found only ${count} bidders (expected 8+). Run: npm run seed:dummy-bidders`;
      } else {
        CHECKS.DUMMY_BIDDERS_EXIST.pass = false;
        CHECKS.DUMMY_BIDDERS_EXIST.message = `❌ No dummy bidders found. Run: npm run seed:dummy-bidders`;
      }
      console.log(`   ${CHECKS.DUMMY_BIDDERS_EXIST.message}\n`);
    } catch (err) {
      CHECKS.DUMMY_BIDDERS_EXIST.pass = false;
      CHECKS.DUMMY_BIDDERS_EXIST.message = `❌ Database query failed: ${err.message}`;
      console.log(`   ${CHECKS.DUMMY_BIDDERS_EXIST.message}\n`);
    }

    // Check 3: Evaluation table exists
    console.log('3️⃣  Checking evaluation tables...');
    try {
      const tables = await pool.query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_name IN ('bid_evaluation', 'tender_evaluation_status')`
      );

      if (tables.rows.length === 2) {
        CHECKS.EVALUATION_TABLE.pass = true;
        CHECKS.EVALUATION_TABLE.message = `✅ Both evaluation tables exist`;
      } else {
        CHECKS.EVALUATION_TABLE.pass = false;
        CHECKS.EVALUATION_TABLE.message = `❌ Missing evaluation tables`;
      }
      console.log(`   ${CHECKS.EVALUATION_TABLE.message}\n`);
    } catch (err) {
      CHECKS.EVALUATION_TABLE.pass = false;
      CHECKS.EVALUATION_TABLE.message = `❌ Table check failed: ${err.message}`;
      console.log(`   ${CHECKS.EVALUATION_TABLE.message}\n`);
    }

    // Check 4: DummyBidderService can be imported
    console.log('4️⃣  Checking DummyBidderService...');
    try {
      const { DummyBidderService } = await import('../services/dummyBidder.service.js');
      const isMVP = DummyBidderService.isMVPModeEnabled();
      CHECKS.DUMMY_BIDDER_SERVICE.pass = true;
      CHECKS.DUMMY_BIDDER_SERVICE.message = `✅ DummyBidderService loaded successfully`;
      console.log(`   ${CHECKS.DUMMY_BIDDER_SERVICE.message}\n`);
    } catch (err) {
      CHECKS.DUMMY_BIDDER_SERVICE.pass = false;
      CHECKS.DUMMY_BIDDER_SERVICE.message = `❌ Failed to load service: ${err.message}`;
      console.log(`   ${CHECKS.DUMMY_BIDDER_SERVICE.message}\n`);
    }

    // Summary
    const allPass = Object.values(CHECKS).every(c => c.pass);
    const passCount = Object.values(CHECKS).filter(c => c.pass).length;

    console.log('====================================');
    console.log('Summary');
    console.log('====================================\n');
    console.log(`✅ Passed: ${passCount}/${Object.keys(CHECKS).length}\n`);

    if (allPass) {
      console.log('🎉 System is ready for MVP demo!');
      console.log('\nNext steps:');
      console.log('1. Start server: npm run dev');
      console.log('2. Login as admin');
      console.log('3. Create a tender');
      console.log('4. Publish the tender');
      console.log('5. Go to Bid Evaluation - see 3-7 dummy bids');
      console.log('6. Score and evaluate the bids\n');
    } else {
      console.log('⚠️  Some checks failed. See above for details.\n');
      console.log('Troubleshooting:');
      if (!CHECKS.DUMMY_BIDDERS_EXIST.pass) {
        console.log('  - Run: npm run seed:dummy-bidders');
      }
      if (!CHECKS.ENV_MVP_MODE.pass) {
        console.log('  - Edit .env and set MVP_MODE=true');
      }
      console.log();
    }

    process.exit(allPass ? 0 : 1);
  } catch (err) {
    console.error('❌ Validation failed:', err.message);
    process.exit(1);
  }
}

runValidation();
