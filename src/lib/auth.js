/**
 * Authentication Utilities
 * 
 * Handles JWT token creation, verification, and password hashing.
 * Uses bcryptjs for password hashing and jsonwebtoken for JWT.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12; // Higher = more secure but slower

/**
 * Hash a plain-text password using bcrypt.
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password with a hashed password.
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Bcrypt hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user.
 * @param {Object} user - User object (must have _id and username)
 * @returns {string} - Signed JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token valid for 7 days
  );
}

/**
 * Verify and decode a JWT token.
 * @param {string} token - JWT token string
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return null;
  }
}

/**
 * Extract the JWT token from the Authorization header.
 * Expects format: "Bearer <token>"
 * @param {Request} request - Next.js Request object
 * @returns {string|null} - Token string or null
 */
export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

/**
 * Middleware-like function to authenticate a request.
 * Returns the decoded user payload or null.
 * @param {Request} request - Next.js Request object
 * @returns {Object|null} - User payload { userId, username } or null
 */
export function authenticateRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
