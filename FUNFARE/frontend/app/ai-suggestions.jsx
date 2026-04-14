import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const INTERESTS = ['outdoor', 'museum', 'hiking', 'family', 'sports', 'food', 'arts'];
const AGE_GROUPS = ['all', 'kids', 'teens', 'adults'];
const CATEGORY_EMOJI = {
  outdoor: '🌿', museum: '🏛️', hiking: '🥾',
  family: '👨‍👩‍👧', sports: '⚽', food: '🍽️', arts: '🎨',
};

export default function AISuggestions() {
  const router = useRouter();
  const [budgetMin, setBudgetMin] = useState('0');
  const [budgetMax, setBudgetMax] = useState('50');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [ageGroup, setAgeGroup] = useState('all');
  const [groupSize, setGroupSize] = useState('1');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const generateSuggestions = async () => {
    const min = Number(budgetMin);
    const max = Number(budgetMax);
    if (isNaN(min) || isNaN(max) || min < 0 || max < min) {
      Alert.alert('Invalid budget', 'Please enter a valid budget range.');
      return;
    }

    setLoading(true);
    setSuggestions([]);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Please log in', 'You need to be logged in to get suggestions.');
        router.replace('/(auth)/login');
        return;
      }

      const response = await api.post(
        '/ai/suggestions',
        {
          budgetMin: min,
          budgetMax: max,
          interests: selectedInterests,
          ageGroup,
          groupSize: Number(groupSize) || 1,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuggestions(response.data.suggestions);
      setHasGenerated(true);

    } catch (error) {
      console.log('AI error:', error.response?.data || error.message);
      Alert.alert(
        'Could not get suggestions',
        error.response?.data?.message || 'Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={styles.title}>✨ AI Suggestions</Text>
        <Text style={styles.subtitle}>
          Tell us your preferences and we'll find the perfect weekend plan
        </Text>
      </View>

      {/* Budget Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Budget per person</Text>
        <View style={styles.budgetRow}>
          <View style={styles.budgetInput}>
            <Text style={styles.budgetLabel}>Min (₹)</Text>
            <TextInput
              style={styles.input}
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#aaa"
            />
          </View>
          <Text style={styles.budgetDash}>—</Text>
          <View style={styles.budgetInput}>
            <Text style={styles.budgetLabel}>Max (₹)</Text>
            <TextInput
              style={styles.input}
              value={budgetMax}
              onChangeText={setBudgetMax}
              keyboardType="numeric"
              placeholder="50"
              placeholderTextColor="#aaa"
            />
          </View>
        </View>

        {/* Quick budget presets */}
        <View style={styles.presetRow}>
          {[['Free', '0', '0'], ['Under ₹20', '0', '20'], ['₹20–₹50', '20', '50'], ['₹50+', '50', '200']].map(([label, min, max]) => (
            <TouchableOpacity
              key={label}
              style={[styles.preset, budgetMin === min && budgetMax === max && styles.presetActive]}
              onPress={() => { setBudgetMin(min); setBudgetMax(max); }}
            >
              <Text style={[styles.presetText, budgetMin === min && budgetMax === max && styles.presetTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interests Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Interests (pick any)</Text>
        <View style={styles.tagsRow}>
          {INTERESTS.map(interest => (
            <TouchableOpacity
              key={interest}
              style={[styles.tag, selectedInterests.includes(interest) && styles.tagActive]}
              onPress={() => toggleInterest(interest)}
            >
              <Text style={[styles.tagText, selectedInterests.includes(interest) && styles.tagTextActive]}>
                {CATEGORY_EMOJI[interest]} {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Age Group Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Age group</Text>
        <View style={styles.tagsRow}>
          {AGE_GROUPS.map(group => (
            <TouchableOpacity
              key={group}
              style={[styles.tag, ageGroup === group && styles.tagActive]}
              onPress={() => setAgeGroup(group)}
            >
              <Text style={[styles.tagText, ageGroup === group && styles.tagTextActive]}>
                {group === 'all' ? '👨‍👩‍👧 All ages' :
                 group === 'kids' ? '🧒 Kids' :
                 group === 'teens' ? '🧑 Teens' : '🧑‍💼 Adults'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Group Size */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎟️ Group size</Text>
        <View style={styles.ticketRow}>
          <TouchableOpacity
            style={styles.ticketBtn}
            onPress={() => setGroupSize(s => String(Math.max(1, Number(s) - 1)))}
          >
            <Text style={styles.ticketBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.ticketCount}>
            {groupSize} {Number(groupSize) === 1 ? 'person' : 'people'}
          </Text>
          <TouchableOpacity
            style={styles.ticketBtn}
            onPress={() => setGroupSize(s => String(Math.min(20, Number(s) + 1)))}
          >
            <Text style={styles.ticketBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
        onPress={generateSuggestions}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.generateBtnText}>  Finding suggestions...</Text>
          </View>
        ) : (
          <Text style={styles.generateBtnText}>✨ Get Suggestions</Text>
        )}
      </TouchableOpacity>

      {/* Results */}
      {hasGenerated && suggestions.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>🎉 Your weekend plan</Text>
          <Text style={styles.resultsSubtitle}>
            Budget: ₹${budgetMin}–₹${budgetMax} · {groupSize} {Number(groupSize) === 1 ? 'person' : 'people'}
          </Text>

          {suggestions.map((item, index) => (
            <View key={index} style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionEmoji}>
                  {CATEGORY_EMOJI[item.category] || '🎡'}
                </Text>
                <View style={styles.suggestionHeaderText}>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  <Text style={styles.suggestionCategory}>{item.category}</Text>
                </View>
                {item.isInDatabase && (
                  <View style={styles.inAppBadge}>
                    <Text style={styles.inAppBadgeText}>In app</Text>
                  </View>
                )}
              </View>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>💡 {item.reason}</Text>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipText}>💰 {item.estimatedCost}</Text>
                </View>
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipText}>⏱️ {item.duration}</Text>
                </View>
              </View>

              <Text style={styles.tipText}>🗺️ {item.tip}</Text>

              {item.activityId && (
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => router.push(`/activity/${item.activityId}`)}
                >
                  <Text style={styles.bookBtnText}>View & Book →</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={generateSuggestions}
            disabled={loading}
          >
            <Text style={styles.regenerateBtnText}>🔄 Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {hasGenerated && suggestions.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🤔</Text>
          <Text style={styles.emptyText}>No suggestions found.</Text>
          <Text style={styles.emptySubtext}>Try adjusting your budget or interests.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  content: { padding: 20, paddingBottom: 60 },
  backButton: { marginBottom: 16 },
  backButtonText: { color: '#FF6B35', fontSize: 15 },
  headerRow: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', lineHeight: 20 },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#eee',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
  budgetRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  budgetInput: { flex: 1 },
  budgetDash: { fontSize: 18, color: '#ccc', marginHorizontal: 12 },
  budgetLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 16, color: '#1a1a2e', backgroundColor: '#fafafa',
  },
  presetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  preset: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  presetActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  presetText: { fontSize: 13, color: '#666' },
  presetTextActive: { color: '#fff', fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  tagActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  tagText: { fontSize: 13, color: '#444' },
  tagTextActive: { color: '#fff', fontWeight: '600' },
  ticketRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 20,
  },
  ticketBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff0eb', justifyContent: 'center', alignItems: 'center',
  },
  ticketBtnText: { fontSize: 22, color: '#FF6B35', fontWeight: '600' },
  ticketCount: {
    fontSize: 18, fontWeight: '700', color: '#1a1a2e',
    minWidth: 80, textAlign: 'center',
  },
  generateBtn: {
    backgroundColor: '#FF6B35', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center', marginBottom: 24,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  resultsSection: { marginTop: 8 },
  resultsTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  resultsSubtitle: { fontSize: 13, color: '#888', marginBottom: 20 },
  suggestionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#eee',
  },
  suggestionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  suggestionEmoji: { fontSize: 32, marginRight: 12 },
  suggestionHeaderText: { flex: 1 },
  suggestionName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  suggestionCategory: { fontSize: 12, color: '#888', marginTop: 2 },
  inAppBadge: {
    backgroundColor: '#e8f5e9', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  inAppBadgeText: { fontSize: 11, color: '#2e7d32', fontWeight: '600' },
  reasonBox: {
    backgroundColor: '#f8f7ff', borderRadius: 10,
    padding: 12, marginBottom: 12,
  },
  reasonText: { fontSize: 13, color: '#444', lineHeight: 18 },
  detailsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  detailChip: {
    backgroundColor: '#fff0eb', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  detailChipText: { fontSize: 12, color: '#FF6B35', fontWeight: '600' },
  tipText: { fontSize: 12, color: '#888', lineHeight: 18, marginBottom: 12 },
  bookBtn: {
    backgroundColor: '#FF6B35', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  regenerateBtn: {
    borderWidth: 1, borderColor: '#FF6B35', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  regenerateBtnText: { color: '#FF6B35', fontWeight: '600', fontSize: 15 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#444' },
  emptySubtext: { fontSize: 13, color: '#888', marginTop: 4 },
});