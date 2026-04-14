import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  Image, Platform, Linking
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActivityById } from '../../services/activityService';

export default function ActivityDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activity, setActivity] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeMode, setRouteMode] = useState('driving');
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchActivity();
    loadUserLocation();
    checkIfSaved(id);
  }, [id]);

  useEffect(() => {
    if (activity && userLocation) {
      fetchRoute();
    }
  }, [activity, userLocation, routeMode]);

  const fetchActivity = async () => {
    try {
      const data = await getActivityById(id);
      setActivity(data);
    } catch (err) {
      setError('Could not load activity details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activity) return;
    const galleryImage = activity.image || activity.images?.[0] || null;
    setSelectedImage(galleryImage);
  }, [activity]);

  const checkIfSaved = async (actId) => {
    const data = await AsyncStorage.getItem('saved_activities');
    const list = data ? JSON.parse(data) : [];
    setSaved(list.some((a) => a._id === actId));
  };

  const loadUserLocation = async () => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setLocationError('Browser geolocation not available');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          setLocationError('Could not access browser location');
        }
      );
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (err) {
      setLocationError('Could not retrieve current location');
    }
  };

  const fetchRoute = async () => {
    if (!activity || !userLocation || !activity.latitude || !activity.longitude) {
      return;
    }

    const origin = `${userLocation.longitude},${userLocation.latitude}`;
    const destination = `${activity.longitude},${activity.latitude}`;
    const profile = routeMode === 'walking' ? 'foot' : 'driving';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${origin};${destination}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data?.routes?.length > 0) {
        const routeData = data.routes[0];
        setRoute(routeData);
        const distanceKm = routeData.distance / 1000;
        const durationMin = Math.round(
          routeMode === 'walking'
            ? distanceKm / 5 * 60
            : distanceKm / 40 * 60
        );
        setRouteInfo(`${durationMin} min · ${distanceKm.toFixed(1)} km (${routeMode})`);
      } else {
        setRoute(null);
        setRouteInfo('Route not available');
      }
    } catch (err) {
      setRoute(null);
      setRouteInfo('Could not load route');
    }
  };

  const toggleSave = async () => {
    const data = await AsyncStorage.getItem('saved_activities');
    let savedList = data ? JSON.parse(data) : [];
    if (saved) {
      savedList = savedList.filter((a) => a._id !== activity._id);
      Alert.alert('Removed', 'Activity removed from saved plans');
    } else {
      savedList.push(activity);
      Alert.alert('Saved!', 'Activity saved for offline access');
    }
    await AsyncStorage.setItem('saved_activities', JSON.stringify(savedList));
    setSaved(!saved);
  };

  const addToCompareAndGo = async () => {
    const key = 'compare_activities';
    try {
      const stored = await AsyncStorage.getItem(key);
      const existing = stored ? JSON.parse(stored) : [];
      const next = Array.isArray(existing) ? existing : [];
      if (!next.some((a) => a._id === activity._id)) {
        next.push(activity);
      }
      await AsyncStorage.setItem(key, JSON.stringify(next.slice(0, 3)));
    } catch (err) {
      console.warn('Could not save compare selection', err.message);
    }
    router.push('/activity/compare');
  };

  const WebMapPreview = ({ activity, userLocation, route }) => {
    useEffect(() => {
      if (Platform.OS !== 'web' || !activity) return;

      const mapId = 'detail-map';
      const existingLink = document.getElementById('leaflet-css');
      if (!existingLink) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const initMap = () => {
        const L = window.L;
        if (!L || !activity.latitude || !activity.longitude) return;

        const container = document.getElementById(mapId);
        if (!container) return;
        if (container._leaflet_id) {
          container._leaflet_id = null;
          container.innerHTML = '';
        }

        const centerLat = activity.latitude;
        const centerLng = activity.longitude;
        const map = L.map(mapId, {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
          dragging: true,
          minZoom: 10,
          maxZoom: 18,
        }).setView([centerLat, centerLng], 14);

        if (userLocation) {
          const userIcon = L.divIcon({
            html: `<div style="
              background:#4285f4; width:14px; height:14px;
              border-radius:50%; border:3px solid #fff;
              box-shadow:0 2px 6px rgba(0,0,0,0.4);
            "></div>`,
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup('<strong>📍 You are here</strong>');
        }

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        if (route?.geometry) {
          L.geoJSON(route.geometry, {
            style: { color: '#3b82f6', weight: 5, opacity: 0.8 },
          }).addTo(map);
        }

        const marker = L.marker([activity.latitude, activity.longitude]).addTo(map);
        marker.bindPopup(`
          <div style="font-family:sans-serif;">
            <strong>${activity.name}</strong><br/>
            ${activity.locationText || ''}
          </div>
        `).openPopup();
      };

      const existingScript = document.getElementById('leaflet-js');
      if (existingScript) {
        if (window.L) initMap();
        else existingScript.onload = initMap;
      } else {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      }

      return () => {
        const container = document.getElementById(mapId);
        if (container && container._leaflet_id) {
          container._leaflet_id = null;
        }
      };
    }, [activity, userLocation, route]);

    return (
      <View style={styles.mapWrapper}>
        <div id="detail-map" style={{ width: '100%', height: 320, borderRadius: 16, overflow: 'hidden' }} />
      </View>
    );
  };

  const NativeMapPreview = ({ activity, userLocation, route }) => {
    if (!activity.latitude || !activity.longitude || Platform.OS === 'web') return null;

    let MapView;
    let Marker;
    let Polyline;
    try {
      const rnMaps = eval('require')('react-native-maps');
      MapView = rnMaps.default || rnMaps;
      Marker = rnMaps.Marker;
      Polyline = rnMaps.Polyline;
    } catch (error) {
      return null;
    }

    if (!MapView || !Marker) return null;

    const routeCoordinates = route?.geometry?.coordinates?.map(([lng, lat]) => ({ latitude: lat, longitude: lng })) || [];

    return (
      <MapView
        style={styles.detailMap}
        initialRegion={{
          latitude: activity.latitude,
          longitude: activity.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
      >
        <Marker
          coordinate={{ latitude: activity.latitude, longitude: activity.longitude }}
          title={activity.name}
          description={activity.locationText}
        />
        {userLocation ? (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            title="You are here"
            pinColor="blue"
          />
        ) : null}
        {Polyline && routeCoordinates.length > 0 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3b82f6"
            strokeWidth={4}
          />
        ) : null}
      </MapView>
    );
  };

  const openDirections = async (activity) => {
    if (!activity) return;
    const destination = activity.latitude && activity.longitude
      ? `${activity.latitude},${activity.longitude}`
      : encodeURIComponent(activity.locationText || activity.name || '');
    const origin = userLocation && userLocation.latitude && userLocation.longitude
      ? `&origin=${userLocation.latitude},${userLocation.longitude}`
      : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin}&travelmode=${routeMode}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('Could not open directions', error.message);
    }
  };

  const MapPreview = ({ activity }) => {
    if (!activity.latitude || !activity.longitude) {
      return (
        <View style={styles.mapFallback}>
          <Text style={styles.mapFallbackText}>Location coordinates are not available yet.</Text>
        </View>
      );
    }

    return Platform.OS === 'web'
      ? <WebMapPreview activity={activity} userLocation={userLocation} route={route} />
      : <NativeMapPreview activity={activity} userLocation={userLocation} route={route} />;
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#FF6B35" size="large" />;

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: '#FF6B35', marginTop: 12 }}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (!activity) return null;

  const headerImageUri = selectedImage || activity.image || activity.images?.[0] || 'https://via.placeholder.com/1000x540?text=Activity+Spot';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageBox}>
        <Image
          source={{ uri: headerImageUri }}
          style={styles.headerImage}
          resizeMode="cover"
        />
      </View>
      {activity.images?.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.galleryScroll}
          contentContainerStyle={styles.galleryContent}
        >
          {activity.images.map((img, index) => (
            <TouchableOpacity key={index} onPress={() => setSelectedImage(img)}>
              <Image
                source={{ uri: img }}
                style={[
                  styles.galleryThumb,
                  selectedImage === img && styles.galleryThumbActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={styles.name}>{activity.name}</Text>
          <TouchableOpacity onPress={toggleSave}>
            <Text style={styles.heart}>{saved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Info Pills */}
        <View style={styles.pills}>
          <View style={styles.pill}><Text style={styles.pillText}>📍 {activity.distance} miles</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>⭐ {activity.rating}</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>👨‍👩‍👧 {activity.ageGroup}</Text></View>
        </View>

        {/* Price */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Entry Price</Text>
          <Text style={styles.price}>
            {activity.price === 0 ? 'FREE' : `₹${activity.price} per person`}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{activity.description}</Text>

        {/* Availability */}
        <Text style={styles.sectionTitle}>Availability</Text>
        <Text style={styles.info}>🕐 {activity.availability}</Text>

        <Text style={styles.sectionTitle}>Location</Text>
        <TouchableOpacity onPress={() => openDirections(activity)}>
          <Text style={styles.locationLink}>📍 {activity.locationText}</Text>
        </TouchableOpacity>
        {userLocation ? (
          <Text style={styles.userLocationText}>
            Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </Text>
        ) : locationError ? (
          <Text style={styles.userLocationText}>{locationError}</Text>
        ) : (
          <Text style={styles.userLocationText}>Finding your location…</Text>
        )}

        <View style={styles.routeModeRow}>
          {['driving', 'walking'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.routeModeButton,
                routeMode === mode && styles.routeModeButtonActive,
              ]}
              onPress={() => {
                if (routeMode !== mode) {
                  setRouteMode(mode);
                  setRoute(null);
                  setRouteInfo('Loading route...');
                }
              }}
            >
              <Text style={[
                styles.routeModeText,
                routeMode === mode && styles.routeModeTextActive,
              ]}>
                {mode === 'driving' ? '🚗 Drive' : '🚶 Walk'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {routeInfo ? <Text style={styles.routeInfo}>🧭 {routeInfo}</Text> : null}
        <Text style={styles.subInfo}>Latitude {activity.latitude?.toFixed(4)}, Longitude {activity.longitude?.toFixed(4)}</Text>
        <MapPreview activity={activity} />

        {/* Reviews */}
        <Text style={styles.sectionTitle}>Reviews</Text>
        {activity.reviews && activity.reviews.map((review, index) => (
          <View key={index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewUser}>{review.user}</Text>
              <Text style={styles.reviewRating}>{'⭐'.repeat(review.rating)}</Text>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
          </View>
        ))}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push(`/booking/${activity._id}`)}
          >
            <Text style={styles.bookBtnText}>
              {activity.price === 0 ? '📅 Reserve Spot' : '🎟️ Book Now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.compareBtn}
            onPress={addToCompareAndGo}
          >
            <Text style={styles.compareBtnText}>⚖️ Compare</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#e74c3c', fontSize: 15 },
  imagePlaceholder: {
    height: 220, backgroundColor: '#FFF0EB',
    justifyContent: 'center', alignItems: 'center'
  },
  imageEmoji: { fontSize: 80 },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: '#fff', padding: 8,
    borderRadius: 8, elevation: 3
  },
  backText: { fontSize: 16, color: '#FF6B35', fontWeight: '600' },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', flex: 1 },
  heart: { fontSize: 28 },
  pills: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  pill: { backgroundColor: '#FFF0EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { color: '#FF6B35', fontSize: 13, fontWeight: '600' },
  priceBox: {
    backgroundColor: '#f9f9f9', borderRadius: 12,
    padding: 16, marginTop: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  priceLabel: { color: '#888', fontSize: 14 },
  price: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 8 },
  description: { color: '#555', lineHeight: 22, fontSize: 15 },
  info: { color: '#555', fontSize: 15, marginBottom: 6 },
  subInfo: { color: '#777', fontSize: 13, marginBottom: 12 },
  locationLink: { color: '#FF6B35', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  userLocationText: { color: '#5a5a5a', fontSize: 15, marginBottom: 8 },
  routeModeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  routeModeButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#F4F4F5',
  },
  routeModeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  routeModeText: { color: '#555', fontSize: 15, fontWeight: '600' },
  routeModeTextActive: { color: '#fff' },
  routeInfo: { color: '#444', fontSize: 16, marginBottom: 12 },
  imageBox: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 28,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  headerImage: {
    width: '100%',
    height: 360,
    borderRadius: 24,
    backgroundColor: '#f7f7f7',
  },
  galleryScroll: { marginTop: 20, marginBottom: 24 },
  galleryContent: { paddingHorizontal: 18 },
  galleryThumb: {
    width: 140,
    height: 100,
    borderRadius: 20,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  galleryThumbActive: {
    borderColor: '#FF6B35',
  },
  mapWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
  },
  detailMap: {
    width: '100%',
    height: 320,
    borderRadius: 16,
  },
  mapFallback: {
    backgroundColor: '#f3f3f3',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  mapFallbackText: { color: '#666' },
  reviewCard: {
    backgroundColor: '#f9f9f9', borderRadius: 10,
    padding: 12, marginBottom: 10
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewUser: { fontWeight: 'bold', color: '#333' },
  reviewRating: { fontSize: 12 },
  reviewComment: { color: '#555', fontSize: 14 },
  actions: { marginTop: 24, gap: 12, marginBottom: 40 },
  bookBtn: {
    backgroundColor: '#FF6B35', padding: 16,
    borderRadius: 12, alignItems: 'center'
  },
  bookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  compareBtn: {
    borderWidth: 2, borderColor: '#FF6B35', padding: 14,
    borderRadius: 12, alignItems: 'center'
  },
  compareBtnText: { color: '#FF6B35', fontWeight: 'bold', fontSize: 16 },
});