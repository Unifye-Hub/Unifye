const groupService = require('../services/groupService');
const catchAsync = require('../utils/catchAsync');

// POST /api/groups/create
exports.createGroup = catchAsync(async (req, res, next) => {
  const { eventId, name } = req.body;
  const group = await groupService.createGroup(req.user._id, eventId, name);
  res.status(201).json({ status: 'success', data: { group } });
});

// POST /api/groups/:id/join
exports.joinGroup = catchAsync(async (req, res, next) => {
  const group = await groupService.joinGroupDirect(req.user._id, req.params.id);
  res.status(200).json({ status: 'success', data: { group } });
});

// POST /api/groups/:id/request
exports.requestToJoin = catchAsync(async (req, res, next) => {
  const group = await groupService.requestToJoin(req.user._id, req.params.id);
  res.status(200).json({ status: 'success', data: { group } });
});

// POST /api/groups/:id/accept/:userId
exports.acceptJoinRequest = catchAsync(async (req, res, next) => {
  const group = await groupService.acceptJoinRequest(req.user._id, req.params.id, req.params.userId);
  res.status(200).json({ status: 'success', data: { group } });
});

// POST /api/groups/:id/reject/:userId
exports.rejectJoinRequest = catchAsync(async (req, res, next) => {
  const group = await groupService.rejectJoinRequest(req.user._id, req.params.id, req.params.userId);
  res.status(200).json({ status: 'success', data: { group } });
});

// POST /api/groups/:id/invite (Legacy - kept for compat)
exports.inviteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.body;
  const group = await groupService.inviteUser(req.user._id, req.params.id, userId);
  res.status(200).json({ status: 'success', data: { group } });
});

// POST /api/groups/:id/accept (Legacy - kept for compat)
exports.acceptInvite = catchAsync(async (req, res, next) => {
  const group = await groupService.acceptInvite(req.user._id, req.params.id);
  res.status(200).json({ status: 'success', data: { group } });
});

// POST /api/groups/:id/leave
exports.leaveGroup = catchAsync(async (req, res, next) => {
  const result = await groupService.leaveGroup(req.user._id, req.params.id);
  res.status(200).json({ status: 'success', data: result });
});

// POST /api/groups/:id/register
exports.registerGroup = catchAsync(async (req, res, next) => {
  const group = await groupService.registerGroup(req.params.id, req.user._id);
  res.status(200).json({ status: 'success', data: { group } });
});

// GET /api/groups/event/:eventId
exports.getGroupsByEvent = catchAsync(async (req, res, next) => {
  const groups = await groupService.getGroupsByEvent(req.params.eventId, req.user._id);
  res.status(200).json({ status: 'success', results: groups.length, data: { groups } });
});

// GET /api/groups/my
exports.getUserGroups = catchAsync(async (req, res, next) => {
  const groups = await groupService.getUserGroups(req.user._id);
  res.status(200).json({ status: 'success', results: groups.length, data: { groups } });
});

// POST /api/groups/:id/finalize (Legacy alias for registerGroup)
exports.finalizeGroup = catchAsync(async (req, res, next) => {
  const group = await groupService.registerGroup(req.params.id, req.user._id);
  res.status(200).json({ status: 'success', data: { group } });
});
