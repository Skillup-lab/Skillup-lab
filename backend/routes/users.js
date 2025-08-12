/**
 * User Management Routes
 * Handles user CRUD operations (admin only)
 */

const express = require('express');
const router = express.Router();

// Controllers
const userController = require('../controllers/userController');

// Middleware
const { authenticate, requireAdmin } = require('../middleware/auth');
const { 
  validateUserManagement, 
  validatePagination, 
  validateId,
  validatePasswordChange 
} = require('../middleware/validation');

// Apply authentication and admin role requirement to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin only)
 */
router.get('/', validatePagination, userController.getUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', validateId, userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/', validateUserManagement, userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', validateId, validateUserManagement, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', validateId, userController.deleteUser);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin only)
 */
router.put('/:id/reset-password', validateId, [
  require('express-validator').body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
], userController.resetUserPassword);

module.exports = router;
