const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }

        // Check if user exists by email (existing email/password account)
        user = await User.findOne({ email });
        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // Create new user — NO role, NO profile yet (user picks role on frontend)
        const name = profile.displayName || email.split('@')[0];
        const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

        let finalUsername = username;
        const existingUsername = await User.findOne({ username: finalUsername });
        if (existingUsername) {
          finalUsername = `${username}_${Math.floor(Math.random() * 9000) + 1000}`;
        }

        user = await User.create({
          name,
          username: finalUsername,
          email,
          googleId: profile.id,
          // role is intentionally omitted — user selects it next
        });

        // Stash the Google profile pic URL so the callback route can pass it along
        user._googleProfilePic = profile.photos?.[0]?.value || null;

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
