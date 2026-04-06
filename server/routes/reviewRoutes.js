const express = require('express');
const { body } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

// mergeParams allows access to params from nested routers
const router = express.Router({ mergeParams: true });

// POST /api/events/:id/review
// Should be registered in app.js as app.use('/api/events/:id/review', reviewRoutes) OR use mergeParams here
router.post(
  '/',
  protect,
  restrictTo('participant'),
  [
    body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),
    body('review_text').optional().isLength({ max: 1000 }).withMessage('Review too long'),
  ],
  validateRequest,
  reviewController.createReview
);

// GET /api/organizers/:id/reviews
router.get(
  '/',
  reviewController.getOrganizerReviews // This is technically fine to be public
);

module.exports = router;
