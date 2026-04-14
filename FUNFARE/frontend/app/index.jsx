import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      setDestination(token ? '/(tabs)/explore' : '/(auth)/login');
    }).catch(() => {
      setDestination('/(auth)/login');
    });
  }, []);

  if (destination) {
    return <Redirect href={destination} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎡</Text>
      <Text style={styles.title}>FunFare</Text>
      <Text style={styles.subtitle}>Discover weekend adventures</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 30 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#FF6B35',
  },
  emoji: { fontSize: 64 },
  title: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#FFE0D0', marginTop: 8 },
});