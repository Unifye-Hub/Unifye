const Group = require('../models/Group');
const Event = require('../models/Event');
const AppError = require('../utils/appError');

class GroupService {
  // ─── 1. Create a group ──────────────────────────────────────────────────────
  /**
   * Creates a new group for an event.
   * - Validates the event exists and supports group participation.
   * - Ensures the creator is not already in another group for the same event.
   * - Adds the creator as leader and first member.
   */
  async createGroup(userId, eventId, groupName) {
    // Check event exists
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check the event allows group participation
    // Treat undefined/missing eventType as INDIVIDUAL (legacy events)
    const mode = event.eventType || 'INDIVIDUAL';
    if (mode === 'INDIVIDUAL') {
      throw new AppError('This event does not support group participation. The organizer must enable Group or Both mode.', 400);
    }

    // Check user is not already in a group for this event
    const existingGroup = await Group.findOne({
      eventId,
      members: userId,
    });
    if (existingGroup) {
      throw new AppError('You are already part of a group for this event', 400);
    }

    // Create the group (pre-save hook will ensure leader is in members)
    const group = await Group.create({
      eventId,
      name: groupName,
      leaderId: userId,
      members: [userId],
    });

    return group;
  }

  // ─── 2. Join a group ────────────────────────────────────────────────────────
  /**
   * Allows a user to join an open group.
   * - Validates group exists and is OPEN.
   * - Ensures user is not already a member.
   * - Enforces maxMembers limit from the event's groupConfig.
   * - Marks group as FULL if maxMembers is reached.
   */
  async joinGroup(userId, groupId) {
    const group = await Group.findById(groupId).populate('eventId');
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    if (group.status !== 'OPEN') {
      throw new AppError('This group is not open for new members', 400);
    }

    // Check user is not already a member
    const isMember = group.members.some((m) => m.toString() === userId.toString());
    if (isMember) {
      throw new AppError('You are already a member of this group', 400);
    }

    // Check user is not in another group for this event
    const existingGroup = await Group.findOne({
      eventId: group.eventId,
      members: userId,
      _id: { $ne: groupId },
    });
    if (existingGroup) {
      throw new AppError('You are already part of another group for this event', 400);
    }

    // Enforce maxMembers from event's groupConfig
    const { groupConfig } = group.eventId;
    if (groupConfig && groupConfig.maxMembers) {
      if (group.members.length >= groupConfig.maxMembers) {
        throw new AppError('This group has reached the maximum member limit', 400);
      }
    }

    group.members.push(userId);

    // Mark as FULL if limit is now reached
    if (groupConfig && groupConfig.maxMembers && group.members.length >= groupConfig.maxMembers) {
      group.status = 'FULL';
    }

    await group.save();
    return group;
  }

  // ─── 3. Invite a user ──────────────────────────────────────────────────────
  /**
   * Leader invites a user to the group.
   * - Only the leader can invite.
   * - Prevents duplicate or existing member invitations.
   */
  async inviteUser(leaderId, groupId, userId) {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Only leader can invite
    if (group.leaderId.toString() !== leaderId.toString()) {
      throw new AppError('Only the group leader can invite users', 403);
    }

    if (group.status !== 'OPEN') {
      throw new AppError('Cannot invite to a group that is not open', 400);
    }

    // Check user is not already a member
    const isMember = group.members.some((m) => m.toString() === userId.toString());
    if (isMember) {
      throw new AppError('User is already a member of this group', 400);
    }

    // Check user is not already invited
    const isInvited = group.invitedUsers.some((u) => u.toString() === userId.toString());
    if (isInvited) {
      throw new AppError('User has already been invited', 400);
    }

    group.invitedUsers.push(userId);
    await group.save();
    return group;
  }

  // ─── 4. Accept an invite ───────────────────────────────────────────────────
  /**
   * Invited user accepts the invite — moves from invitedUsers to members.
   * - Validates the group still has capacity.
   * - Marks group as FULL if maxMembers is reached.
   */
  async acceptInvite(userId, groupId) {
    const group = await Group.findById(groupId).populate('eventId');
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Must be in invitedUsers
    const inviteIndex = group.invitedUsers.findIndex(
      (u) => u.toString() === userId.toString()
    );
    if (inviteIndex === -1) {
      throw new AppError('You do not have a pending invite for this group', 403);
    }

    if (group.status !== 'OPEN') {
      throw new AppError('This group is no longer accepting members', 400);
    }

    // Enforce maxMembers
    const { groupConfig } = group.eventId;
    if (groupConfig && groupConfig.maxMembers) {
      if (group.members.length >= groupConfig.maxMembers) {
        throw new AppError('This group has reached the maximum member limit', 400);
      }
    }

    // Move user from invitedUsers → members
    group.invitedUsers.splice(inviteIndex, 1);
    group.members.push(userId);

    // Mark as FULL if limit reached
    if (groupConfig && groupConfig.maxMembers && group.members.length >= groupConfig.maxMembers) {
      group.status = 'FULL';
    }

    await group.save();
    return group;
  }

  // ─── 5. Leave a group ──────────────────────────────────────────────────────
  /**
   * User leaves a group.
   * - Regular member: simply removed.
   * - Leader: next member is promoted, or group is deleted if no members remain.
   */
  async leaveGroup(userId, groupId) {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const isMember = group.members.some((m) => m.toString() === userId.toString());
    if (!isMember) {
      throw new AppError('You are not a member of this group', 400);
    }

    const isLeader = group.leaderId.toString() === userId.toString();

    // Remove user from members list
    group.members = group.members.filter((m) => m.toString() !== userId.toString());

    if (isLeader) {
      if (group.members.length === 0) {
        // No members left — delete the group
        await Group.findByIdAndDelete(groupId);
        return { message: 'Group disbanded as the leader was the last member' };
      }

      // Promote the next member to leader
      group.leaderId = group.members[0];
    }

    // Re-open the group if it was FULL
    if (group.status === 'FULL') {
      group.status = 'OPEN';
    }

    await group.save();
    return group;
  }

  // ─── 6. Get all groups for an event ────────────────────────────────────────
  /**
   * Returns all groups associated with a given event.
   * Populates leader and member details for the organizer view.
   */
  async getGroupsByEvent(eventId) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const groups = await Group.find({ eventId })
      .populate('leaderId', 'name email')
      .populate('members', 'name email')
      .lean();

    return groups;
  }

  // ─── 7. Get all groups the user belongs to ─────────────────────────────────
  /**
   * Returns all groups a user is a member of across all events.
   */
  async getUserGroups(userId) {
    const groups = await Group.find({ members: userId })
      .populate('eventId', 'title date_time location status')
      .populate('leaderId', 'name email')
      .populate('members', 'name email')
      .lean();

    return groups;
  }
  // ─── 8. Finalize group for event ────────────────────────────────────────────
  /**
   * Called by the group leader to lock in their team.
   * - Validates the leader is making the request.
   * - Enforces min/max member count from the event's groupConfig.
   * - Marks the group as CLOSED (team is finalized).
   * This does NOT create any new Registration documents — individual
   * spot-claiming already happened via the "Register Now" button.
   */
  async finalizeGroup(groupId, leaderId) {
    const group = await Group.findById(groupId).populate('eventId');
    if (!group) throw new AppError('Group not found', 404);

    // Only the leader can finalize
    if (group.leaderId.toString() !== leaderId.toString()) {
      throw new AppError('Only the group leader can finalize the group', 403);
    }

    // Already finalized
    if (group.status === 'CLOSED') {
      throw new AppError('This group is already finalized', 400);
    }

    const event = group.eventId; // populated
    const { minMembers, maxMembers } = event.groupConfig || {};

    // Enforce minimum members
    if (minMembers && group.members.length < minMembers) {
      throw new AppError(
        `Your group needs at least ${minMembers} members to register. Currently you have ${group.members.length}.`,
        400
      );
    }

    // Enforce maximum members (safety guard)
    if (maxMembers && group.members.length > maxMembers) {
      throw new AppError(
        `Your group exceeds the maximum allowed ${maxMembers} members. Please remove some members first.`,
        400
      );
    }

    // Lock the group
    group.status = 'CLOSED';
    await group.save();

    return group;
  }
}

module.exports = new GroupService();
