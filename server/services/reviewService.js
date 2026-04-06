const RatingReview = require('../models/RatingReview');
const Event = require('../models/Event');
const OrganizerProfile = require('../models/OrganizerProfile');
const Registration = require('../models/Registration');
const AppError = require('../utils/appError');

class ReviewService {
  async createReview(eventId, participantId, score, reviewText) {
    // Verify participant attended/registered
    const registration = await Registration.findOne({
      event_id: eventId,
      participant_id: participantId,
    });

    if (!registration) {
      throw new AppError('You must be registered for the event to review it', 400);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Create the review
    const review = await RatingReview.create({
      event_id: eventId,
      participant_id: participantId,
      score,
      review_text: reviewText,
    });

    // Aggregation pipeline to calculate new average for the organizer
    // 1. Find all reviews for all events created by this organizer
    const stats = await RatingReview.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event_id',
          foreignField: '_id',
          as: 'event',
        },
      },
      {
        $unwind: '$event',
      },
      {
        $match: { 'event.organizer_id': event.organizer_id },
      },
      {
        $group: {
          _id: '$event.organizer_id',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$score' },
        },
      },
    ]);

    if (stats.length > 0) {
      await OrganizerProfile.findOneAndUpdate(
        { organizer_id: event.organizer_id },
        { average_rating: stats[0].avgRating }
      );
    } else {
      // Edge case fallback
      await OrganizerProfile.findOneAndUpdate(
        { organizer_id: event.organizer_id },
        { average_rating: score }
      );
    }

    return review;
  }

  async getOrganizerReviews(organizerId) {
    // 1. Get all events by organizer
    const events = await Event.find({ organizer_id: organizerId }).select('_id');
    const eventIds = events.map((e) => e._id);

    // 2. Get reviews for those events
    const reviews = await RatingReview.find({ event_id: { $in: eventIds } })
      .populate('participant_id', 'name')
      .populate('event_id', 'title');

    return reviews;
  }
}

module.exports = new ReviewService();
