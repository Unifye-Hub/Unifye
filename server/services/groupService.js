const Group = require('../models/Group');
const Event = require('../models/Event');
const User = require('../models/User'); // Required for friend logic calculations
const AppError = require('../utils/appError');

function syncStatus(group, maxMembers) {
  if (group.status === 'LOCKED') return;
  if (maxMembers && group.members.length >= maxMembers) {
    group.status = 'FULL';
  } else {
    group.status = 'OPEN';
  }
}

class GroupService {
  async createGroup(userId, eventId, groupName) {
    const event = await Event.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    const mode = event.eventType || 'INDIVIDUAL';
    if (mode === 'INDIVIDUAL') {
      throw new AppError('This event does not support group participation.', 400);
    }

    const existingGroup = await Group.findOne({ eventId, members: userId });
    if (existingGroup) {
      throw new AppError('You are already part of a group for this event', 400);
    }

    const group = await Group.create({
      eventId,
      name: groupName,
      leaderId: userId,
      members: [userId],
    });

    return group;
  }

  async joinGroupDirect(userId, groupId) {
    const group = await Group.findById(groupId).populate('eventId').populate('leaderId', 'friends');
    if (!group) throw new AppError('Group not found', 404);

    if (group.status === 'LOCKED') throw new AppError('This group is locked', 400);
    if (group.status === 'FULL')   throw new AppError('This group is full', 400);
    if (group.status !== 'OPEN')   throw new AppError('This group is not open', 400);

    const isMember = group.members.some((m) => m.toString() === userId.toString());
    if (isMember) throw new AppError('You are already a member of this group', 400);

    const existing = await Group.findOne({ eventId: group.eventId._id || group.eventId, members: userId });
    if (existing) throw new AppError('You are already part of another group for this event', 400);

    // Enforce friend checking
    const leader = group.leaderId;
    const isFriendWithLeader = leader.friends.some((f) => f.toString() === userId.toString());
    
    if (!isFriendWithLeader) {
      throw new AppError('Only friends of the group leader can join directly', 403);
    }

    const maxM = group.eventId?.groupConfig?.maxMembers;
    if (maxM && group.members.length >= maxM) {
      throw new AppError('This group has reached the maximum member limit', 400);
    }

    group.members.push(userId);
    syncStatus(group, maxM);
    await group.save();
    return group;
  }

  async requestToJoin(userId, groupId) {
    const group = await Group.findById(groupId).populate('eventId');
    if (!group) throw new AppError('Group not found', 404);

    if (group.status === 'LOCKED') throw new AppError('This group is locked', 400);
    if (group.status === 'FULL')   throw new AppError('This group is full', 400);

    const isMember = group.members.some((m) => m.toString() === userId.toString());
    if (isMember) throw new AppError('You are already a member of this group', 400);

    const exists = group.joinRequests.some(
      (r) => (r.userId?._id?.toString() || r.userId.toString()) === userId.toString() && r.status === 'PENDING'
    );
    if (exists) throw new AppError('You already have a pending request for this group', 400);

    const existing = await Group.findOne({ eventId: group.eventId._id || group.eventId, members: userId });
    if (existing) throw new AppError('You are already part of another group for this event', 400);

    group.joinRequests.push({ userId, status: 'PENDING' });
    await group.save();
    return group;
  }

  async acceptJoinRequest(leaderId, groupId, requestUserId) {
    const group = await Group.findById(groupId).populate('eventId');
    if (!group) throw new AppError('Group not found', 404);

    if (group.leaderId.toString() !== leaderId.toString()) {
      throw new AppError('Only the group leader can accept requests', 403);
    }
    if (group.status === 'LOCKED') throw new AppError('Group is locked', 400);
    
    const maxM = group.eventId?.groupConfig?.maxMembers;
    if (maxM && group.members.length >= maxM) {
      throw new AppError('Group is already full', 400);
    }

    // Ensure user isn't already grouped
    const existing = await Group.findOne({ eventId: group.eventId._id || group.eventId, members: requestUserId });
    if (existing) throw new AppError('This user is already part of another group for this event', 400);

    const reqIdx = group.joinRequests.findIndex(
      (r) => (r.userId?._id?.toString() || r.userId.toString()) === requestUserId.toString() && r.status === 'PENDING'
    );
    if (reqIdx === -1) throw new AppError('No pending request from this user', 404);

    group.joinRequests[reqIdx].status = 'ACCEPTED';
    group.members.push(requestUserId);
    syncStatus(group, maxM);
    await group.save();
    return group;
  }

  async rejectJoinRequest(leaderId, groupId, requestUserId) {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError('Group not found', 404);

    if (group.leaderId.toString() !== leaderId.toString()) {
      throw new AppError('Only the group leader can reject requests', 403);
    }

    const req = group.joinRequests.find(
      (r) => (r.userId?._id?.toString() || r.userId.toString()) === requestUserId.toString() && r.status === 'PENDING'
    );
    if (!req) throw new AppError('No pending request from this user', 404);

    req.status = 'REJECTED';
    await group.save();
    return group;
  }

  // Used by leaders to directly add their friends
  async inviteUser(leaderId, groupId, requestUserId) {
    const group = await Group.findById(groupId).populate('eventId').populate('leaderId', 'friends');
    if (!group) throw new AppError('Group not found', 404);

    if (group.leaderId._id.toString() !== leaderId.toString()) {
      throw new AppError('Only the leader can add to the group', 403);
    }
    if (group.status === 'LOCKED') throw new AppError('Group is locked', 400);
    if (group.status === 'FULL') throw new AppError('This group is full', 400);

    const existing = await Group.findOne({ eventId: group.eventId._id || group.eventId, members: requestUserId });
    if (existing) throw new AppError('This user is already part of another group for this event', 400);

    const isFriend = group.leaderId.friends.some((f) => f.toString() === requestUserId.toString());
    if (!isFriend) throw new AppError('You can only directly add users who are your friends', 403);

    const maxM = group.eventId?.groupConfig?.maxMembers;
    if (maxM && group.members.length >= maxM) {
      throw new AppError('Group is Full', 400);
    }

    group.members.push(requestUserId);
    syncStatus(group, maxM);
    await group.save();
    return group;
  }

  async leaveGroup(userId, groupId) {
    const group = await Group.findById(groupId).populate('eventId');
    if (!group) throw new AppError('Group not found', 404);

    if (group.status === 'LOCKED') {
      throw new AppError('Group is locked — you cannot leave after registration', 400);
    }

    const isMember = group.members.some((m) => m.toString() === userId.toString());
    if (!isMember) throw new AppError('You are not a member of this group', 400);

    const isLeader = group.leaderId.toString() === userId.toString();

    group.members = group.members.filter((m) => m.toString() !== userId.toString());

    if (isLeader) {
      if (group.members.length === 0) {
        await Group.findByIdAndDelete(groupId);
        return { message: 'Group disbanded — leader was the last member' };
      }
      group.leaderId = group.members[0];
    }

    const maxM = group.eventId?.groupConfig?.maxMembers;
    syncStatus(group, maxM);
    await group.save();
    return group;
  }

  async registerGroup(groupId, leaderId) {
    const group = await Group.findById(groupId).populate('eventId');
    if (!group) throw new AppError('Group not found', 404);

    if (group.leaderId.toString() !== leaderId.toString()) {
      throw new AppError('Only the group leader can register the group', 403);
    }
    if (group.status === 'LOCKED') throw new AppError('This group is already registered', 400);

    const event = group.eventId;
    const { minMembers, maxMembers } = event.groupConfig || {};

    if (minMembers && group.members.length < minMembers) {
      throw new AppError(`Your group needs at least ${minMembers} members to register.`, 400);
    }
    if (maxMembers && group.members.length > maxMembers) {
      throw new AppError(`Your group exceeds the maximum of ${maxMembers} members.`, 400);
    }

    group.status = 'LOCKED';
    await group.save();
    return group;
  }

  async getGroupsByEvent(eventId, currentUserId) {
    const event = await Event.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    const groups = await Group.find({ eventId })
      .populate('leaderId', 'name email friends')
      .populate('members', 'name email')
      .populate('joinRequests.userId', 'name email')
      .lean();

    // Map `isFriendWithLeader` logically
    return groups.map(group => {
      let isFriendWithLeader = false;
      if (currentUserId && group.leaderId && group.leaderId.friends) {
        isFriendWithLeader = group.leaderId.friends.some(
          friendId => friendId.toString() === currentUserId.toString()
        );
      }

      // Hide leader's whole friend list from public payload
      if (group.leaderId) {
        delete group.leaderId.friends;
      }

      return {
        ...group,
        isFriendWithLeader
      };
    });
  }

  async getUserGroups(userId) {
    return await Group.find({ members: userId })
      .populate('eventId', 'title date_time location status')
      .populate('leaderId', 'name email')
      .populate('members', 'name email')
      .lean();
  }

  async joinGroup(userId, groupId) {
    return this.joinGroupDirect(userId, groupId);
  }
  async finalizeGroup(groupId, leaderId) {
    return this.registerGroup(groupId, leaderId);
  }
}

module.exports = new GroupService();
