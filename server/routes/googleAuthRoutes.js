const express = require('express');
const passport = require('passport');
const { signToken } = require('../utils/jwtUtils');

const router = express.Router();

const getClientURL = () => {
  return process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://www.unifye.in' : 'http://localhost:5173');
};

// GET /auth/google — Redirect to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// GET /auth/google/callback — Handle Google response
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${getClientURL()}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    const token = signToken(req.user._id);
    const needsRole = !req.user.role;
    const pic = req.user._googleProfilePic || '';

    if (needsRole) {
      res.redirect(`${getClientURL()}/auth/select-role?token=${token}&pic=${encodeURIComponent(pic)}`);
    } else {
      res.redirect(`${getClientURL()}/auth/callback?token=${token}`);
    }
  }
);

module.exports = router;
