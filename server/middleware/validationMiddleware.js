const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Extract first error message
    const message = errors.array()[0].msg;
    return next(new AppError(message, 400));
  }
  next();
};

module.exports = { validateRequest };
