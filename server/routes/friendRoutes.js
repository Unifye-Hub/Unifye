const express = require('express');
const { param } = require('express-validator');
const friendController = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

router.post(
  '/request/:userId',
  [param('userId').notEmpty().withMessage('User ID is required')],
  validateRequest,
  friendController.sendRequest
);

router.post(
  '/accept/:userId',
  [param('userId').notEmpty().withMessage('User ID is required')],
  validateRequest,
  friendController.acceptRequest
);

router.post(
  '/reject/:userId',
  [param('userId').notEmpty().withMessage('User ID is required')],
  validateRequest,
  friendController.rejectRequest
);

router.get('/', friendController.getFriends);
router.get('/requests', friendController.getRequests);
router.get('/status/:userId', friendController.getFriendStatus);

module.exports = router;
