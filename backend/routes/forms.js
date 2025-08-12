/**
 * Forms Routes
 * Handles form CRUD operations with role-based access control
 */

const express = require('express');
const router = express.Router();

// Controllers
const formController = require('../controllers/formController');

// Middleware
const { authenticate, requireTeacherOrAdmin } = require('../middleware/auth');
const { 
  validateFormCreation,
  validateFormUpdate,
  validateFormField,
  validatePagination,
  validateFormId
} = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/forms
 * @desc    Get all forms accessible to the user
 * @access  Private (All authenticated users)
 */
router.get('/', validatePagination, formController.getForms);

/**
 * @route   GET /api/forms/:id
 * @desc    Get form by ID with fields
 * @access  Private (Role-based access)
 */
router.get('/:id', validateFormId, formController.getFormById);

/**
 * @route   POST /api/forms
 * @desc    Create new form
 * @access  Private (Teacher and Admin only)
 */
router.post('/', requireTeacherOrAdmin, validateFormCreation, formController.createForm);

/**
 * @route   PUT /api/forms/:id
 * @desc    Update form
 * @access  Private (Form owner or Admin)
 */
router.put('/:id', validateFormId, validateFormUpdate, formController.updateForm);

/**
 * @route   DELETE /api/forms/:id
 * @desc    Delete form (soft delete)
 * @access  Private (Form owner or Admin)
 */
router.delete('/:id', validateFormId, formController.deleteForm);

/**
 * @route   POST /api/forms/:id/fields
 * @desc    Add field to form
 * @access  Private (Form owner or Admin)
 */
router.post('/:id/fields', validateFormId, validateFormField, formController.addFormField);

/**
 * @route   PUT /api/forms/:id/fields/:fieldId
 * @desc    Update form field
 * @access  Private (Form owner or Admin)
 */
router.put('/:id/fields/:fieldId', 
  validateFormId, 
  [
    require('express-validator').param('fieldId')
      .isInt({ min: 1 })
      .withMessage('Field ID must be a positive integer')
  ],
  validateFormField, 
  formController.updateFormField
);

/**
 * @route   DELETE /api/forms/:id/fields/:fieldId
 * @desc    Delete form field
 * @access  Private (Form owner or Admin)
 */
router.delete('/:id/fields/:fieldId',
  validateFormId,
  [
    require('express-validator').param('fieldId')
      .isInt({ min: 1 })
      .withMessage('Field ID must be a positive integer')
  ],
  formController.deleteFormField
);

/**
 * @route   GET /api/forms/:id/submissions
 * @desc    Get form submissions
 * @access  Private (Form owner or Admin)
 */
router.get('/:id/submissions', validateFormId, validatePagination, formController.getFormSubmissions);

module.exports = router;
