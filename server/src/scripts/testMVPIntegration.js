#!/usr/bin/env node

/**
 * Integration Test: MVP Bidder System End-to-End
 * 
 * Simulates the complete flow:
 * 1. Create dummy bidders
 * 2. Publish a tender
 * 3. Verify proposals were generated
 * 4. Verify evaluation records were created
 * 
 * Usage: npm run test:mvp-integration
 */

import { pool } from '../config/db.js';
import { env, loadEnv } from '../config/env.js';
import { DummyBidderService } from '../services/dummyBidder.service.js';
import { TenderService } from '../services/tender.service.js';

const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  errors: []
};

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    TEST_RESULTS.passed++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${err.message}`);
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push({ test: name, error: err.message });
  }
}

async function runTests() {
  try {
    loadEnv();

    console.log('========================================');
    console.log('MVP Bidder System - Integration Tests');
    console.log('========================================\n');

    // Test 1: Check MVP mode
    await test('MVP_MODE is enabled', () => {
      if (!DummyBidderService.isMVPModeEnabled()) {
        throw new Error('MVP_MODE is not enabled');
      }
    });

    // Test 2: Seed dummy bidders
    let seededCount = 0;
    await test('Seed dummy bidders', async () => {
      const result = await DummyBidderService.seedDummyBidders();
      seededCount = result.count;
      if (seededCount === 0) {
        throw new Error('No bidders were seeded');
      }
    });

    // Test 3: Verify bidders in database
    await test('Verify bidders in database', async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM organization WHERE type = 'BIDDER'`
      );
      const count = parseInt(result.rows[0].count);
      if (count < 8) {
        throw new Error(`Expected 8+ bidders, found ${count}`);
      }
    });

    // Test 4: Create a test tender
    let testTenderId = null;
    await test('Create test tender', async () => {
      const testUser = {
        id: '00000000-0000-0000-0000-000000000001',
        role: 'AUTHORITY',
        organizationId: '00000000-0000-0000-0000-000000000001'
      };

      // Ensure test user's organization exists
      const orgCheck = await pool.query(
        `SELECT organization_id FROM organization 
         WHERE organization_id = $1`,
        [testUser.organizationId]
      );

      if (orgCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO organization (organization_id, name, type) 
           VALUES ($1, $2, $3)`,
          [testUser.organizationId, 'Test Authority', 'AUTHORITY']
        );
      }

      // Ensure test user exists
      const userCheck = await pool.query(
        `SELECT user_id FROM "user" WHERE user_id = $1`,
        [testUser.id]
      );

      if (userCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO "user" (user_id, name, email, password_hash, role, organization_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            testUser.id,
            'Test Authority User',
            'testauth@example.com',
            'hash',
            'AUTHORITY',
            testUser.organizationId
          ]
        );
      }

      // Create tender
      const tender = await TenderService.createTender(
        {
          title: 'MVP Integration Test Tender',
          description: 'This is a test tender for MVP integration',
          submission_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        testUser
      );

      testTenderId = tender.tender_id;

      if (!testTenderId) {
        throw new Error('Tender creation failed');
      }
    });

    // Test 5: Add section to tender
    let sectionId = null;
    await test('Add section to tender', async () => {
      const testUser = {
        id: '00000000-0000-0000-0000-000000000001',
        role: 'AUTHORITY',
        organizationId: '00000000-0000-0000-0000-000000000001'
      };

      const section = await TenderService.addSection(
        testTenderId,
        {
          title: 'Technical Requirements',
          is_mandatory: true,
          content: 'All bidders must meet these requirements',
          section_key: 'tech_req'
        },
        testUser
      );

      sectionId = section.section_id;

      if (!sectionId) {
        throw new Error('Section creation failed');
      }
    });

    // Test 6: Publish tender (should trigger dummy proposal generation)
    await test('Publish tender (triggers dummy proposals)', async () => {
      const testUser = {
        id: '00000000-0000-0000-0000-000000000001',
        role: 'AUTHORITY',
        organizationId: '00000000-0000-0000-0000-000000000001'
      };

      const published = await TenderService.publishTender(testTenderId, testUser);

      if (published.status !== 'PUBLISHED') {
        throw new Error('Tender status is not PUBLISHED');
      }
    });

    // Test 7: Wait for dummy proposals to be generated
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 8: Verify proposals were generated
    let proposalCount = 0;
    await test('Verify dummy proposals generated', async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM proposal WHERE tender_id = $1`,
        [testTenderId]
      );

      proposalCount = parseInt(result.rows[0].count);

      if (proposalCount < 3 || proposalCount > 7) {
        throw new Error(`Expected 3-7 proposals, found ${proposalCount}`);
      }
    });

    // Test 9: Verify bid_evaluation records
    let evalCount = 0;
    await test('Verify bid_evaluation records created', async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM bid_evaluation WHERE tender_id = $1`,
        [testTenderId]
      );

      evalCount = parseInt(result.rows[0].count);

      if (evalCount !== proposalCount) {
        throw new Error(`Expected ${proposalCount} evaluations, found ${evalCount}`);
      }
    });

    // Test 10: Verify bid amounts are realistic
    await test('Verify bid amounts are realistic', async () => {
      const result = await pool.query(
        `SELECT bid_amount FROM bid_evaluation WHERE tender_id = $1`,
        [testTenderId]
      );

      for (const row of result.rows) {
        const amount = parseFloat(row.bid_amount);
        if (amount < 50000 || amount > 600000) {
          throw new Error(`Unrealistic bid amount: ${amount}`);
        }
      }
    });

    // Test 11: Verify proposal status
    await test('Verify proposal status is DRAFT', async () => {
      const result = await pool.query(
        `SELECT DISTINCT status FROM proposal WHERE tender_id = $1`,
        [testTenderId]
      );

      if (result.rows.length !== 1 || result.rows[0].status !== 'DRAFT') {
        throw new Error(`Unexpected proposal status`);
      }
    });

    // Test 12: Cleanup
    await test('Cleanup test data', async () => {
      // Delete in correct order due to foreign keys
      await pool.query('DELETE FROM bid_evaluation WHERE tender_id = $1', [testTenderId]);
      await pool.query('DELETE FROM tender_evaluation_status WHERE tender_id = $1', [testTenderId]);
      await pool.query('DELETE FROM proposal WHERE tender_id = $1', [testTenderId]);
      await pool.query('DELETE FROM tender_section WHERE tender_id = $1', [testTenderId]);
      await pool.query('DELETE FROM tender WHERE tender_id = $1', [testTenderId]);
    });

    // Summary
    console.log('\n========================================');
    console.log('Test Results');
    console.log('========================================\n');
    console.log(`✅ Passed: ${TEST_RESULTS.passed}`);
    console.log(`❌ Failed: ${TEST_RESULTS.failed}`);
    console.log(`📊 Total:  ${TEST_RESULTS.passed + TEST_RESULTS.failed}\n`);

    if (TEST_RESULTS.failed === 0) {
      console.log('🎉 All tests passed! MVP system is ready.\n');
      console.log('Next steps:');
      console.log('1. npm run dev');
      console.log('2. Login as admin');
      console.log('3. Create a tender');
      console.log('4. Publish the tender');
      console.log('5. Go to Bid Evaluation - see dummy bids\n');
    } else {
      console.log('⚠️  Some tests failed:\n');
      TEST_RESULTS.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
      console.log();
    }

    process.exit(TEST_RESULTS.failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test suite error:', err.message);
    process.exit(1);
  }
}

runTests();
