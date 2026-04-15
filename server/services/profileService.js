const OrganizerProfile = require('../models/OrganizerProfile');
const ParticipantProfile = require('../models/ParticipantProfile');
const AppError = require('../utils/appError');

class ProfileService {
  async getProfile(userId, role) {
    let profile;
    if (role === 'organizer') {
      profile = await OrganizerProfile.findOne({ organizer_id: userId }).populate('organizer_id', 'name email role');
    } else {
      profile = await ParticipantProfile.findOne({ profile_id: userId }).populate('profile_id', 'name email role');
    }

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    return profile;
  }

  async updateProfile(userId, role, updateData, file) {
    let profile;
    
    // Add file URL to update data if a file is uploaded
    if (file) {
      if (role === 'organizer') {
        updateData.logo_url = file.path; // Cloudinary returns the URL in file.path
      } else {
        updateData.profile_pic_url = file.path;
      }
    }

    if (role === 'organizer') {
      profile = await OrganizerProfile.findOneAndUpdate(
        { organizer_id: userId },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate('organizer_id', 'name email role');
    } else {
      profile = await ParticipantProfile.findOneAndUpdate(
        { profile_id: userId },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate('profile_id', 'name email role');
    }

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    return profile;
  }

  async getPublicProfile(userId) {
    const User = require('../models/User'); // inline require to avoid circular dep just in case
    const Event = require('../models/Event');
    const Registration = require('../models/Registration');
    const RatingReview = require('../models/RatingReview');
    
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const profile = await this.getProfile(userId, user.role);
    
    let profileData = profile.toObject(); // Convert mongoose doc to plain object to attach properties

    if (user.role === 'participant') {
      const registrations = await Registration.find({ participant_id: userId }).populate('event_id');
      profileData.events = registrations.map(reg => reg.event_id);
    } else if (user.role === 'organizer') {
      const events = await Event.find({ organizer_id: userId });
      profileData.events = events;
      // Also fetch reviews for this organizer's profiles?
      const eventIds = events.map(e => e._id);
      const reviews = await RatingReview.find({ event_id: { $in: eventIds } })
        .populate('participant_id', 'name')
        .populate('event_id', 'title');
      profileData.reviews = reviews;
    }

    // Redact private social links
    if (!profileData.x_public) delete profileData.x_url;
    if (!profileData.medium_public) delete profileData.medium_url;
    if (!profileData.instagram_public) delete profileData.instagram_url;

    return profileData;
  }

  async searchUsers(query, limit = 20) {
    const User = require('../models/User'); // inline require
    if (!query) return [];
    
    const regex = new RegExp(query, 'i');
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }]
    })
      .select('name email role')
      .limit(limit)
      .lean();

    return users;
  }
}

module.exports = new ProfileService();
