import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';

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

export default function ActivityCard({ activity }) {
  const router = useRouter();

  const imageUri = activity.image || activity.images?.[0] || 'https://via.placeholder.com/300';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/activity/${activity._id}`)}
    >
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{activity.name}</Text>
        <Text style={styles.type}>{activity.type} • {activity.distance} miles away</Text>
        <Text style={styles.location}>{activity.locationText}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>₹{activity.price}</Text>
          <Text style={styles.rating}>⭐ {activity.rating}</Text>
        </View>
        <TouchableOpacity onPress={() => openDirections(activity)} style={styles.directionsButton}>
          <Text style={styles.directionsText}>🧭 Get directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, margin: 10, overflow: 'hidden', elevation: 3 },
  image: { width: '100%', height: 160 },
  info: { padding: 12 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  type: { color: '#888', marginTop: 4 },
  location: { color: '#666', fontSize: 13, marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  price: { color: '#FF6B35', fontWeight: 'bold', fontSize: 16 },
  rating: { color: '#555' },
  directionsButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFECE0',
    borderRadius: 16,
  },
  directionsText: {
    color: '#FF6B35',
    fontWeight: '600',
    fontSize: 13,
  },
});