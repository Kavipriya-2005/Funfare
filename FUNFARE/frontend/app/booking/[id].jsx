// app/booking/[id].jsx
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [tickets, setTickets] = useState(1);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'No activity ID provided.');
      router.back();
      return;
    }
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      const response = await api.get(`/activities/${id}`);
      setActivity(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load activity details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!activity) return;
    setBooking(true);

    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Please log in', 'You need to be logged in to book.');
        router.replace('/(auth)/login');
        return;
      }

      // ── Save to MongoDB via backend ──
      const response = await api.post(
        '/bookings',
        {
          activityId: activity._id,
          bookingDate: new Date().toISOString(),
          tickets,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const savedBooking = response.data.booking;

      // ── Also save to AsyncStorage for offline access ──
      const existing = await AsyncStorage.getItem('bookings');
      const localBookings = existing ? JSON.parse(existing) : [];
      localBookings.unshift({
        _id: savedBooking._id,
        activityId: activity._id,
        activityName: activity.name,
        activityCategory: activity.category,
        locationText: activity.locationText || '',
        tickets,
        totalPrice: savedBooking.totalPrice,
        confirmationCode: savedBooking.confirmationCode,
        bookingDate: savedBooking.bookingDate,
        status: 'confirmed',
      });
      await AsyncStorage.setItem('bookings', JSON.stringify(localBookings));

      setConfirmed(savedBooking);

   } catch (error) {
  console.log('Booking error FULL:', JSON.stringify(error.response?.data), 'Status:', error.response?.status, 'Message:', error.message);

      // If backend fails, fall back to local-only booking
      if (error.response?.status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/(auth)/login');
        return;
      }

      // Fallback: save locally if backend is unreachable
      const fallbackCode = 'LOCAL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const fallbackBooking = {
        _id: `local_${Date.now()}`,
        activityName: activity.name,
        tickets,
        totalPrice: (activity.price || 0) * tickets,
        confirmationCode: fallbackCode,
        bookingDate: new Date().toISOString(),
        status: 'confirmed',
      };

      const existing = await AsyncStorage.getItem('bookings');
      const localBookings = existing ? JSON.parse(existing) : [];
      localBookings.unshift(fallbackBooking);
      await AsyncStorage.setItem('bookings', JSON.stringify(localBookings));

      setConfirmed(fallbackBooking);
      Alert.alert(
        'Saved locally',
        'Could not reach server — your booking was saved on this device.'
      );
    } finally {
      setBooking(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // ── Guard ──
  if (!activity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Activity not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Confirmation screen ──
  if (confirmed) {
    const totalPrice = confirmed.totalPrice ?? 0;
    const totalLabel = totalPrice === 0 ? 'FREE' : `₹${totalPrice.toFixed(2)}`;
    return (
      <View style={styles.confirmedContainer}>
        <Text style={styles.confirmedEmoji}>🎉</Text>
        <Text style={styles.confirmedTitle}>You're booked!</Text>
        <Text style={styles.confirmedSubtitle}>{activity.name}</Text>

        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationLabel}>CONFIRMATION CODE</Text>
          <Text style={styles.confirmationCode}>{confirmed.confirmationCode}</Text>
          <View style={styles.divider} />
          <Text style={styles.confirmationDetail}>
            {tickets} ticket{tickets > 1 ? 's' : ''} · {totalLabel} total
          </Text>
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.replace('/(tabs)/saved')}
        >
          <Text style={styles.doneButtonText}>View my bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.replace('/(tabs)/explore')}
        >
          <Text style={styles.exploreButtonText}>Back to explore</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main booking screen ──
  const pricePerTicket = activity.price || 0;
  const totalPrice = pricePerTicket * tickets;
  const priceLabel = pricePerTicket === 0 ? 'FREE' : `₹${pricePerTicket.toFixed(2)}`;
  const totalLabel = totalPrice === 0 ? 'FREE' : `₹${totalPrice.toFixed(2)}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Book tickets</Text>

      {/* Activity summary */}
      <View style={styles.activityCard}>
        <Text style={styles.activityName}>{activity.name}</Text>
        <Text style={styles.activityMeta}>
          {activity.category} · {activity.locationText || 'Location TBD'}
        </Text>
        <Text style={styles.activityMeta}>
          ⭐ {activity.rating?.toFixed(1) || 'N/A'} · {activity.reviewCount || 0} reviews
        </Text>
      </View>

      {/* Ticket picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Number of tickets</Text>
        <View style={styles.ticketRow}>
          <TouchableOpacity
            style={styles.ticketBtn}
            onPress={() => setTickets(t => Math.max(1, t - 1))}
          >
            <Text style={styles.ticketBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.ticketCount}>{tickets}</Text>
          <TouchableOpacity
            style={styles.ticketBtn}
            onPress={() => setTickets(t => Math.min(10, t + 1))}
          >
            <Text style={styles.ticketBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Price summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price summary</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            {priceLabel} × {tickets} ticket{tickets > 1 ? 's' : ''}
          </Text>
          <Text style={styles.priceValue}>{totalLabel}</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{totalLabel}</Text>
        </View>
      </View>

      <View style={styles.mockNotice}>
        <Text style={styles.mockNoticeText}>
          🔒 Mock booking — no real payment charged
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.bookButton, booking && styles.bookButtonDisabled]}
        onPress={handleBook}
        disabled={booking}
      >
        {booking
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.bookButtonText}>
              Confirm booking · {totalLabel}
            </Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  content: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, color: '#666' },
  backLink: { color: '#FF6B35', fontWeight: '600' },
  backButton: { marginBottom: 16 },
  backButtonText: { color: '#FF6B35', fontSize: 15 },
  screenTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a2e', marginBottom: 20 },
  activityCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: '#eee',
  },
  activityName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  activityMeta: { fontSize: 13, color: '#666', marginTop: 2 },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#eee',
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 14 },
  ticketRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 24,
  },
  ticketBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff0eb', justifyContent: 'center', alignItems: 'center',
  },
  ticketBtnText: { fontSize: 22, color: '#FF6B35', fontWeight: '600' },
  ticketCount: {
    fontSize: 24, fontWeight: '700', color: '#1a1a2e',
    minWidth: 36, textAlign: 'center',
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { color: '#666', fontSize: 14 },
  priceValue: { color: '#1a1a2e', fontSize: 14 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontWeight: '700', fontSize: 15, color: '#1a1a2e' },
  totalValue: { fontWeight: '700', fontSize: 15, color: '#FF6B35' },
  mockNotice: {
    backgroundColor: '#fff8e7', borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#ffe0a0',
  },
  mockNoticeText: { fontSize: 13, color: '#7a5c00', textAlign: 'center' },
  bookButton: {
    backgroundColor: '#FF6B35', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  bookButtonDisabled: { opacity: 0.6 },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  confirmedContainer: {
    flex: 1, backgroundColor: '#f8f7ff',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  confirmedEmoji: { fontSize: 60, marginBottom: 16 },
  confirmedTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  confirmedSubtitle: {
    fontSize: 16, color: '#666', marginBottom: 28, textAlign: 'center',
  },
  confirmationCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: '#eee', marginBottom: 28,
  },
  confirmationLabel: { fontSize: 11, color: '#999', letterSpacing: 1.5, marginBottom: 8 },
  confirmationCode: {
    fontSize: 24, fontWeight: '800', color: '#FF6B35', letterSpacing: 2,
  },
  divider: { height: 1, backgroundColor: '#eee', width: '80%', marginVertical: 16 },
  confirmationDetail: { fontSize: 14, color: '#666' },
  doneButton: {
    backgroundColor: '#FF6B35', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 40, marginBottom: 12,
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  exploreButton: { paddingVertical: 10 },
  exploreButtonText: { color: '#FF6B35', fontSize: 15 },
});