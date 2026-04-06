const express = require('express');
const registrationController = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// mergeParams allows access to params from nested routers like /api/events/:id/register
const router = express.Router({ mergeParams: true });

router.use(protect);

// POST /api/events/:id/register
router.post(
  '/',
  restrictTo('participant'),
  registrationController.registerForEvent
);

// GET /api/events/:id/participants
router.get(
  '/',
  restrictTo('organizer'),
  registrationController.getEventParticipants
);

module.exports = router;
