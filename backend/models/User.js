/**
 * User Model
 * Handles all user-related database operations
 */

const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    const { username, email, password, role = 'student', firstName, lastName } = userData;
    
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [username, email, passwordHash, role, firstName, lastName]);
    
    // Return user without password
    return await this.findById(result.insertId);
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const query = `
      SELECT id, username, email, role, first_name, last_name, is_active, created_at, updated_at
      FROM users 
      WHERE id = ? AND is_active = TRUE
    `;
    
    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUsername(username) {
    const query = `
      SELECT id, username, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at
      FROM users 
      WHERE username = ? AND is_active = TRUE
    `;
    
    const results = await executeQuery(query, [username]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, username, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at
      FROM users 
      WHERE email = ? AND is_active = TRUE
    `;
    
    const results = await executeQuery(query, [email]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users and pagination info
   */
  static async findAll(options = {}) {
    const { page = 1, limit = 10, role, search } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE is_active = TRUE';
    let params = [];
    
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;
    
    // Get users
    const query = `
      SELECT id, username, email, role, first_name, last_name, is_active, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const users = await executeQuery(query, params);
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user
   */
  static async update(id, updateData) {
    const allowedFields = ['username', 'email', 'role', 'first_name', 'last_name', 'is_active'];
    const updates = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    params.push(id);
    
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, params);
    return await this.findById(id);
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async updatePassword(id, newPassword) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, [passwordHash, id]);
    return true;
  }

  /**
   * Soft delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const query = `
      UPDATE users 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, [id]);
    return true;
  }

  /**
   * Verify user password
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Password match status
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @param {number} excludeId - User ID to exclude from check
   * @returns {Promise<boolean>} Exists status
   */
  static async usernameExists(username, excludeId = null) {
    let query = 'SELECT id FROM users WHERE username = ? AND is_active = TRUE';
    let params = [username];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await executeQuery(query, params);
    return results.length > 0;
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {number} excludeId - User ID to exclude from check
   * @returns {Promise<boolean>} Exists status
   */
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT id FROM users WHERE email = ? AND is_active = TRUE';
    let params = [email];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await executeQuery(query, params);
    return results.length > 0;
  }
}

module.exports = User;
