/**
 * Form Submission Controller
 * Handles form submission operations with role-based access control
 */

const FormSubmission = require('../models/FormSubmission');
const Form = require('../models/Form');
const { validationResult } = require('express-validator');

/**
 * Get all submissions accessible to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSubmissions(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10, formId, status } = req.query;
    const { id: userId, role: userRole } = req.user;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      formId: formId ? parseInt(formId) : undefined,
      status
    };

    const result = await FormSubmission.findAccessibleByUser(userId, userRole, options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Get submission by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSubmissionById(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { id: userId, role: userRole } = req.user;

    const submission = await FormSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check permissions
    const canAccess = await canUserAccessSubmission(submission, userId, userRole);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { submission }
    });

  } catch (error) {
    console.error('Get submission by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Submit form response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function submitForm(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { formId } = req.params;
    const { submissionData, status = 'submitted' } = req.body;
    const { id: userId } = req.user;

    // Check if form exists and is accessible
    const form = await Form.findWithFields(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if form is published (students can only submit to published forms)
    if (req.user.role === 'student' && form.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Form is not available for submission'
      });
    }

    // Check if user has already submitted (if form doesn't allow multiple submissions)
    const existingSubmission = await FormSubmission.findExistingSubmission(formId, userId);
    if (existingSubmission && form.settings?.max_submissions === 1) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted to this form'
      });
    }

    // Validate submission data against form fields
    const validationErrors = validateSubmissionData(submissionData, form.fields);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Submission validation failed',
        errors: validationErrors
      });
    }

    // Create submission
    const submission = await FormSubmission.create({
      formId: parseInt(formId),
      submittedBy: userId,
      submissionData,
      status
    });

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: { submission }
    });

  } catch (error) {
    console.error('Submit form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Update submission (for drafts or teacher/admin updates)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateSubmission(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { submissionData, status, score, feedback } = req.body;
    const { id: userId, role: userRole } = req.user;

    // Check if submission exists
    const existingSubmission = await FormSubmission.findById(id);
    if (!existingSubmission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check permissions
    const canAccess = await canUserAccessSubmission(existingSubmission, userId, userRole);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Students can only update their own draft submissions
    if (userRole === 'student') {
      if (existingSubmission.submitted_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own submissions'
        });
      }
      if (existingSubmission.status !== 'draft') {
        return res.status(403).json({
          success: false,
          message: 'You can only update draft submissions'
        });
      }
    }

    const updateData = {};
    if (submissionData !== undefined) updateData.submission_data = submissionData;
    if (status !== undefined) updateData.status = status;
    if (score !== undefined && (userRole === 'teacher' || userRole === 'admin')) {
      updateData.score = score;
    }
    if (feedback !== undefined && (userRole === 'teacher' || userRole === 'admin')) {
      updateData.feedback = feedback;
    }

    // Validate submission data if provided
    if (submissionData) {
      const form = await Form.findWithFields(existingSubmission.form_id);
      const validationErrors = validateSubmissionData(submissionData, form.fields);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Submission validation failed',
          errors: validationErrors
        });
      }
    }

    // Update submission
    const updatedSubmission = await FormSubmission.update(id, updateData);

    res.json({
      success: true,
      message: 'Submission updated successfully',
      data: { submission: updatedSubmission }
    });

  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Delete submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteSubmission(req, res) {
  try {
    const { id } = req.params;
    const { id: userId, role: userRole } = req.user;

    // Check if submission exists
    const existingSubmission = await FormSubmission.findById(id);
    if (!existingSubmission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check permissions
    if (userRole === 'student' && existingSubmission.submitted_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own submissions'
      });
    }

    if (userRole === 'teacher') {
      // Teachers can only delete submissions to their forms
      const form = await Form.findById(existingSubmission.form_id);
      if (!form || form.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete submissions to your own forms'
        });
      }
    }

    // Delete submission
    await FormSubmission.delete(id);

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });

  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Get submission statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSubmissionStats(req, res) {
  try {
    const { formId } = req.query;
    const { id: userId, role: userRole } = req.user;

    let stats;

    if (formId) {
      // Get stats for specific form
      const form = await Form.findById(formId);
      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        });
      }

      // Check permissions
      if (userRole === 'teacher' && form.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      stats = await FormSubmission.getFormStats(formId);
    } else if (userRole === 'student') {
      // Get user's own stats
      stats = await FormSubmission.getUserStats(userId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Form ID required for teachers and admins'
      });
    }

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get submission stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Helper function to check if user can access submission
 * @param {Object} submission - Submission object
 * @param {number} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<boolean>} Access status
 */
async function canUserAccessSubmission(submission, userId, userRole) {
  // Admin can access all submissions
  if (userRole === 'admin') return true;
  
  // Students can only access their own submissions
  if (userRole === 'student') {
    return submission.submitted_by === userId;
  }
  
  // Teachers can access submissions to their forms
  if (userRole === 'teacher') {
    const form = await Form.findById(submission.form_id);
    return form && form.created_by === userId;
  }
  
  return false;
}

/**
 * Helper function to validate submission data against form fields
 * @param {Object} submissionData - Submission data
 * @param {Array} formFields - Form fields
 * @returns {Array} Validation errors
 */
function validateSubmissionData(submissionData, formFields) {
  const errors = [];
  
  for (const field of formFields) {
    const fieldValue = submissionData[field.field_name];
    
    // Check required fields
    if (field.is_required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
      errors.push({
        field: field.field_name,
        message: `${field.field_label} is required`
      });
      continue;
    }
    
    // Skip validation if field is empty and not required
    if (!fieldValue) continue;
    
    // Validate based on field type
    switch (field.field_type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
          errors.push({
            field: field.field_name,
            message: `${field.field_label} must be a valid email address`
          });
        }
        break;
        
      case 'number':
        if (isNaN(fieldValue)) {
          errors.push({
            field: field.field_name,
            message: `${field.field_label} must be a number`
          });
        }
        break;
        
      case 'select':
      case 'radio':
        if (field.options && !field.options.includes(fieldValue)) {
          errors.push({
            field: field.field_name,
            message: `${field.field_label} contains an invalid option`
          });
        }
        break;
        
      case 'checkbox':
        if (field.options && Array.isArray(fieldValue)) {
          const invalidOptions = fieldValue.filter(val => !field.options.includes(val));
          if (invalidOptions.length > 0) {
            errors.push({
              field: field.field_name,
              message: `${field.field_label} contains invalid options: ${invalidOptions.join(', ')}`
            });
          }
        }
        break;
    }
    
    // Apply custom validation rules
    if (field.validation_rules) {
      const rules = field.validation_rules;
      
      if (rules.min_length && fieldValue.length < rules.min_length) {
        errors.push({
          field: field.field_name,
          message: `${field.field_label} must be at least ${rules.min_length} characters long`
        });
      }
      
      if (rules.max_length && fieldValue.length > rules.max_length) {
        errors.push({
          field: field.field_name,
          message: `${field.field_label} must not exceed ${rules.max_length} characters`
        });
      }
      
      if (rules.pattern && !new RegExp(rules.pattern).test(fieldValue)) {
        errors.push({
          field: field.field_name,
          message: `${field.field_label} format is invalid`
        });
      }
    }
  }
  
  return errors;
}

module.exports = {
  getSubmissions,
  getSubmissionById,
  submitForm,
  updateSubmission,
  deleteSubmission,
  getSubmissionStats
};
