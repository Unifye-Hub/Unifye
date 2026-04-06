import api from './api';

// Auth
export const login = (data) => api.post('/auth/login', data);
export const signup = (data) => api.post('/auth/signup', data);

// Profile
export const getMyProfile = () => api.get('/profile/me');
export const getPublicProfile = (id) => api.get(`/profile/public/${id}`);
export const updateProfile = (data) => {
  const config = data instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : {};
  return api.put('/profile/update', data, config);
};

// Events
export const getAllEvents = (params) => api.get('/events', { params });
export const getEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateEvent = (id, data) => api.put(`/events/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Registrations
export const registerForEvent = (id) => api.post(`/events/${id}/register`);
export const getEventParticipants = (id) => api.get(`/events/${id}/participants`);

// Reviews
export const createReview = (id, data) => api.post(`/events/${id}/reviews`, data);
export const getOrganizerReviews = (id) => api.get(`/organizers/${id}/reviews`);
