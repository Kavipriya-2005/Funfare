import api from './api';

// Get all activities with filters
export const getActivities = async (filters = {}) => {
  const { budget, radius, type, ageGroup } = filters;
  const res = await api.get('/activities', {
    params: {
      budget: budget !== 100 ? budget : undefined,
      radius,
      type: type !== 'All' ? type : undefined,
      ageGroup: ageGroup !== 'All ages' ? ageGroup : undefined,
    },
  });
  return res.data;
};

// Get single activity by ID
export const getActivityById = async (id) => {
  const res = await api.get(`/activities/${id}`);
  return res.data;
};