const eventService = require('../services/eventService');
const catchAsync = require('../utils/catchAsync');

exports.createEvent = catchAsync(async (req, res, next) => {
  const event = await eventService.createEvent(req.user._id, req.body, req.file);
  res.status(201).json({
    status: 'success',
    data: {
      event,
    },
  });
});

exports.getAllEvents = catchAsync(async (req, res, next) => {
  const result = await eventService.getAllEvents(req.query);
  res.status(200).json({
    status: 'success',
    results: result.events.length,
    data: result,
  });
});

exports.getEvent = catchAsync(async (req, res, next) => {
  const event = await eventService.getEventById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: {
      event,
    },
  });
});

exports.updateEvent = catchAsync(async (req, res, next) => {
  const event = await eventService.updateEvent(
    req.params.id,
    req.user._id,
    req.body,
    req.file
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      event,
    },
  });
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
  await eventService.deleteEvent(req.params.id, req.user._id);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
