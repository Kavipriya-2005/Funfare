import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: { paddingBottom: 5, height: 60 },
      }}
    >
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarLabel: '🔍 Explore' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarLabel: '❤️ Saved' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: '👤 Profile' }} />
    </Tabs>
  );
}