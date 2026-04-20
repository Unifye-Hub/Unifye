const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : null;

  if (field === 'email') {
    return new AppError('This email is already registered. Please log in or use a different email.', 400);
  }
  if (field === 'username') {
    return new AppError('This username is already taken. Please choose a different one.', 400);
  }

  const value = err.keyValue ? Object.values(err.keyValue)[0] : 'unknown';
  return new AppError(`Duplicate value for "${field || 'field'}": ${value}. Please use another value.`, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    require('fs').appendFileSync('/tmp/unifye-error.log', new Date().toISOString() + ' ERROR: ' + err.stack + '\n');
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Transform known DB errors into user-friendly messages in ALL environments
  let error = { ...err };
  error.message = err.message;

  if (error.name === 'CastError' || err.name === 'CastError')
    error = handleCastErrorDB(err);
  if (error.code === 11000 || err.code === 11000)
    error = handleDuplicateFieldsDB(err);
  if (error.name === 'ValidationError' || err.name === 'ValidationError')
    error = handleValidationErrorDB(err);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};
