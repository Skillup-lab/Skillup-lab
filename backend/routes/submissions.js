/**
 * Form Submissions Routes
 * Handles form submission operations with role-based access control
 */

const express = require('express');
const router = express.Router();

// Controllers
const submissionController = require('../controllers/submissionController');

// Middleware
const { authenticate } = require('../middleware/auth');
const { 
  validateFormSubmission,
  validatePagination,
  validateId,
  validateFormId
} = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/submissions
 * @desc    Get all submissions accessible to the user
 * @access  Private (Role-based access)
 */
router.get('/', validatePagination, submissionController.getSubmissions);

/**
 * @route   GET /api/submissions/stats
 * @desc    Get submission statistics
 * @access  Private (Role-based access)
 */
router.get('/stats', submissionController.getSubmissionStats);

/**
 * @route   GET /api/submissions/:id
 * @desc    Get submission by ID
 * @access  Private (Role-based access)
 */
router.get('/:id', validateId, submissionController.getSubmissionById);

/**
 * @route   POST /api/submissions/form/:formId
 * @desc    Submit form response
 * @access  Private (All authenticated users)
 */
router.post('/form/:formId', validateFormId, validateFormSubmission, submissionController.submitForm);

/**
 * @route   PUT /api/submissions/:id
 * @desc    Update submission
 * @access  Private (Role-based access)
 */
router.put('/:id', validateId, [
  require('express-validator').body('submissionData')
    .optional()
    .isObject()
    .withMessage('Submission data must be an object'),
  
  require('express-validator').body('status')
    .optional()
    .isIn(['draft', 'submitted', 'reviewed'])
    .withMessage('Status must be draft, submitted, or reviewed'),
  
  require('express-validator').body('score')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Score must be a number between 0 and 100'),
  
  require('express-validator').body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters')
    .trim()
], submissionController.updateSubmission);

/**
 * @route   DELETE /api/submissions/:id
 * @desc    Delete submission
 * @access  Private (Role-based access)
 */
router.delete('/:id', validateId, submissionController.deleteSubmission);

module.exports = router;
