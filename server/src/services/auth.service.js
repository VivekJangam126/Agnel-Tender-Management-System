import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';

export const AuthService = {
  async signup({ name, email, password, role, organizationName, specialty }) {
    // Validate role
    if (!['AUTHORITY', 'BIDDER', 'REVIEWER'].includes(role)) {
      throw new Error('Invalid role. Must be AUTHORITY, BIDDER, or REVIEWER');
    }

    // Validate specialty for REVIEWER role
    if (role === 'REVIEWER' && !specialty) {
      throw new Error('Specialty is required for Reviewer role');
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM "user" WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Create organization (for REVIEWER, use specialty as org name if no org provided)
    const orgName = organizationName || (role === 'REVIEWER' ? `${name} - ${specialty}` : name);
    const orgResult = await pool.query(
      'INSERT INTO organization (name, type) VALUES ($1, $2) RETURNING organization_id',
      [orgName, role]
    );
    const organizationId = orgResult.rows[0].organization_id;

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with specialty if REVIEWER
    const userResult = await pool.query(
      'INSERT INTO "user" (name, email, password_hash, role, organization_id, specialty) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, name, email, role, organization_id, specialty',
      [name, email, passwordHash, role, organizationId, role === 'REVIEWER' ? specialty : null]
    );

    const user = userResult.rows[0];

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role,
        organizationId: user.organization_id,
      },
      env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return {
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        organization: orgName,
        organizationId: user.organization_id,
        specialty: user.specialty,
      },
    };
  },

  async login(email, password) {
    // Find user with organization and specialty
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.password_hash, u.role, u.organization_id, u.specialty, o.name as organization_name
       FROM "user" u
       JOIN organization o ON u.organization_id = o.organization_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role,
        organizationId: user.organization_id,
      },
      env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return {
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        organization: user.organization_name,
        organizationId: user.organization_id,
        specialty: user.specialty,
      },
    };
  },
};
