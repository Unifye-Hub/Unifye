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

exports.searchUsers = catchAsync(async (req, res, next) => {
  const { q } = req.query;
  const results = await profileService.searchUsers(q, 20);

  // Map relationship statuses
  // Relationships: NOT_FRIEND | PENDING_SENT | PENDING_RECEIVED | FRIEND
  const currentUser = await require('../models/User').findById(req.user._id).select('friends friendRequests');
  
  const mappedResults = results.map(user => {
    let rel = 'NOT_FRIEND';
    const isFriend = currentUser.friends.some(f => f.toString() === user._id.toString());
    
    if (isFriend) {
      rel = 'FRIEND';
    } else {
      const sent = currentUser.friendRequests.some(r => r.to.toString() === user._id.toString() && r.status === 'PENDING');
      const received = currentUser.friendRequests.some(r => r.from.toString() === user._id.toString() && r.status === 'PENDING');
      
      if (sent) rel = 'PENDING_SENT';
      if (received) rel = 'PENDING_RECEIVED';
    }

    return { ...user, relationship: rel };
  });

  res.status(200).json({
    status: 'success',
    results: mappedResults.length,
    data: {
      users: mappedResults,
    },
  });
});
