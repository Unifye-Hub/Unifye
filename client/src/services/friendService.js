import api from './api';

export const sendFriendRequest = (userId) => api.post(`/friends/request/${userId}`);
export const acceptFriendRequest = (userId) => api.post(`/friends/accept/${userId}`);
export const rejectFriendRequest = (userId) => api.post(`/friends/reject/${userId}`);
export const getFriends = () => api.get('/friends');
export const getFriendRequests = () => api.get('/friends/requests');
export const getFriendStatus = (userId) => api.get(`/friends/status/${userId}`);
