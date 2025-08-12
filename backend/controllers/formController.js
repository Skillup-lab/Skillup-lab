/**
 * Form Controller
 * Handles form CRUD operations with role-based access control
 */

const Form = require('../models/Form');
const FormField = require('../models/FormField');
const { validationResult } = require('express-validator');

/**
 * Get all forms accessible to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getForms(req, res) {
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

    const { page = 1, limit = 10, status, search } = req.query;
    const { id: userId, role: userRole } = req.user;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search
    };

    const result = await Form.findAccessibleByUser(userId, userRole, options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Get form by ID with fields
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getFormById(req, res) {
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

    // Check if user can access this form
    const canAccess = await Form.canUserAccess(id, userId, userRole);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const form = await Form.findWithFields(id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    res.json({
      success: true,
      data: { form }
    });

  } catch (error) {
    console.error('Get form by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Create new form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createForm(req, res) {
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

    const { title, description, status = 'draft', settings = {}, fields = [] } = req.body;
    const { id: userId } = req.user;

    // Create form
    const form = await Form.create({
      title,
      description,
      createdBy: userId,
      status,
      settings
    });

    // Create form fields if provided
    if (fields && fields.length > 0) {
      await FormField.bulkCreate(form.id, fields);
    }

    // Get form with fields
    const formWithFields = await Form.findWithFields(form.id);

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: { form: formWithFields }
    });

  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Update form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateForm(req, res) {
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
    const { title, description, status, settings } = req.body;
    const { id: userId, role: userRole } = req.user;

    // Check if form exists
    const existingForm = await Form.findById(id);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check permissions
    if (userRole !== 'admin' && existingForm.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit your own forms'
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (settings !== undefined) updateData.settings = settings;

    // Update form
    const updatedForm = await Form.update(id, updateData);

    res.json({
      success: true,
      message: 'Form updated successfully',
      data: { form: updatedForm }
    });

  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Delete form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteForm(req, res) {
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

    // Check if form exists
    const existingForm = await Form.findById(id);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check permissions
    if (userRole !== 'admin' && existingForm.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own forms'
      });
    }

    // Soft delete form
    await Form.delete(id);

    res.json({
      success: true,
      message: 'Form deleted successfully'
    });

  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Add field to form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function addFormField(req, res) {
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

    const { id: formId } = req.params;
    const { id: userId, role: userRole } = req.user;

    // Check if form exists and user has permission
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    if (userRole !== 'admin' && form.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit your own forms'
      });
    }

    const { 
      fieldName, 
      fieldLabel, 
      fieldType, 
      isRequired, 
      fieldOrder,
      options,
      validationRules,
      placeholder,
      helpText
    } = req.body;

    // Check if field name already exists in this form
    const fieldExists = await FormField.fieldNameExists(formId, fieldName);
    if (fieldExists) {
      return res.status(409).json({
        success: false,
        message: 'Field name already exists in this form'
      });
    }

    // Get next order if not provided
    const order = fieldOrder !== undefined ? fieldOrder : await FormField.getNextOrder(formId);

    // Create field
    const field = await FormField.create({
      formId,
      fieldName,
      fieldLabel,
      fieldType,
      isRequired,
      fieldOrder: order,
      options,
      validationRules,
      placeholder,
      helpText
    });

    res.status(201).json({
      success: true,
      message: 'Form field added successfully',
      data: { field }
    });

  } catch (error) {
    console.error('Add form field error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Update form field
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateFormField(req, res) {
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

    const { id: formId, fieldId } = req.params;
    const { id: userId, role: userRole } = req.user;

    // Check if form exists and user has permission
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    if (userRole !== 'admin' && form.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit your own forms'
      });
    }

    // Check if field exists
    const existingField = await FormField.findById(fieldId);
    if (!existingField || existingField.form_id !== parseInt(formId)) {
      return res.status(404).json({
        success: false,
        message: 'Form field not found'
      });
    }

    const { 
      fieldName, 
      fieldLabel, 
      fieldType, 
      isRequired, 
      fieldOrder,
      options,
      validationRules,
      placeholder,
      helpText
    } = req.body;

    // Check field name uniqueness if changed
    if (fieldName && fieldName !== existingField.field_name) {
      const fieldExists = await FormField.fieldNameExists(formId, fieldName, fieldId);
      if (fieldExists) {
        return res.status(409).json({
          success: false,
          message: 'Field name already exists in this form'
        });
      }
    }

    const updateData = {};
    if (fieldName !== undefined) updateData.field_name = fieldName;
    if (fieldLabel !== undefined) updateData.field_label = fieldLabel;
    if (fieldType !== undefined) updateData.field_type = fieldType;
    if (isRequired !== undefined) updateData.is_required = isRequired;
    if (fieldOrder !== undefined) updateData.field_order = fieldOrder;
    if (options !== undefined) updateData.options = options;
    if (validationRules !== undefined) updateData.validation_rules = validationRules;
    if (placeholder !== undefined) updateData.placeholder = placeholder;
    if (helpText !== undefined) updateData.help_text = helpText;

    // Update field
    const updatedField = await FormField.update(fieldId, updateData);

    res.json({
      success: true,
      message: 'Form field updated successfully',
      data: { field: updatedField }
    });

  } catch (error) {
    console.error('Update form field error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Delete form field
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteFormField(req, res) {
  try {
    const { id: formId, fieldId } = req.params;
    const { id: userId, role: userRole } = req.user;

    // Check if form exists and user has permission
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    if (userRole !== 'admin' && form.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit your own forms'
      });
    }

    // Check if field exists
    const existingField = await FormField.findById(fieldId);
    if (!existingField || existingField.form_id !== parseInt(formId)) {
      return res.status(404).json({
        success: false,
        message: 'Form field not found'
      });
    }

    // Delete field
    await FormField.delete(fieldId);

    res.json({
      success: true,
      message: 'Form field deleted successfully'
    });

  } catch (error) {
    console.error('Delete form field error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Get form submissions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getFormSubmissions(req, res) {
  try {
    const { id: formId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const { id: userId, role: userRole } = req.user;

    // Check if form exists and user has permission
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check permissions
    if (userRole === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Students cannot view form submissions'
      });
    }

    if (userRole === 'teacher' && form.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view submissions for your own forms'
      });
    }

    const FormSubmission = require('../models/FormSubmission');
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    };

    const result = await FormSubmission.findByFormId(formId, options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get form submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  addFormField,
  updateFormField,
  deleteFormField,
  getFormSubmissions
};
