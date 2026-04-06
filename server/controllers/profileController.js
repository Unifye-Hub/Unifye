const profileService = require('../services/profileService');
const catchAsync = require('../utils/catchAsync');

exports.getMe = catchAsync(async (req, res, next) => {
  const profile = await profileService.getProfile(req.user._id, req.user.role);
  res.status(200).json({
    status: 'success',
    data: {
      profile,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // Pass req.file if using multer for profile pictures / logos
  const profile = await profileService.updateProfile(
    req.user._id,
    req.user.role,
    req.body,
    req.file
  );

  res.status(200).json({
    status: 'success',
    data: {
      profile,
    },
  });
});

exports.getPublicProfile = catchAsync(async (req, res, next) => {
  const profile = await profileService.getPublicProfile(req.params.id);
  res.status(200).json({
    status: 'success',
    data: {
      profile,
    },
  });
});
