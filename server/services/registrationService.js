const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

class RegistrationService {
  async registerForEvent(eventId, participantId) {
    // Transaction to safely update event and create registration
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const event = await Event.findById(eventId).session(session);
      
      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check capacity
      if (event.current_registrations >= event.capacity) {
        throw new AppError('Event has reached maximum capacity', 400);
      }

      // Check for duplicate registration
      const existingReg = await Registration.findOne({ event_id: eventId, participant_id: participantId }).session(session);
      if (existingReg) {
        throw new AppError('You have already registered for this event', 400);
      }
      const registration = await Registration.create(
        [{
          participant_id: participantId,
          event_id: eventId,
        }],
        { session } // pass session array-like syntax for Mongoose create
      );

      // Increment current registrations
      event.current_registrations += 1;
      await event.save({ session });

      await session.commitTransaction();
      session.endSession();

      return registration[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getEventParticipants(eventId, organizerId) {
    const event = await Event.findById(eventId);
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    // Ensure only the organizer of the event can see the participants
    if (event.organizer_id.toString() !== organizerId.toString()) {
      throw new AppError('You do not have permission to view participants for this event', 403);
    }

    const participants = await Registration.find({ event_id: eventId }).populate({
      path: 'participant_id',
      select: 'name email', // Could also deeply populate profile if needed
    });

    return participants;
  }
}

module.exports = new RegistrationService();
