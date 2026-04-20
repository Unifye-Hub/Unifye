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

    // Find existing individual registrations for group members
    const existingRegs = await Registration.find({
      event_id: event._id,
      participant_id: { $in: group.members },
    }).session(session);

    const registeredMemberIds = new Set(
      existingRegs.map((r) => r.participant_id.toString())
    );

    // Convert existing individual registrations to group type
    if (existingRegs.length > 0) {
      await Registration.updateMany(
        { event_id: event._id, participant_id: { $in: group.members } },
        { registration_type: 'group', group_id: group._id },
        { session }
      );
    }

    // Create registrations for members who aren't registered yet
    const unregisteredMembers = group.members.filter(
      (m) => !registeredMemberIds.has(m.toString())
    );

    let newRegistrations = [];
    if (unregisteredMembers.length > 0) {
      const newDocs = unregisteredMembers.map((memberId) => ({
        participant_id: memberId,
        event_id: event._id,
        registration_type: 'group',
        group_id: group._id,
      }));
      newRegistrations = await Registration.create(newDocs, { session });
    }

    // Lock the group
    await Group.findByIdAndUpdate(group._id, { status: 'LOCKED' }, { session });

    // Return only the NEW registrations count (existing ones are already counted)
    return newRegistrations;
  }

  // ─── Main Entry Point ──────────────────────────────────────────────────────
  /**
   * Registers a participant (or finalizes their group) for an event.
   *
   * eventType rules:
   *   INDIVIDUAL → standard solo registration
   *   GROUP/BOTH → individual registration first; when called again by a
   *                group leader, converts individual regs to group type,
   *                registers remaining members, and locks the group.
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

      // ── GROUP / BOTH ───────────────────────────────────────────────────────
      // Flow: user registers individually first, then forms/joins a group,
      // then the group leader finalizes group registration (locks the group
      // and converts individual registrations to group type).
      else if (eventType === 'GROUP' || eventType === 'BOTH') {
        const userGroup = await Group.findOne({
          eventId,
          members: participantId,
          leaderId: participantId,
        }).session(session);

        if (userGroup && userGroup.status !== 'LOCKED') {
          // User is a group leader → finalize group registration
          result = await this._registerGroup(event, participantId, session);
          event.current_registrations += result.length;
        } else {
          // No group or not a leader → individual registration
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

