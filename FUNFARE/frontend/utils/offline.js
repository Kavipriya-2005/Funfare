import AsyncStorage from '@react-native-async-storage/async-storage';

// Save an activity for offline access
export const saveActivity = async (activity) => {
  const saved = await getSavedActivities();
  const updated = [...saved.filter(a => a._id !== activity._id), activity];
  await AsyncStorage.setItem('saved_activities', JSON.stringify(updated));
};

// Get all saved activities
export const getSavedActivities = async () => {
  const data = await AsyncStorage.getItem('saved_activities');
  return data ? JSON.parse(data) : [];
};

// Remove a saved activity
export const removeActivity = async (id) => {
  const saved = await getSavedActivities();
  const updated = saved.filter(a => a._id !== id);
  await AsyncStorage.setItem('saved_activities', JSON.stringify(updated));
};