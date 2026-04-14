import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

// Leaflet map component for web
const LeafletMap = ({ activities, userLocation }) => {
  const mapId = 'leaflet-map';

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Load Leaflet CSS
    const existingLink = document.getElementById('leaflet-css');
    if (!existingLink) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS then initialize map
    const existingScript = document.getElementById('leaflet-js');
    const initMap = () => {
      const L = window.L;
      if (!L) return;

      // Destroy existing map if any
      const container = document.getElementById(mapId);
      if (!container) return;
      if (container._leaflet_id) {
        container._leaflet_id = null;
      }

      const centerLat = userLocation?.latitude || 13.0827;
      const centerLng = userLocation?.longitude || 80.2707;

      const map = L.map(mapId).setView([centerLat, centerLng], 13);

      // Add OpenStreetMap tiles (completely free)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add user location marker
      if (userLocation) {
        const userIcon = L.divIcon({
          html: `<div style="
            background:#4285f4; width:16px; height:16px;
            border-radius:50%; border:3px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,0.4);
          "></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>📍 You are here</b>');
      }

      // Add activity markers
      activities
        .filter(a => a.latitude && a.longitude)
        .forEach(activity => {
          const priceLabel = activity.price === 0 ? 'FREE' : `₹${activity.price}`;
          const bgColor = activity.price === 0 ? '#2e7d32' : '#FF6B35';

              const destination = activity.latitude && activity.longitude
            ? `${activity.latitude},${activity.longitude}`
            : encodeURIComponent(activity.locationText || activity.name || '');
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

          const icon = L.divIcon({
            html: `<div style="
              background:${bgColor}; color:#fff;
              padding:4px 8px; border-radius:12px;
              font-size:12px; font-weight:700;
              white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3);
              border:2px solid #fff;
            ">${priceLabel}</div>`,
            className: '',
            iconAnchor: [20, 10],
          });

          const emoji =
            activity.type === 'Outdoor' ? '🌳' :
            activity.type === 'Museum' ? '🏛️' :
            activity.category === 'arts' ? '🎨' :
            activity.category === 'food' ? '🍽️' : '🎡';

          L.marker([activity.latitude, activity.longitude], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width:180px; font-family:sans-serif;">
                <div style="font-size:20px; margin-bottom:4px;">${emoji}</div>
                <b style="font-size:14px;">${activity.name}</b><br/>
                <span style="color:#888; font-size:12px;">
                  ${activity.locationText || ''}
                </span><br/>
                <span style="color:${bgColor}; font-weight:700;">
                  ${activity.price === 0 ? '🆓 Free' : `💰 ₹${activity.price}`}
                </span>
                &nbsp;·&nbsp;
                <span>⭐ ${activity.rating}</span><br/>
                <a href="/activity/${activity._id}"
                   style="color:#FF6B35; font-size:12px; margin-top:6px; display:inline-block;">
                  View details →
                </a>
                <br/>
                <a href="${directionsUrl}"
                   target="_blank"
                   rel="noreferrer"
                   style="color:#1a73e8; font-size:12px; margin-top:4px; display:inline-block;">
                  🧭 Directions
                </a>
              </div>
            `);
        });
    };

    if (existingScript) {
      // Script already loaded
      setTimeout(initMap, 100);
    } else {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(initMap, 100);
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup map on unmount
      const container = document.getElementById(mapId);
      if (container && container._leaflet_id) {
        container._leaflet_id = null;
      }
    };
  }, [activities, userLocation]);

  return (
    <div
      id={mapId}
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
    />
  );
};

export default function MapScreen() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get location (web browser)
      if (Platform.OS === 'web' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
          () => setUserLocation({ latitude: 13.0827, longitude: 80.2707 })
        );
      } else {
        setUserLocation({ latitude: 13.0827, longitude: 80.2707 });
      }

      // Fetch activities
      const response = await api.get('/activities');
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.activities || []);
      const withCoords = list.filter(a => a.latitude && a.longitude);
      setActivities(withCoords);

    } catch (error) {
      console.log('Map error:', error.message);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const openDirections = async (activity) => {
    if (!activity) return;
    const destination = activity.latitude && activity.longitude
      ? `${activity.latitude},${activity.longitude}`
      : encodeURIComponent(activity.locationText || activity.name || '');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('Could not open directions', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // No activities with coordinates
  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Map</Text>
          <Text style={styles.headerCount}>0 spots</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyText}>No activities with location data.</Text>
          <Text style={styles.emptySubtext}>
            Run the seed script to add activities with coordinates.
          </Text>
          <TouchableOpacity
            style={styles.seedHint}
            onPress={() => router.back()}
          >
            <Text style={styles.seedHintText}>← Go back to Explore</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ Activity Map</Text>
        <Text style={styles.headerCount}>{activities.length} spots</Text>
      </View>

      {/* Map — full height */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <LeafletMap
            activities={activities}
            userLocation={userLocation}
          />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              Map available on mobile with react-native-maps
            </Text>
          </View>
        )}
      </View>

      {/* Activity list below map */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>📍 {activities.length} activities nearby</Text>
        {activities.map(activity => (
          <TouchableOpacity
            key={activity._id}
            style={[
              styles.listItem,
              selectedActivity?._id === activity._id && styles.listItemSelected
            ]}
            onPress={() => {
              setSelectedActivity(activity);
              router.push(`/activity/${activity._id}`);
            }}
          >
            <Text style={styles.listEmoji}>
              {activity.type === 'Outdoor' ? '🌳' :
               activity.type === 'Museum' ? '🏛️' :
               activity.category === 'arts' ? '🎨' : '🎡'}
            </Text>
            <View style={styles.listInfo}>
              <Text style={styles.listName} numberOfLines={1}>
                {activity.name}
              </Text>
              <Text style={styles.listLocation} numberOfLines={1}>
                {activity.locationText}
              </Text>
            </View>
            <View style={styles.listRight}>
              <Text style={styles.listPrice}>
                {activity.price === 0 ? 'FREE' : `₹${activity.price}`}
              </Text>
              <TouchableOpacity
                style={styles.mapDirectionsButton}
                onPress={(event) => {
                  event.stopPropagation();
                  openDirections(activity);
                }}
              >
                <Text style={styles.mapDirectionsText}>🧭</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', gap: 10, padding: 20,
  },
  loadingText: { color: '#888', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
    zIndex: 10,
  },
  backBtn: { color: '#FF6B35', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  headerCount: { fontSize: 13, color: '#888' },
  mapContainer: {
    height: 380, borderBottomWidth: 1, borderColor: '#eee',
  },
  listContainer: {
    flex: 1, backgroundColor: '#fff', padding: 12,
  },
  listTitle: {
    fontSize: 14, fontWeight: '700', color: '#1a1a2e',
    marginBottom: 10, paddingBottom: 8,
    borderBottomWidth: 1, borderColor: '#eee',
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1,
    borderColor: '#f5f5f5',
  },
  listItemSelected: { backgroundColor: '#fff8f5' },
  listEmoji: { fontSize: 24, marginRight: 10 },
  listInfo: { flex: 1 },
  listName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  listLocation: { fontSize: 12, color: '#888', marginTop: 2 },
  listRight: { alignItems: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8 },
  listPrice: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },
  listRating: { fontSize: 12, color: '#888', marginTop: 2 },
  mapDirectionsButton: {
    backgroundColor: '#FFECE0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
  },
  mapDirectionsText: {
    color: '#FF6B35',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#444', textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: '#888', textAlign: 'center' },
  seedHint: {
    marginTop: 16, backgroundColor: '#FF6B35',
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
  },
  seedHintText: { color: '#fff', fontWeight: '600' },
});