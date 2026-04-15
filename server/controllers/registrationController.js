const registrationService = require('../services/registrationService');
const catchAsync = require('../utils/catchAsync');

exports.registerForEvent = catchAsync(async (req, res, next) => {
  const registration = await registrationService.registerForEvent(
    req.params.id, // event id
    req.user._id // participant id
  );

  res.status(201).json({
    status: 'success',
    data: {
      registration,
    },
  });
});

exports.getEventParticipants = catchAsync(async (req, res, next) => {
  const participants = await registrationService.getEventParticipants(
    req.params.id, // event id
    req.user._id // organizer id
  );

  res.status(200).json({
    status: 'success',
    results: participants.length,
    data: {
      participants,
    },
  });
});

exports.getMyRegistration = catchAsync(async (req, res, next) => {
  const Registration = require('../models/Registration');
  const reg = await Registration.findOne({
    event_id: req.params.id,
    participant_id: req.user._id,
  }).lean();

  res.status(200).json({
    status: 'success',
    data: { registered: !!reg },
  });
});
