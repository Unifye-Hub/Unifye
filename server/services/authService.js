const User = require('../models/User');
const OrganizerProfile = require('../models/OrganizerProfile');
const ParticipantProfile = require('../models/ParticipantProfile');
const AppError = require('../utils/appError');

class AuthService {
  async signup(data) {
    const { name, username, email, password, role } = data;

    // Create the base user
    const user = await User.create({
      name,
      username,
      email,
      password,
      role,
    });

    // Create corresponding profile based on role
    if (role === 'organizer') {
      await OrganizerProfile.create({
        organizer_id: user._id,
        company_name: name, // Defaulting company name to user name initially
      });
    } else {
      await ParticipantProfile.create({
        profile_id: user._id,
        full_name: name, // Defaulting full name to user name initially
        skills_list: [],
      });
    }

    return user;
  }

  async login(identifier, password) {
    if (!identifier || !password) {
      throw new AppError('Please provide email/username and password!', 400);
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect email/username or password', 401);
    }

    return user;
  }
}

module.exports = new AuthService();
