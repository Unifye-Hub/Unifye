const express = require('express');
const { body, param } = require('express-validator');
const groupController = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

// All group routes require authentication
router.use(protect);

// ─── POST /api/groups/create ──────────────────────────────────────────────────
router.post(
  '/create',
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('name').notEmpty().withMessage('Group name is required'),
  ],
  validateRequest,
  groupController.createGroup
);

// ─── GET /api/groups/my ───────────────────────────────────────────────────────
// NOTE: Must be defined BEFORE /:id routes to avoid "my" being treated as an id
router.get('/my', groupController.getUserGroups);

// ─── GET /api/groups/event/:eventId ──────────────────────────────────────────
router.get(
  '/event/:eventId',
  [param('eventId').notEmpty().withMessage('Event ID is required')],
  validateRequest,
  groupController.getGroupsByEvent
);

// ─── POST /api/groups/:id/join ────────────────────────────────────────────────
router.post(
  '/:id/join',
  [param('id').notEmpty().withMessage('Group ID is required')],
  validateRequest,
  groupController.joinGroup
);

// ─── POST /api/groups/:id/invite ─────────────────────────────────────────────
router.post(
  '/:id/invite',
  [
    param('id').notEmpty().withMessage('Group ID is required'),
    body('userId').notEmpty().withMessage('User ID to invite is required'),
  ],
  validateRequest,
  groupController.inviteUser
);

// ─── POST /api/groups/:id/accept ─────────────────────────────────────────────
router.post(
  '/:id/accept',
  [param('id').notEmpty().withMessage('Group ID is required')],
  validateRequest,
  groupController.acceptInvite
);

// ─── POST /api/groups/:id/leave ──────────────────────────────────────────────
router.post(
  '/:id/leave',
  [param('id').notEmpty().withMessage('Group ID is required')],
  validateRequest,
  groupController.leaveGroup
);

// ─── POST /api/groups/:id/finalize ────────────────────────────────────────────
router.post(
  '/:id/finalize',
  [param('id').notEmpty().withMessage('Group ID is required')],
  validateRequest,
  groupController.finalizeGroup
);

module.exports = router;
