import api from './api';

// Create a group for an event
export const createGroup = (eventId, name) =>
  api.post('/groups/create', { eventId, name });

// Join a group by its ID
export const joinGroup = (groupId) =>
  api.post(`/groups/${groupId}/join`);

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

// Finalize (lock) a group — leader confirms their team is ready
export const finalizeGroup = (groupId) =>
  api.post(`/groups/${groupId}/finalize`);
