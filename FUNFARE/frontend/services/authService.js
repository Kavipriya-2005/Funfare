import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SIGNUP
export const signup = async (name, email, password) => {
  const res = await api.post('/auth/signup', { name, email, password });

  const { token, user } = res.data;
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  return res.data;
};

// LOGIN
export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });

  const { token, user } = res.data;
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  return res.data;
};

// LOGOUT
export const logout = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

// GET LOGGED IN USER
export const getUser = async () => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// CHECK IF LOGGED IN
export const isLoggedIn = async () => {
  const token = await AsyncStorage.getItem('token');
  return !!token;
};