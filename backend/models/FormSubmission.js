/**
 * FormSubmission Model
 * Handles form submission operations
 */

const { executeQuery } = require('../config/database');

class FormSubmission {
  /**
   * Create a new form submission
   * @param {Object} submissionData - Submission data
   * @returns {Promise<Object>} Created submission
   */
  static async create(submissionData) {
    const { 
      formId, 
      submittedBy, 
      submissionData: data, 
      status = 'submitted',
      score = null,
      feedback = null
    } = submissionData;
    
    const query = `
      INSERT INTO form_submissions (form_id, submitted_by, submission_data, status, score, feedback)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      formId,
      submittedBy,
      JSON.stringify(data),
      status,
      score,
      feedback
    ]);
    
    return await this.findById(result.insertId);
  }

  /**
   * Find submission by ID
   * @param {number} id - Submission ID
   * @returns {Promise<Object|null>} Submission object or null
   */
  static async findById(id) {
    const query = `
      SELECT fs.*, f.title as form_title, u.username, u.first_name, u.last_name
      FROM form_submissions fs
      LEFT JOIN forms f ON fs.form_id = f.id
      LEFT JOIN users u ON fs.submitted_by = u.id
      WHERE fs.id = ?
    `;
    
    const results = await executeQuery(query, [id]);
    if (results.length === 0) return null;
    
    const submission = results[0];
    
    // Parse JSON submission data
    if (submission.submission_data) {
      submission.submission_data = JSON.parse(submission.submission_data);
    }
    
    return submission;
  }

  /**
   * Get all submissions with pagination and filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Submissions and pagination info
   */
  static async findAll(options = {}) {
    const { page = 1, limit = 10, formId, submittedBy, status } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (formId) {
      whereClause += ' AND fs.form_id = ?';
      params.push(formId);
    }
    
    if (submittedBy) {
      whereClause += ' AND fs.submitted_by = ?';
      params.push(submittedBy);
    }
    
    if (status) {
      whereClause += ' AND fs.status = ?';
      params.push(status);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM form_submissions fs ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;
    
    // Get submissions
    const query = `
      SELECT fs.*, f.title as form_title, u.username, u.first_name, u.last_name
      FROM form_submissions fs
      LEFT JOIN forms f ON fs.form_id = f.id
      LEFT JOIN users u ON fs.submitted_by = u.id
      ${whereClause}
      ORDER BY fs.submitted_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const submissions = await executeQuery(query, params);
    
    // Parse JSON submission data for each submission
    submissions.forEach(submission => {
      if (submission.submission_data) {
        submission.submission_data = JSON.parse(submission.submission_data);
      }
    });
    
    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get submissions for a specific form
   * @param {number} formId - Form ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Submissions and pagination info
   */
  static async findByFormId(formId, options = {}) {
    return await this.findAll({ ...options, formId });
  }

  /**
   * Get submissions by a specific user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Submissions and pagination info
   */
  static async findByUserId(userId, options = {}) {
    return await this.findAll({ ...options, submittedBy: userId });
  }

  /**
   * Update form submission
   * @param {number} id - Submission ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated submission
   */
  static async update(id, updateData) {
    const allowedFields = ['submission_data', 'status', 'score', 'feedback'];
    const updates = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (key === 'submission_data') {
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
      UPDATE form_submissions 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, params);
    return await this.findById(id);
  }

  /**
   * Delete form submission
   * @param {number} id - Submission ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const query = 'DELETE FROM form_submissions WHERE id = ?';
    await executeQuery(query, [id]);
    return true;
  }

  /**
   * Check if user has already submitted to a form
   * @param {number} formId - Form ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Existing submission or null
   */
  static async findExistingSubmission(formId, userId) {
    const query = `
      SELECT * FROM form_submissions 
      WHERE form_id = ? AND submitted_by = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `;
    
    const results = await executeQuery(query, [formId, userId]);
    if (results.length === 0) return null;
    
    const submission = results[0];
    
    // Parse JSON submission data
    if (submission.submission_data) {
      submission.submission_data = JSON.parse(submission.submission_data);
    }
    
    return submission;
  }

  /**
   * Get submission statistics for a form
   * @param {number} formId - Form ID
   * @returns {Promise<Object>} Submission statistics
   */
  static async getFormStats(formId) {
    const query = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_count,
        AVG(CASE WHEN score IS NOT NULL THEN score END) as average_score,
        MIN(submitted_at) as first_submission,
        MAX(submitted_at) as last_submission
      FROM form_submissions 
      WHERE form_id = ?
    `;
    
    const results = await executeQuery(query, [formId]);
    return results[0];
  }

  /**
   * Get user submission statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User submission statistics
   */
  static async getUserStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_count,
        AVG(CASE WHEN score IS NOT NULL THEN score END) as average_score
      FROM form_submissions 
      WHERE submitted_by = ?
    `;
    
    const results = await executeQuery(query, [userId]);
    return results[0];
  }

  /**
   * Get submissions accessible by user based on role
   * @param {number} userId - User ID
   * @param {string} userRole - User role
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Accessible submissions
   */
  static async findAccessibleByUser(userId, userRole, options = {}) {
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    // Role-based access control
    if (userRole === 'student') {
      // Students can only see their own submissions
      whereClause += ' AND fs.submitted_by = ?';
      params.push(userId);
    } else if (userRole === 'teacher') {
      // Teachers can see submissions to their forms
      whereClause += ' AND f.created_by = ?';
      params.push(userId);
    }
    // Admin can see all submissions (no additional restriction)
    
    const { page = 1, limit = 10, formId, status } = options;
    const offset = (page - 1) * limit;
    
    if (formId) {
      whereClause += ' AND fs.form_id = ?';
      params.push(formId);
    }
    
    if (status) {
      whereClause += ' AND fs.status = ?';
      params.push(status);
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM form_submissions fs
      LEFT JOIN forms f ON fs.form_id = f.id
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;
    
    // Get submissions
    const query = `
      SELECT fs.*, f.title as form_title, u.username, u.first_name, u.last_name
      FROM form_submissions fs
      LEFT JOIN forms f ON fs.form_id = f.id
      LEFT JOIN users u ON fs.submitted_by = u.id
      ${whereClause}
      ORDER BY fs.submitted_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const submissions = await executeQuery(query, params);
    
    // Parse JSON submission data for each submission
    submissions.forEach(submission => {
      if (submission.submission_data) {
        submission.submission_data = JSON.parse(submission.submission_data);
      }
    });
    
    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = FormSubmission;
