const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validationMiddleware');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/signup',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('role')
      .isIn(['participant', 'organizer'])
      .withMessage('Role must be participant or organizer'),
  ],
  validateRequest,
  authController.signup
);

router.post(
  '/login',
  [
    body('identifier').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  authController.login
);

router.post(
  '/complete-profile',
  protect,
  [
    body('role')
      .isIn(['participant', 'organizer'])
      .withMessage('Role must be participant or organizer'),
  ],
  validateRequest,
  authController.completeProfile
);

module.exports = router;
