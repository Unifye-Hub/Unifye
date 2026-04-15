import api from './api';

// Create a group for an event
export const createGroup = (eventId, name) =>
  api.post('/groups/create', { eventId, name });

// Join a group directly (if OPEN)
export const joinGroup = (groupId) =>
  api.post(`/groups/${groupId}/join`);

// Request to join a group
export const requestToJoin = (groupId) =>
  api.post(`/groups/${groupId}/request`);

// Accept a join request (leader only)
export const acceptJoinRequest = (groupId, userId) =>
  api.post(`/groups/${groupId}/accept/${userId}`);

// Reject a join request (leader only)
export const rejectJoinRequest = (groupId, userId) =>
  api.post(`/groups/${groupId}/reject/${userId}`);

// Invite a user to a group (leader only)
export const inviteUser = (groupId, userId) =>
  api.post(`/groups/${groupId}/invite`, { userId });

// Accept a pending group invite
export const acceptInvite = (groupId) =>
  api.post(`/groups/${groupId}/accept`);

// Leave a group
export const leaveGroup = (groupId) =>
  api.post(`/groups/${groupId}/leave`);

// Get all groups for a specific event
export const getGroupsByEvent = (eventId) =>
  api.get(`/groups/event/${eventId}`);

// Get all groups the current user belongs to
export const getMyGroups = () =>
  api.get('/groups/my');

// Register group for event (leader only, LOCKS group)
// We still supply this method mapping if we want to call the group endpoint,
// although the proper way to fully register is through eventService.registerForEvent
export const finalizeGroup = (groupId) =>
  api.post(`/groups/${groupId}/register`);

export const registerGroup = (groupId) =>
  api.post(`/groups/${groupId}/register`);
