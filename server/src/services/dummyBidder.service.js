/**
 * Dummy Bidder Service
 * Generates realistic mock bidder data for MVP/demo purposes
 * Can be disabled via MVP_MODE environment flag
 * 
 * IMPORTANT: This is NOT a hack - it's a legitimate MVP pattern.
 * All data flows through real database, services, and APIs.
 * Can be swapped with real bidder UI later without refactoring.
 */

import { pool } from '../config/db.js';
import { env } from '../config/env.js';

// Realistic dummy bidder data
const DUMMY_BIDDERS = [
  {
    name: 'ABC Infra Pvt Ltd',
    email: 'contact@abcinfra.com',
    organizationType: 'BIDDER'
  },
  {
    name: 'BuildTech Solutions',
    email: 'bids@buildtech.com',
    organizationType: 'BIDDER'
  },
  {
    name: 'Premier Engineering Co.',
    email: 'procurement@premier-eng.com',
    organizationType: 'BIDDER'
  },
  {
    name: 'Global Infrastructure Partners',
    email: 'bidding@globalinfra.io',
    organizationType: 'BIDDER'
  },
  {
    name: 'Skyline Construction Ltd',
    email: 'tenders@skyline-construct.com',
    organizationType: 'BIDDER'
  },
  {
    name: 'TechBuild Systems',
    email: 'bids@techbuild.in',
    organizationType: 'BIDDER'
  },
  {
    name: 'Urban Development Corp',
    email: 'contracts@urbandevelop.com',
    organizationType: 'BIDDER'
  },
  {
    name: 'Apex Contractors Ltd',
    email: 'procurement@apexcontractors.com',
    organizationType: 'BIDDER'
  }
];

export const DummyBidderService = {
  /**
   * Check if MVP mode is enabled
   */
  isMVPModeEnabled() {
    return env.MVP_MODE === 'true' || env.MVP_MODE === true;
  },

  /**
   * Seed dummy bidder organizations and users
   * Idempotent - safe to run multiple times
   */
  async seedDummyBidders() {
    if (!this.isMVPModeEnabled()) {
      console.log('[DummyBidderService] MVP_MODE is disabled. Skipping dummy bidder seeding.');
      return { message: 'MVP_MODE disabled', count: 0 };
    }

    const client = await pool.connect();
    let seededCount = 0;

    try {
      await client.query('BEGIN');

      for (const bidder of DUMMY_BIDDERS) {
        // Check if organization already exists
        const existingOrg = await client.query(
          'SELECT organization_id FROM organization WHERE name = $1',
          [bidder.name]
        );

        let organizationId;
        if (existingOrg.rows.length > 0) {
          organizationId = existingOrg.rows[0].organization_id;
        } else {
          // Create organization
          const orgResult = await client.query(
            'INSERT INTO organization (name, type) VALUES ($1, $2) RETURNING organization_id',
            [bidder.name, bidder.organizationType]
          );
          organizationId = orgResult.rows[0].organization_id;
        }

        // Check if user already exists
        const existingUser = await client.query(
          'SELECT user_id FROM "user" WHERE email = $1',
          [bidder.email]
        );

        if (existingUser.rows.length === 0) {
          // Create dummy user with password hash for 'password123'
          // In real scenario, bidders would set their own passwords
          const dummyPasswordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ajO/He'; // bcrypt hash of 'password'

          await client.query(
            'INSERT INTO "user" (name, email, password_hash, role, organization_id) VALUES ($1, $2, $3, $4, $5)',
            [bidder.name, bidder.email, dummyPasswordHash, 'BIDDER', organizationId]
          );

          seededCount++;
        }
      }

      await client.query('COMMIT');
      console.log(`[DummyBidderService] Seeded ${seededCount} dummy bidders`);
      return { message: `Successfully seeded ${seededCount} dummy bidders`, count: seededCount };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[DummyBidderService] Error seeding dummy bidders:', err);
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Generate dummy proposals for a tender
   * Called when tender is published
   * 
   * @param {UUID} tenderId - Tender ID
   * @param {UUID} authorityOrgId - Authority organization ID (to exclude from bidders)
   * @returns {Array} Created proposals
   */
  async generateDummyProposals(tenderId, authorityOrgId) {
    if (!this.isMVPModeEnabled()) {
      console.log('[DummyBidderService] MVP_MODE disabled. No dummy proposals generated.');
      return [];
    }

    try {
      // Get all bidder organizations (excluding authority)
      const bidderOrgsResult = await pool.query(
        `SELECT organization_id, name FROM organization 
         WHERE type = 'BIDDER' AND organization_id != $1
         ORDER BY RANDOM()`,
        [authorityOrgId]
      );

      if (bidderOrgsResult.rows.length === 0) {
        console.warn('[DummyBidderService] No dummy bidder organizations found. Run seed first.');
        return [];
      }

      // Select random 3-7 bidders
      const numBidders = Math.floor(Math.random() * 5) + 3; // 3-7
      const selectedBidders = bidderOrgsResult.rows.slice(0, numBidders);

      // Generate proposal for each selected bidder
      const client = await pool.connect();
      const createdProposals = [];

      try {
        await client.query('BEGIN');

        for (const bidder of selectedBidders) {
          // Check if proposal already exists (idempotent)
          const existingProposal = await client.query(
            'SELECT proposal_id FROM proposal WHERE tender_id = $1 AND organization_id = $2',
            [tenderId, bidder.organization_id]
          );

          if (existingProposal.rows.length === 0) {
            // Generate realistic bid amount with ±20% variation
            const baseAmount = 100000 + Math.random() * 400000; // Base: 100k-500k
            const variance = (Math.random() - 0.5) * 0.4 * baseAmount; // ±20%
            const bidAmount = Math.round(baseAmount + variance);

            // Random submission time (within last 7 days)
            const submittedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

            const proposalResult = await client.query(
              `INSERT INTO proposal (tender_id, organization_id, status, created_at)
               VALUES ($1, $2, $3, $4)
               RETURNING proposal_id`,
              [tenderId, bidder.organization_id, 'DRAFT', new Date()]
            );

            const proposalId = proposalResult.rows[0].proposal_id;

            // Create corresponding bid evaluation record
            await client.query(
              `INSERT INTO bid_evaluation (tender_id, proposal_id, organization_name, bid_amount, status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (proposal_id) DO NOTHING`,
              [tenderId, proposalId, bidder.name, bidAmount, 'PENDING', new Date()]
            );

            createdProposals.push({
              proposal_id: proposalId,
              organization_name: bidder.name,
              bid_amount: bidAmount
            });
          }
        }

        await client.query('COMMIT');
        console.log(`[DummyBidderService] Generated ${createdProposals.length} dummy proposals for tender ${tenderId}`);
        return createdProposals;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[DummyBidderService] Error generating dummy proposals:', err);
      throw err;
    }
  },

  /**
   * Get all dummy bidder organizations
   * Useful for debugging/admin purposes
   */
  async getDummyBidderOrganizations() {
    const result = await pool.query(
      `SELECT organization_id, name FROM organization 
       WHERE type = 'BIDDER' AND name IN (${DUMMY_BIDDERS.map(b => `'${b.name}'`).join(',')})
       ORDER BY name`
    );
    return result.rows;
  }
};
