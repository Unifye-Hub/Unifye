const authService = require('../services/authService');
const { sendTokenResponse } = require('../utils/jwtUtils');
const catchAsync = require('../utils/catchAsync');

exports.signup = catchAsync(async (req, res, next) => {
  const user = await authService.signup(req.body);
  sendTokenResponse(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { identifier, password } = req.body;
  const user = await authService.login(identifier, password);
  sendTokenResponse(user, 200, res);
});
