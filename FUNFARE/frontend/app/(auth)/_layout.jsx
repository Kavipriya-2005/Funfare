import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activity/[id]" />
      <Stack.Screen name="activity/compare" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="ai-suggestions" />
      <Stack.Screen name="map" />
    </Stack>
  );
}