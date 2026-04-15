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

// ─── POST /api/groups/:id/request ─────────────────────────────────────────────
router.post(
  '/:id/request',
  [param('id').notEmpty().withMessage('Group ID is required')],
  validateRequest,
  groupController.requestToJoin
);

// ─── POST /api/groups/:id/accept/:userId ──────────────────────────────────────
router.post(
  '/:id/accept/:userId',
  [
    param('id').notEmpty().withMessage('Group ID is required'),
    param('userId').notEmpty().withMessage('User ID is required'),
  ],
  validateRequest,
  groupController.acceptJoinRequest
);

// ─── POST /api/groups/:id/reject/:userId ──────────────────────────────────────
router.post(
  '/:id/reject/:userId',
  [
    param('id').notEmpty().withMessage('Group ID is required'),
    param('userId').notEmpty().withMessage('User ID is required'),
  ],
  validateRequest,
  groupController.rejectJoinRequest
);

// ─── POST /api/groups/:id/leave ──────────────────────────────────────────────
router.post(
  '/:id/leave',
  [param('id').notEmpty().withMessage('Group ID is required')],
  validateRequest,
  groupController.leaveGroup
);

// ─── POST /api/groups/:id/register ────────────────────────────────────────────
router.post(
  '/:id/register',
  [param('id').notEmpty().withMessage('Group ID is required')],
  validateRequest,
  groupController.registerGroup
);


// ─── LEGACY ROUTES (Kept for compat) ──────────────────────────────────────────
router.post(
  '/:id/invite',
  [
    param('id').notEmpty().withMessage('Group ID is required'),
    body('userId').notEmpty().withMessage('User ID to invite is required'),
  ],
  validateRequest,
  groupController.inviteUser
);

router.post(
  '/:id/accept',
  [param('id').notEmpty().withMessage('Group ID is required')],
  validateRequest,
  groupController.acceptInvite
);

router.post(
  '/:id/finalize',
  [param('id').notEmpty().withMessage('Group ID is required')],
  validateRequest,
  groupController.finalizeGroup
);

module.exports = router;
