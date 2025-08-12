/**
 * Validation Middleware
 * Contains validation rules for different endpoints using express-validator
 */

const { body, param, query } = require('express-validator');

/**
 * User registration validation
 */
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
  
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student'])
    .withMessage('Role must be admin, teacher, or student')
];

/**
 * User login validation
 */
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username or email is required')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Profile update validation
 */
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Password change validation
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

/**
 * User creation/update validation (admin only)
 */
const validateUserManagement = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student'])
    .withMessage('Role must be admin, teacher, or student'),
  
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Form creation validation
 */
const validateFormCreation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Form title must be between 1 and 200 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .trim(),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be a valid object')
];

/**
 * Form update validation
 */
const validateFormUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Form title must be between 1 and 200 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .trim(),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be a valid object')
];

/**
 * Form field validation
 */
const validateFormField = [
  body('fieldName')
    .isLength({ min: 1, max: 100 })
    .withMessage('Field name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Field name can only contain letters, numbers, and underscores'),
  
  body('fieldLabel')
    .isLength({ min: 1, max: 200 })
    .withMessage('Field label must be between 1 and 200 characters')
    .trim(),
  
  body('fieldType')
    .isIn(['text', 'textarea', 'email', 'number', 'select', 'radio', 'checkbox', 'date', 'file'])
    .withMessage('Invalid field type'),
  
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean value'),
  
  body('fieldOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Field order must be a non-negative integer'),
  
  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),
  
  body('validationRules')
    .optional()
    .isObject()
    .withMessage('Validation rules must be an object'),
  
  body('placeholder')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Placeholder must not exceed 200 characters')
    .trim(),
  
  body('helpText')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Help text must not exceed 500 characters')
    .trim()
];

/**
 * Form submission validation
 */
const validateFormSubmission = [
  body('submissionData')
    .isObject()
    .withMessage('Submission data must be an object')
    .notEmpty()
    .withMessage('Submission data cannot be empty'),
  
  body('status')
    .optional()
    .isIn(['draft', 'submitted'])
    .withMessage('Status must be draft or submitted')
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
    .trim()
];

/**
 * ID parameter validation
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

/**
 * User ID parameter validation
 */
const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

/**
 * Form ID parameter validation
 */
const validateFormId = [
  param('formId')
    .isInt({ min: 1 })
    .withMessage('Form ID must be a positive integer')
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateUserManagement,
  validateFormCreation,
  validateFormUpdate,
  validateFormField,
  validateFormSubmission,
  validatePagination,
  validateId,
  validateUserId,
  validateFormId
};
