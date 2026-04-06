const express = require('express');
const { body } = require('express-validator');
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Nested routers
const registrationRouter = require('./registrationRoutes');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Mount nested routes
// e.g. /api/events/:id/register -> goes to registrationRouter
router.use('/:id/participants', registrationRouter); // Note: handled explicitly in registrationRoutes if needed 
router.use('/:id/register', registrationRouter);
router.use('/:id/reviews', reviewRouter); // if using exact REST nested, but let's mount directly

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEvent);

// Protected routes (Organizer only)
router.use(protect);
router.use(restrictTo('organizer'));

router.post(
  '/',
  upload.single('cover_image'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('type').notEmpty().withMessage('Event type is required'),
    body('date_time').isISO8601().withMessage('Valid date and time are required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  validateRequest,
  eventController.createEvent
);

router.put('/:id', upload.single('cover_image'), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
