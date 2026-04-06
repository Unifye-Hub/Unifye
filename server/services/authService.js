const User = require('../models/User');
const OrganizerProfile = require('../models/OrganizerProfile');
const ParticipantProfile = require('../models/ParticipantProfile');
const AppError = require('../utils/appError');

class AuthService {
  async signup(data) {
    const { name, email, password, role } = data;

    // Create the base user
    const user = await User.create({
      name,
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

  async login(email, password) {
    if (!email || !password) {
      throw new AppError('Please provide email and password!', 400);
    }

    // Find the user and include the password field implicitly specified select: false
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    return user;
  }
}

module.exports = new AuthService();
