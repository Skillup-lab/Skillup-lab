/**
 * Form Model
 * Handles all form-related database operations
 */

const { executeQuery } = require('../config/database');

class Form {
  /**
   * Create a new form
   * @param {Object} formData - Form data
   * @returns {Promise<Object>} Created form
   */
  static async create(formData) {
    const { title, description, createdBy, status = 'draft', settings = {} } = formData;
    
    const query = `
      INSERT INTO forms (title, description, created_by, status, settings)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      title, 
      description, 
      createdBy, 
      status, 
      JSON.stringify(settings)
    ]);
    
    return await this.findById(result.insertId);
  }

  /**
   * Find form by ID with creator info
   * @param {number} id - Form ID
   * @returns {Promise<Object|null>} Form object or null
   */
  static async findById(id) {
    const query = `
      SELECT f.*, u.username as creator_username, u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM forms f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.id = ? AND f.is_active = TRUE
    `;
    
    const results = await executeQuery(query, [id]);
    if (results.length === 0) return null;
    
    const form = results[0];
    // Parse JSON settings
    if (form.settings) {
      form.settings = JSON.parse(form.settings);
    }
    
    return form;
  }

  /**
   * Get all forms with pagination and filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Forms and pagination info
   */
  static async findAll(options = {}) {
    const { page = 1, limit = 10, status, createdBy, search } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE f.is_active = TRUE';
    let params = [];
    
    if (status) {
      whereClause += ' AND f.status = ?';
      params.push(status);
    }
    
    if (createdBy) {
      whereClause += ' AND f.created_by = ?';
      params.push(createdBy);
    }
    
    if (search) {
      whereClause += ' AND (f.title LIKE ? OR f.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM forms f ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;
    
    // Get forms
    const query = `
      SELECT f.*, u.username as creator_username, u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM forms f
      LEFT JOIN users u ON f.created_by = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const forms = await executeQuery(query, params);
    
    // Parse JSON settings for each form
    forms.forEach(form => {
      if (form.settings) {
        form.settings = JSON.parse(form.settings);
      }
    });
    
    return {
      forms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update form
   * @param {number} id - Form ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated form
   */
  static async update(id, updateData) {
    const allowedFields = ['title', 'description', 'status', 'settings'];
    const updates = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (key === 'settings') {
          updates.push(`${key} = ?`);
          params.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    params.push(id);
    
    const query = `
      UPDATE forms 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, params);
    return await this.findById(id);
  }

  /**
   * Soft delete form
   * @param {number} id - Form ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const query = `
      UPDATE forms 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, [id]);
    return true;
  }

  /**
   * Get form with fields
   * @param {number} id - Form ID
   * @returns {Promise<Object|null>} Form with fields
   */
  static async findWithFields(id) {
    const form = await this.findById(id);
    if (!form) return null;
    
    const fieldsQuery = `
      SELECT * FROM form_fields 
      WHERE form_id = ? 
      ORDER BY field_order ASC
    `;
    
    const fields = await executeQuery(fieldsQuery, [id]);
    
    // Parse JSON options and validation_rules for each field
    fields.forEach(field => {
      if (field.options) {
        field.options = JSON.parse(field.options);
      }
      if (field.validation_rules) {
        field.validation_rules = JSON.parse(field.validation_rules);
      }
    });
    
    form.fields = fields;
    return form;
  }

  /**
   * Get forms accessible by user based on role
   * @param {number} userId - User ID
   * @param {string} userRole - User role
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Accessible forms
   */
  static async findAccessibleByUser(userId, userRole, options = {}) {
    let whereClause = 'WHERE f.is_active = TRUE';
    let params = [];
    
    // Role-based access control
    if (userRole === 'teacher') {
      whereClause += ' AND f.created_by = ?';
      params.push(userId);
    } else if (userRole === 'student') {
      whereClause += ' AND f.status = "published"';
    }
    // Admin can see all forms (no additional restriction)
    
    const { page = 1, limit = 10, status, search } = options;
    const offset = (page - 1) * limit;
    
    if (status && userRole === 'admin') {
      whereClause += ' AND f.status = ?';
      params.push(status);
    }
    
    if (search) {
      whereClause += ' AND (f.title LIKE ? OR f.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM forms f ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;
    
    // Get forms
    const query = `
      SELECT f.*, u.username as creator_username, u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM forms f
      LEFT JOIN users u ON f.created_by = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const forms = await executeQuery(query, params);
    
    // Parse JSON settings for each form
    forms.forEach(form => {
      if (form.settings) {
        form.settings = JSON.parse(form.settings);
      }
    });
    
    return {
      forms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Check if user can access form
   * @param {number} formId - Form ID
   * @param {number} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<boolean>} Access status
   */
  static async canUserAccess(formId, userId, userRole) {
    const form = await this.findById(formId);
    if (!form) return false;
    
    // Admin can access all forms
    if (userRole === 'admin') return true;
    
    // Teacher can access their own forms
    if (userRole === 'teacher' && form.created_by === userId) return true;
    
    // Students can only access published forms
    if (userRole === 'student' && form.status === 'published') return true;
    
    return false;
  }
}

module.exports = Form;
