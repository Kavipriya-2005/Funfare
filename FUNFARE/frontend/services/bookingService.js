import api from './api';

// Create a new booking
export const createBooking = async (bookingData) => {
  const res = await api.post('/bookings', bookingData);
  return res.data;
};

// Get all my bookings
export const getMyBookings = async () => {
  const res = await api.get('/bookings/my');
  return res.data;
};

// Cancel a booking
export const cancelBooking = async (id) => {
  const res = await api.put(`/bookings/${id}/cancel`);
  return res.data;
};