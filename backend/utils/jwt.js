/**
 * JWT Utility functions
 * Handles token generation, verification, and refresh token management
 */

const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { config } = require('../config/config');

/**
 * Generate access token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'skillup-lab-api',
    audience: 'skillup-lab-client'
  });
}

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'skillup-lab-api',
    audience: 'skillup-lab-client'
  });
}

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: 'skillup-lab-api',
      audience: 'skillup-lab-client'
    });
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'skillup-lab-api',
      audience: 'skillup-lab-client'
    });
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Store refresh token in database
 * @param {number} userId - User ID
 * @param {string} token - Refresh token
 * @returns {Promise<void>}
 */
async function storeRefreshToken(userId, token) {
  // Calculate expiration date
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);
  
  const query = `
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `;
  
  await executeQuery(query, [userId, token, expiresAt]);
}

/**
 * Remove refresh token from database
 * @param {string} token - Refresh token
 * @returns {Promise<void>}
 */
async function removeRefreshToken(token) {
  const query = 'DELETE FROM refresh_tokens WHERE token = ?';
  await executeQuery(query, [token]);
}

/**
 * Remove all refresh tokens for a user
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function removeAllUserRefreshTokens(userId) {
  const query = 'DELETE FROM refresh_tokens WHERE user_id = ?';
  await executeQuery(query, [userId]);
}

/**
 * Check if refresh token exists in database
 * @param {string} token - Refresh token
 * @returns {Promise<boolean>} Token exists status
 */
async function refreshTokenExists(token) {
  const query = `
    SELECT id FROM refresh_tokens 
    WHERE token = ? AND expires_at > NOW()
  `;
  
  const results = await executeQuery(query, [token]);
  return results.length > 0;
}

/**
 * Clean up expired refresh tokens
 * @returns {Promise<number>} Number of tokens removed
 */
async function cleanupExpiredTokens() {
  const query = 'DELETE FROM refresh_tokens WHERE expires_at <= NOW()';
  const result = await executeQuery(query);
  return result.affectedRows;
}

/**
 * Generate token pair (access + refresh)
 * @param {Object} user - User object
 * @returns {Promise<Object>} Token pair
 */
async function generateTokenPair(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user.id });
  
  // Store refresh token in database
  await storeRefreshToken(user.id, refreshToken);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn
  };
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token pair
 */
async function refreshAccessToken(refreshToken) {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  
  // Check if token exists in database
  const tokenExists = await refreshTokenExists(refreshToken);
  if (!tokenExists) {
    throw new Error('Refresh token not found or expired');
  }
  
  // Get user data
  const User = require('../models/User');
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Remove old refresh token
  await removeRefreshToken(refreshToken);
  
  // Generate new token pair
  return await generateTokenPair(user);
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  removeRefreshToken,
  removeAllUserRefreshTokens,
  refreshTokenExists,
  cleanupExpiredTokens,
  generateTokenPair,
  refreshAccessToken,
  extractTokenFromHeader
};
