import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getActivities } from '../../services/activityService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Compare() {
  const router = useRouter();
  const { preselect } = useLocalSearchParams();
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const compareStorageKey = 'compare_activities';

  useEffect(() => {
    getActivities()
      .then(data => setActivities(Array.isArray(data) ? data : []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Hydrate initial selection from AsyncStorage + optionally preselect via URL:
    // /activity/compare?preselect=<id>
    if (loading) return;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(compareStorageKey);
        const parsed = stored ? JSON.parse(stored) : [];
        const storedList = Array.isArray(parsed) ? parsed : [];

        const byId = new Map((activities || []).map(a => [a?._id, a]).filter(([id]) => !!id));

        let hydrated = storedList
          .map((a) => byId.get(a?._id) || a)
          .filter((a) => a && a._id);

        const preselectId = Array.isArray(preselect) ? preselect[0] : preselect;
        if (preselectId && !hydrated.some((a) => a._id === preselectId)) {
          const pre = byId.get(preselectId);
          if (pre) hydrated = [pre, ...hydrated];
        }

        setSelected(hydrated.slice(0, 3));
      } catch {
        setSelected([]);
      }
    })();
  }, [loading, activities, preselect]);

  useEffect(() => {
    // Persist selection so it survives navigation / refresh.
    (async () => {
      try {
        await AsyncStorage.setItem(compareStorageKey, JSON.stringify(selected.slice(0, 3)));
      } catch {
        // no-op
      }
    })();
  }, [selected]);

  const isSelected = (id) => selected.some(a => a._id === id);

  const toggleSelect = (activity) => {
    if (isSelected(activity._id)) {
      const next = selected.filter(a => a._id !== activity._id);
      setSelected(next);
    } else {
      if (selected.length >= 3) return;
      const next = [...selected, activity];
      setSelected(next);
    }
  };

  // Returns the _id of the activity with the best value for a field
  const getBest = (field) => {
    if (selected.length === 0) return null;
    if (field === 'price') {
      // Best price = lowest (free is best)
      return selected.reduce((best, a) =>
        (a.price ?? 999) < (best.price ?? 999) ? a : best
      )._id;
    }
    if (field === 'rating') {
      return selected.reduce((best, a) =>
        (a.rating ?? 0) > (best.rating ?? 0) ? a : best
      )._id;
    }
    if (field === 'distance') {
      return selected.reduce((best, a) =>
        (a.distance ?? 999) < (best.distance ?? 999) ? a : best
      )._id;
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚖️ Compare</Text>
        <Text style={styles.counter}>{selected.length}/3</Text>
      </View>

      <Text style={styles.hint}>
        {selected.length === 0
          ? 'Select up to 3 activities to compare'
          : selected.length < 2
          ? 'Select at least 2 to compare'
          : 'Scroll down to see comparison ↓'}
      </Text>

      {/* Activity Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectorRow}
      >
        {activities.map((activity) => (
          <TouchableOpacity
            key={activity._id}
            style={[
              styles.selectorCard,
              isSelected(activity._id) && styles.selectorCardActive,
              selected.length >= 3 && !isSelected(activity._id) && styles.selectorCardDisabled,
            ]}
            onPress={() => toggleSelect(activity)}
          >
            <Text style={styles.selectorEmoji}>
              {activity.type === 'Outdoor' ? '🌳' :
               activity.type === 'Museum' ? '🏛️' : '🎡'}
            </Text>
            <Text style={[
              styles.selectorName,
              isSelected(activity._id) && styles.selectorNameActive
            ]}>
              {activity.name}
            </Text>
            {isSelected(activity._id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Comparison Table */}
      {selected.length >= 2 && (
        <ScrollView style={styles.tableContainer}>
          <Text style={styles.tableTitle}>📊 Side-by-Side Comparison</Text>

          {/* Column Headers */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel} />
            {selected.map((a) => (
              <View key={a._id} style={styles.tableHeader}>
                <Text style={styles.tableHeaderEmoji}>
                  {a.type === 'Outdoor' ? '🌳' :
                   a.type === 'Museum' ? '🏛️' : '🎡'}
                </Text>
                <Text style={styles.tableHeaderName} numberOfLines={2}>
                  {a.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Price Row */}
          <CompareRow
            label="💰 Price"
            values={selected.map((a) => ({
              id: a._id,
              text: a.price === 0 ? 'FREE' : `₹${a.price}`,
              isBest: getBest('price') === a._id,
            }))}
          />

          {/* Rating Row */}
          <CompareRow
            label="⭐ Rating"
            values={selected.map((a) => ({
              id: a._id,
              text: `${a.rating ?? 'N/A'}/5`,
              isBest: getBest('rating') === a._id,
            }))}
          />

          {/* Distance Row */}
          <CompareRow
            label="📍 Distance"
            values={selected.map((a) => ({
              id: a._id,
              text: a.distance ? `${a.distance} mi` : 'N/A',
              isBest: getBest('distance') === a._id,
            }))}
          />

          {/* Type Row */}
          <CompareRow
            label="🏷️ Type"
            values={selected.map((a) => ({
              id: a._id,
              text: a.type || a.category || 'N/A',
              isBest: false,
            }))}
          />

          {/* Age Group Row */}
          <CompareRow
            label="👨‍👩‍👧 Age"
            values={selected.map((a) => ({
              id: a._id,
              text: a.ageGroup || 'All ages',
              isBest: false,
            }))}
          />

          {/* Location Row */}
          <CompareRow
            label="📍 Location"
            values={selected.map((a) => ({
              id: a._id,
              text: a.locationText || 'Nearby',
              isBest: false,
            }))}
          />

          {/* Book Buttons */}
          <Text style={styles.tableTitle}>Ready to Book?</Text>
          <View style={styles.bookRow}>
            {selected.map((a) => (
              <TouchableOpacity
                key={a._id}
                style={styles.bookBtn}
                onPress={() => router.push(`/booking/${a._id}`)}
              >
                <Text style={styles.bookBtnText}>
                  Book{'\n'}{a.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Empty state */}
      {activities.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>No activities found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Go back to Explore</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function CompareRow({ label, values }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      {values.map((v) => (
        <View
          key={v.id}
          style={[styles.tableCell, v.isBest && styles.tableCellBest]}
        >
          <Text style={[
            styles.tableCellText,
            v.isBest && styles.tableCellTextBest
          ]}>
            {v.text}
          </Text>
          {v.isBest && <Text style={styles.bestTag}>Best</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', gap: 12, padding: 20,
  },
  loadingText: { color: '#888', fontSize: 14 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#666' },
  backLink: { color: '#FF6B35', fontWeight: '600', fontSize: 15 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderColor: '#eee', marginTop: 40,
  },
  backText: { color: '#FF6B35', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  counter: { color: '#FF6B35', fontWeight: 'bold', fontSize: 16 },
  hint: { textAlign: 'center', color: '#888', padding: 10, fontSize: 13 },
  selectorRow: { paddingHorizontal: 16, paddingVertical: 8, maxHeight: 130 },
  selectorCard: {
    width: 100, borderRadius: 12, padding: 10,
    marginRight: 10, alignItems: 'center',
    backgroundColor: '#f9f9f9', borderWidth: 2, borderColor: '#f0f0f0',
  },
  selectorCardActive: { borderColor: '#FF6B35', backgroundColor: '#FFF0EB' },
  selectorCardDisabled: { opacity: 0.4 },
  selectorEmoji: { fontSize: 28 },
  selectorName: {
    fontSize: 11, textAlign: 'center',
    color: '#555', marginTop: 4,
  },
  selectorNameActive: { color: '#FF6B35', fontWeight: '600' },
  checkmark: { color: '#FF6B35', fontWeight: 'bold', marginTop: 4 },
  tableContainer: { flex: 1, padding: 16 },
  tableTitle: {
    fontSize: 16, fontWeight: 'bold',
    color: '#333', marginVertical: 12,
  },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderColor: '#f0f0f0', paddingVertical: 10,
  },
  tableLabel: {
    width: 80, fontSize: 12, color: '#888',
    justifyContent: 'center', paddingTop: 4,
  },
  tableHeader: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  tableHeaderEmoji: { fontSize: 24 },
  tableHeaderName: {
    fontSize: 11, textAlign: 'center',
    fontWeight: '600', color: '#333', marginTop: 4,
  },
  tableCell: { flex: 1, alignItems: 'center', padding: 6, borderRadius: 8 },
  tableCellBest: { backgroundColor: '#FFF0EB' },
  tableCellText: { fontSize: 13, color: '#555', textAlign: 'center' },
  tableCellTextBest: { color: '#FF6B35', fontWeight: 'bold' },
  bestTag: { fontSize: 9, color: '#FF6B35', fontWeight: 'bold', marginTop: 2 },
  bookRow: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  bookBtn: {
    flex: 1, backgroundColor: '#FF6B35', padding: 12,
    borderRadius: 10, alignItems: 'center',
  },
  bookBtnText: {
    color: '#fff', fontWeight: 'bold',
    fontSize: 12, textAlign: 'center',
  },
});