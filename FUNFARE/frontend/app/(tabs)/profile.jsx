// app/(tabs)/profile.jsx
import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { logout, getUser } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingCount, setBookingCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Try local cached user first
      let userData = await getUser();

      // Always refresh from backend when authenticated
      if (token) {
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          userData = response.data;
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (err) {
          console.log('Could not fetch user from backend:', err.message);
        }
      }

      setUser(userData);

      // Load booking count from backend
      if (token) {
        try {
          const bookingsRes = await api.get('/bookings/my', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBookingCount(bookingsRes.data.length || 0);
        } catch {
          // Fall back to local count
          const bookings = await AsyncStorage.getItem('bookings');
          setBookingCount(bookings ? JSON.parse(bookings).length : 0);
        }
      }

      const saved = await AsyncStorage.getItem('saved_activities');
      setSavedCount(saved ? JSON.parse(saved).length : 0);

    } catch (err) {
      console.log('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'bookings', 'saved_activities']);
    router.replace('/(auth)/login');
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} color="#FF6B35" size="large" />;
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Not logged in</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.loginBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const emailAlias = user.email?.split('@')[0]?.replace(/[._]/g, ' ');
  const normalizedName = user.name?.trim();
  const displayName =
    !normalizedName || normalizedName.toLowerCase() === 'test user'
      ? emailAlias || 'FunFare User'
      : normalizedName;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user.email || ''}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{bookingCount}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{savedCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/saved')}
        >
          <Text style={styles.menuIcon}>🎟️</Text>
          <Text style={styles.menuText}>My Bookings</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/saved')}
        >
          <Text style={styles.menuIcon}>❤️</Text>
          <Text style={styles.menuText}>Saved Activities</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/activity/compare')}
        >
          <Text style={styles.menuIcon}>⚖️</Text>
          <Text style={styles.menuText}>Compare Activities</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/ai-suggestions')}
        >
          <Text style={styles.menuIcon}>✨</Text>
          <Text style={styles.menuText}>AI Suggestions</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/map')}
        >
          <Text style={styles.menuIcon}>🗺️</Text>
          <Text style={styles.menuText}>Activity Map</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#888', fontSize: 16, marginBottom: 16 },
  loginBtn: { backgroundColor: '#FF6B35', padding: 14, borderRadius: 10 },
  loginBtnText: { color: '#fff', fontWeight: 'bold' },
  header: {
    backgroundColor: '#FF6B35', alignItems: 'center',
    paddingTop: 60, paddingBottom: 30,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff', justifyContent: 'center',
    alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#FF6B35' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: '#FFE0D0', marginTop: 4 },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    margin: 16, borderRadius: 12, padding: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35' },
  statLabel: { color: '#888', fontSize: 13, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#eee' },
  menu: {
    backgroundColor: '#fff', marginHorizontal: 16,
    borderRadius: 12, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderColor: '#f0f0f0',
  },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuText: { flex: 1, fontSize: 15, color: '#333' },
  menuArrow: { color: '#aaa', fontSize: 16 },
  logoutBtn: {
    margin: 16, backgroundColor: '#fff', padding: 16,
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FF6B35', marginBottom: 40,
  },
  logoutText: { color: '#FF6B35', fontWeight: 'bold', fontSize: 16 },
});