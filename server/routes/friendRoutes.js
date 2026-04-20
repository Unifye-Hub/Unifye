const express = require('express');
const { param } = require('express-validator');
const friendController = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

// Only participants can use the friend system
router.use((req, res, next) => {
  if (req.user.role !== 'participant') {
    return res.status(403).json({
      status: 'fail',
      message: 'Friend system is only available for participants',
    });
  }
  next();
});

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
