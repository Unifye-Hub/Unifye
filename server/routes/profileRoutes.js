const express = require('express');
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/public/:id', profileController.getPublicProfile);

// All profile routes require authentication
router.use(protect);

router.get('/me', profileController.getMe);
router.put('/update', upload.single('profile_image'), profileController.updateMe); // expects 'profile_image' form-data key for logo/pic

module.exports = router;
