const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ─── POST /api/friends/request/:userId ──────────────────────────────────────
exports.sendRequest = catchAsync(async (req, res, next) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.userId;

  if (currentUserId.toString() === targetUserId.toString()) {
    return next(new AppError('You cannot send a friend request to yourself', 400));
  }

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
    return next(new AppError('User not found', 404));
  }

  // Check if they are already friends
  if (currentUser.friends.includes(targetUserId)) {
    return next(new AppError('You are already friends', 400));
  }

  // Check if request already sent or received
  const existingSent = targetUser.friendRequests.some(
    (req) => req.from.toString() === currentUserId.toString() && req.status === 'PENDING'
  );
  if (existingSent) {
    return next(new AppError('Friend request already sent', 400));
  }

  const existingReceived = currentUser.friendRequests.some(
    (req) => req.from.toString() === targetUserId.toString() && req.status === 'PENDING'
  );
  if (existingReceived) {
    return next(new AppError('This user has already sent you a request. Accept it instead.', 400));
  }

  // Push to target's list and current user's list (both track requests)
  targetUser.friendRequests.push({ from: currentUserId, to: targetUserId });
  currentUser.friendRequests.push({ from: currentUserId, to: targetUserId });

  await targetUser.save({ validateBeforeSave: false });
  await currentUser.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', message: 'Friend request sent' });
});

// ─── POST /api/friends/accept/:userId ───────────────────────────────────────
exports.acceptRequest = catchAsync(async (req, res, next) => {
  const currentUserId = req.user._id;
  const fromUserId = req.params.userId;

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(fromUserId);

  if (!targetUser) {
    return next(new AppError('User not found', 404));
  }

  const requestOnSelf = currentUser.friendRequests.find(
    (req) => req.from.toString() === fromUserId.toString() && req.status === 'PENDING'
  );

  if (!requestOnSelf) {
    return next(new AppError('No pending friend request found from this user', 404));
  }

  const requestOnTarget = targetUser.friendRequests.find(
    (req) => req.from.toString() === fromUserId.toString() && req.to.toString() === currentUserId.toString() && req.status === 'PENDING'
  );

  // Update request status
  requestOnSelf.status = 'ACCEPTED';
  if (requestOnTarget) requestOnTarget.status = 'ACCEPTED';

  // Add to friends lists (ensure no duplicates)
  if (!currentUser.friends.includes(fromUserId)) currentUser.friends.push(fromUserId);
  if (!targetUser.friends.includes(currentUserId)) targetUser.friends.push(currentUserId);

  await currentUser.save({ validateBeforeSave: false });
  await targetUser.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', message: 'Friend request accepted' });
});

// ─── POST /api/friends/reject/:userId ───────────────────────────────────────
exports.rejectRequest = catchAsync(async (req, res, next) => {
  const currentUserId = req.user._id;
  const fromUserId = req.params.userId;

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(fromUserId);

  if (!targetUser) return next(new AppError('User not found', 404));

  const requestOnSelf = currentUser.friendRequests.find(
    (req) => req.from.toString() === fromUserId.toString() && req.status === 'PENDING'
  );

  if (!requestOnSelf) {
    return next(new AppError('No pending friend request found from this user', 404));
  }

  const requestOnTarget = targetUser.friendRequests.find(
    (req) => req.from.toString() === fromUserId.toString() && req.to.toString() === currentUserId.toString() && req.status === 'PENDING'
  );

  // Mark rejected
  requestOnSelf.status = 'REJECTED';
  if (requestOnTarget) requestOnTarget.status = 'REJECTED';

  await currentUser.save({ validateBeforeSave: false });
  await targetUser.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', message: 'Friend request rejected' });
});

// ─── GET /api/friends/status/:userId ─────────────────────────────────────────
exports.getFriendStatus = catchAsync(async (req, res, next) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.userId;

  if (currentUserId.toString() === targetUserId.toString()) {
    return res.status(200).json({ status: 'success', data: { relationship: 'SELF' } });
  }

  const currentUser = await User.findById(currentUserId).select('friends friendRequests');
  let rel = 'NOT_FRIEND';
  const isFriend = currentUser.friends.some(f => f.toString() === targetUserId.toString());
  
  if (isFriend) {
    rel = 'FRIEND';
  } else {
    const sent = currentUser.friendRequests.some(r => r.to.toString() === targetUserId.toString() && r.status === 'PENDING');
    const received = currentUser.friendRequests.some(r => r.from.toString() === targetUserId.toString() && r.status === 'PENDING');
    if (sent) rel = 'PENDING_SENT';
    if (received) rel = 'PENDING_RECEIVED';
  }

  res.status(200).json({ status: 'success', data: { relationship: rel } });
});

// ─── GET /api/friends ────────────────────────────────────────────────────────
exports.getFriends = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('friends', 'name email');

  res.status(200).json({
    status: 'success',
    results: user.friends.length,
    data: {
      friends: user.friends
    }
  });
});

// ─── GET /api/friends/requests ───────────────────────────────────────────────
exports.getRequests = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('friendRequests.from', 'name email')
    .populate('friendRequests.to', 'name email');

  const pending = user.friendRequests.filter(req => req.status === 'PENDING');

  res.status(200).json({
    status: 'success',
    results: pending.length,
    data: {
      requests: pending
    }
  });
});
