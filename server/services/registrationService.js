const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Group = require('../models/Group');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

class RegistrationService {
  // ─── Individual Registration (existing logic, untouched) ──────────────────
  async _registerIndividual(eventId, participantId, session) {
    // Check for duplicate registration
    const existingReg = await Registration.findOne({
      event_id: eventId,
      participant_id: participantId,
    }).session(session);

    if (existingReg) {
      throw new AppError('You have already registered for this event', 400);
    }

    const registration = await Registration.create(
      [{ participant_id: participantId, event_id: eventId, registration_type: 'individual' }],
      { session }
    );

    return registration[0];
  }

  // ─── Group Registration ────────────────────────────────────────────────────
  async _registerGroup(event, participantId, session) {
    const { minMembers, maxMembers } = event.groupConfig;

    // Find the group the user belongs to for this event
    const group = await Group.findOne({
      eventId: event._id,
      members: participantId,
    }).session(session);

    if (!group) {
      throw new AppError(
        'You must be part of a group to register for this event',
        400
      );
    }

    // Only the leader can trigger group registration
    if (group.leaderId.toString() !== participantId.toString()) {
      throw new AppError('Only the group leader can register the group for the event', 403);
    }

    // Enforce minimum members
    if (group.members.length < minMembers) {
      throw new AppError(
        `Your group needs at least ${minMembers} members to register (currently ${group.members.length})`,
        400
      );
    }

    // Enforce maximum members (safety guard — group status should already prevent this)
    if (maxMembers && group.members.length > maxMembers) {
      throw new AppError(
        `Your group exceeds the maximum allowed members (${maxMembers})`,
        400
      );
    }

    // Check none of the group members are already registered
    const memberIds = group.members.map((m) => m.toString());
    const existingRegs = await Registration.find({
      event_id: event._id,
      participant_id: { $in: group.members },
    }).session(session);

    if (existingRegs.length > 0) {
      throw new AppError(
        'One or more group members are already registered for this event',
        400
      );
    }

    // Create one Registration doc per group member
    const registrationDocs = group.members.map((memberId) => ({
      participant_id: memberId,
      event_id: event._id,
      registration_type: 'group',
      group_id: group._id,
    }));

    const registrations = await Registration.create(registrationDocs, { session });

    // Update group status to LOCKED after successful registration
    await Group.findByIdAndUpdate(group._id, { status: 'LOCKED' }, { session });

    return registrations;
  }

  // ─── Main Entry Point ──────────────────────────────────────────────────────
  /**
   * Registers a participant (or their group) for an event.
   *
   * eventType rules:
   *   INDIVIDUAL → standard solo registration only
   *   GROUP      → must be in a group; leader registers all members as a unit
   *   BOTH       → solo registration if not in a group; group registration if in a group
   *
   * @param {string} eventId       - The event's ObjectId
   * @param {string} participantId - The requesting user's ObjectId
   * @returns registration doc(s)
   */
  async registerForEvent(eventId, participantId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const event = await Event.findById(eventId).session(session);

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check overall event capacity
      if (event.current_registrations >= event.capacity) {
        throw new AppError('Event has reached maximum capacity', 400);
      }

      const { eventType } = event;
      let result;

      // ── INDIVIDUAL ──────────────────────────────────────────────────────────
      if (eventType === 'INDIVIDUAL') {
        result = await this._registerIndividual(eventId, participantId, session);
        event.current_registrations += 1;
      }

      // ── GROUP ───────────────────────────────────────────────────────────────
      // For GROUP events, user MUST be part of a group and the leader registers the group.
      else if (eventType === 'GROUP') {
        result = await this._registerGroup(event, participantId, session);
        event.current_registrations += result.length;
      }

      // ── BOTH ────────────────────────────────────────────────────────────────
      else if (eventType === 'BOTH') {
        // Check if the user is in a group for this event
        const userGroup = await Group.findOne({
          eventId,
          members: participantId,
        }).session(session);

        if (userGroup) {
          // User is in a group → treat as group registration
          result = await this._registerGroup(event, participantId, session);
          event.current_registrations += result.length;
        } else {
          // No group → fall back to individual registration
          result = await this._registerIndividual(eventId, participantId, session);
          event.current_registrations += 1;
        }
      }

      await event.save({ session });
      await session.commitTransaction();
      session.endSession();

      return result;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // ─── Get Event Participants (Organizer view) ────────────────────────────────
  /**
   * Returns all registrations for an event, including group info.
   * Only accessible to the event organizer.
   */
  async getEventParticipants(eventId, organizerId) {
    const event = await Event.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizer_id.toString() !== organizerId.toString()) {
      throw new AppError('You do not have permission to view participants for this event', 403);
    }

    const participants = await Registration.find({ event_id: eventId })
      .populate({ path: 'participant_id', select: 'name email' })
      .populate({ path: 'group_id', select: 'name leaderId members status' })
      .lean();

    return participants;
  }
}

module.exports = new RegistrationService();

