// app/(tabs)/saved.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function Saved() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // useFocusEffect reloads every time you navigate to this tab
  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  const filterValidBookings = (list) =>
    (list || []).filter((item) => item.activity?.name || item.activityName);

  const loadBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (token) {
        // ── Load from MongoDB if logged in ──
        const response = await api.get('/bookings/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(filterValidBookings(response.data));
      } else {
        // ── Fall back to AsyncStorage if not logged in ──
        const local = await AsyncStorage.getItem('bookings');
        setBookings(filterValidBookings(local ? JSON.parse(local) : []));
      }
    } catch (error) {
      console.log('Load bookings error:', error.message);
      // If backend fails, show local bookings
      const local = await AsyncStorage.getItem('bookings');
      setBookings(filterValidBookings(local ? JSON.parse(local) : []));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const renderBooking = ({ item }) => {
    // Handle both MongoDB populated format and local AsyncStorage format
    const name = item.activity?.name || item.activityName || 'Unknown activity';
    const category = item.activity?.category || item.activityCategory || '';
    const location = item.activity?.locationText || item.locationText || '';
    const price = item.totalPrice ?? 0;
    const code = item.confirmationCode || 'N/A';
    const date = item.bookingDate
      ? new Date(item.bookingDate).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
        })
      : '';
    const isCancelled = item.status === 'cancelled';

    return (
      <View style={[styles.card, isCancelled && styles.cardCancelled]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
          <View style={[
            styles.statusBadge,
            isCancelled ? styles.statusCancelled : styles.statusConfirmed
          ]}>
            <Text style={[
              styles.statusText,
              isCancelled ? styles.statusTextCancelled : styles.statusTextConfirmed
            ]}>
              {isCancelled ? 'Cancelled' : 'Confirmed'}
            </Text>
          </View>
        </View>

        {category ? (
          <Text style={styles.cardMeta}>{category} · {location}</Text>
        ) : null}

        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Confirmation</Text>
            <Text style={styles.detailValue}>{code}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tickets</Text>
            <Text style={styles.detailValue}>{item.tickets || 1}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.detailValue}>₹{price.toFixed(2)}</Text>
          </View>
        </View>

        {date ? <Text style={styles.cardDate}>📅 {date}</Text> : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>{bookings.length} total</Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🎟️</Text>
          <Text style={styles.emptyText}>No bookings yet</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.exploreBtnText}>Find something fun</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id?.toString()}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B35"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#eee',
  },
  cardCancelled: { opacity: 0.6 },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusConfirmed: { backgroundColor: '#e8f5e9' },
  statusCancelled: { backgroundColor: '#fce4ec' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextConfirmed: { color: '#2e7d32' },
  statusTextCancelled: { color: '#c62828' },
  cardMeta: { fontSize: 13, color: '#888', marginBottom: 14 },
  cardDetails: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#f8f7ff', borderRadius: 10, padding: 12, marginBottom: 10,
  },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  cardDate: { fontSize: 12, color: '#aaa' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#666' },
  exploreBtn: {
    backgroundColor: '#FF6B35', borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 10, marginTop: 6,
  },
  exploreBtnText: { color: '#fff', fontWeight: '600' },
});