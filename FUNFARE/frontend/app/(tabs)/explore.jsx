import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import FilterSheet from '../../components/FilterSheet';
import { getActivities } from '../../services/activityService';

export default function Explore() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    budget: 100, radius: 50, type: 'All', ageGroup: 'All ages'
  });

  useFocusEffect(
    useCallback(() => {
      fetchActivities(filters);
    }, [])
  );

  const fetchActivities = async (currentFilters) => {
    try {
      setError(null);
      const data = await getActivities(currentFilters);
      setActivities(data);
    } catch (error) {
  if (error.response?.status === 401) {
    await AsyncStorage.multiRemove(['token', 'user']);
    router.replace('/(auth)/login');
    return;
  }
}
     finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilter(false);
    setLoading(true);
    fetchActivities(newFilters);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities(filters);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/activity/${item._id}`)}
    >
      <View style={styles.cardImageWrapper}>
        <Image
          source={{ uri: item.images?.[0] || item.image || 'https://via.placeholder.com/300' }}
          style={styles.cardImage}
        />
        <View style={styles.cardTitleOverlay}>
          <Text style={styles.cardTitleText} numberOfLines={1}>{item.name}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.cardSubtitle}>{item.type} • {item.distance} miles</Text>
        <View style={styles.cardBottomRow}>
          <Text style={styles.price}>{item.price === 0 ? 'FREE' : `₹${item.price}`}</Text>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Explore</Text>
     <View style={styles.headerBtns}>
  {/* ← Add this button */}
  <TouchableOpacity
    style={styles.mapBtn}
    onPress={() => router.push('/map')}
  >
    <Text style={styles.mapBtnText}>🗺️ Map</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.aiBtn}
    onPress={() => router.push('/ai-suggestions')}
  >
    <Text style={styles.aiBtnText}>✨ AI Pick</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.compareBtn}
    onPress={() => router.push('/activity/compare')}
  >
    <Text style={styles.compareBtnText}>⚖️ Compare</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.filterBtn}
    onPress={() => setShowFilter(true)}
  >
    <Text style={styles.filterText}>⚙️ Filter</Text>
  </TouchableOpacity>
</View>
      </View>

      {/* Filter Summary */}
      <View style={styles.filterSummary}>
        <Text style={styles.filterSummaryText}>
          Budget: {filters.budget === 0 ? 'Free' : `₹0-₹${filters.budget}`} •
          Within {filters.radius}mi •
          {filters.type !== 'All' ? ` ${filters.type}` : ' All types'}
        </Text>
        <Text style={styles.resultCount}>{activities.length} found</Text>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Finding activities...</Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchActivities(filters)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {!loading && !error && (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No activities match your filters</Text>
              <TouchableOpacity onPress={() => applyFilters({ budget: 100, radius: 50, type: 'All', ageGroup: 'All ages' })}>
                <Text style={styles.emptyReset}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <FilterSheet
        visible={showFilter}
        filters={filters}
        onApply={applyFilters}
        onClose={() => setShowFilter(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1,
    borderColor: '#eee', marginTop: 40
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FF6B35' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  filterBtn: { backgroundColor: '#FFF0EB', padding: 8, borderRadius: 8 },
  filterText: { color: '#FF6B35', fontWeight: '600' },
  compareBtn: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8 },
  compareBtnText: { color: '#555', fontWeight: '600' },
  filterSummary: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f0f0f0'
  },
  filterSummaryText: { color: '#888', fontSize: 12, flex: 1 },
  resultCount: { color: '#FF6B35', fontWeight: '600', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 15 },
  errorEmoji: { fontSize: 48 },
  errorText: { color: '#e74c3c', textAlign: 'center', marginTop: 12, paddingHorizontal: 32 },
  retryBtn: { marginTop: 16, backgroundColor: '#FF6B35', padding: 12, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 12,
    elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.08, shadowRadius: 4
  },
  cardImageWrapper: { width: '100%', borderRadius: 20, overflow: 'hidden' },
  cardImage: { width: '100%', height: 160 },
  cardTitleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  cardTitleText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardMeta: { padding: 14, backgroundColor: '#fff', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  cardSubtitle: { color: '#666', fontSize: 13, marginBottom: 8 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardEmoji: { fontSize: 36, marginRight: 12 },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  type: { color: '#888', fontSize: 13, marginTop: 2 },
  age: { color: '#888', fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  price: { fontSize: 15, fontWeight: 'bold', color: '#FF6B35' },
  rating: { color: '#555', fontSize: 13, marginTop: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: '#aaa', fontSize: 16, marginTop: 12 },
  emptyReset: { color: '#FF6B35', fontWeight: '600', marginTop: 12, fontSize: 15 },
  aiBtn: { backgroundColor: '#1a1a2e', padding: 8, borderRadius: 8 },
  aiBtnText: { color: '#fff', fontWeight: '600' },
  mapBtn: { backgroundColor: '#e8f5e9', padding: 8, borderRadius: 8 },
  mapBtnText: { color: '#2e7d32', fontWeight: '600' },
});