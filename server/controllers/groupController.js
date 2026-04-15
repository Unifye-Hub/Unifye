const groupService = require('../services/groupService');
const catchAsync = require('../utils/catchAsync');

// POST /api/groups/create
exports.createGroup = catchAsync(async (req, res, next) => {
  const { eventId, name } = req.body;

  const group = await groupService.createGroup(req.user._id, eventId, name);

  res.status(201).json({
    status: 'success',
    data: { group },
  });
});

// POST /api/groups/:id/join
exports.joinGroup = catchAsync(async (req, res, next) => {
  const group = await groupService.joinGroup(req.user._id, req.params.id);

  res.status(200).json({
    status: 'success',
    data: { group },
  });
});

// POST /api/groups/:id/invite
exports.inviteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  const group = await groupService.inviteUser(req.user._id, req.params.id, userId);

  res.status(200).json({
    status: 'success',
    data: { group },
  });
});

// POST /api/groups/:id/accept
exports.acceptInvite = catchAsync(async (req, res, next) => {
  const group = await groupService.acceptInvite(req.user._id, req.params.id);

  res.status(200).json({
    status: 'success',
    data: { group },
  });
});

// POST /api/groups/:id/leave
exports.leaveGroup = catchAsync(async (req, res, next) => {
  const result = await groupService.leaveGroup(req.user._id, req.params.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// GET /api/groups/event/:eventId
exports.getGroupsByEvent = catchAsync(async (req, res, next) => {
  const groups = await groupService.getGroupsByEvent(req.params.eventId);

  res.status(200).json({
    status: 'success',
    results: groups.length,
    data: { groups },
  });
});

// GET /api/groups/my
exports.getUserGroups = catchAsync(async (req, res, next) => {
  const groups = await groupService.getUserGroups(req.user._id);

  res.status(200).json({
    status: 'success',
    results: groups.length,
    data: { groups },
  });
});

// POST /api/groups/:id/finalize
exports.finalizeGroup = catchAsync(async (req, res, next) => {
  const group = await groupService.finalizeGroup(req.params.id, req.user._id);

  res.status(200).json({
    status: 'success',
    data: { group },
  });
});
