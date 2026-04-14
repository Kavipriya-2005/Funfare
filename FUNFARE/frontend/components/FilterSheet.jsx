import { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  StyleSheet, ScrollView
} from 'react-native';

const ACTIVITY_TYPES = ['All', 'Outdoor', 'Museum', 'Family', 'Hiking', 'Sports'];
const AGE_GROUPS = ['All ages', 'Kids 6-12', 'Teens', 'Adults', 'Seniors'];
const DISTANCES = [5, 10, 20, 50];

export default function FilterSheet({ visible, filters, onApply, onClose }) {
  const [budget, setBudget] = useState(filters?.budget || 50);
  const [radius, setRadius] = useState(filters?.radius || 10);
  const [type, setType] = useState(filters?.type || 'All');
  const [ageGroup, setAgeGroup] = useState(filters?.ageGroup || 'All ages');

  const handleApply = () => {
    onApply({ budget, radius, type, ageGroup });
  };

  const handleReset = () => {
    setBudget(50);
    setRadius(10);
    setType('All');
    setAgeGroup('All ages');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>⚙️ Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Budget Filter */}
            <Text style={styles.sectionTitle}>💰 Max Budget</Text>
            <View style={styles.budgetRow}>
              {[0, 10, 25, 50, 100].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.chip, budget === val && styles.chipActive]}
                  onPress={() => setBudget(val)}
                >
                  <Text style={[styles.chipText, budget === val && styles.chipTextActive]}>
                    {val === 0 ? 'Free' : `₹${val}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Distance Filter */}
            <Text style={styles.sectionTitle}>📍 Max Distance</Text>
            <View style={styles.budgetRow}>
              {DISTANCES.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.chip, radius === val && styles.chipActive]}
                  onPress={() => setRadius(val)}
                >
                  <Text style={[styles.chipText, radius === val && styles.chipTextActive]}>
                    {val} mi
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Activity Type Filter */}
            <Text style={styles.sectionTitle}>🏷️ Activity Type</Text>
            <View style={styles.typeGrid}>
              {ACTIVITY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, type === t && styles.chipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                    {t === 'Outdoor' ? '🌳 ' : t === 'Museum' ? '🏛️ ' : t === 'Family' ? '👨‍👩‍👧 ' : t === 'Hiking' ? '🥾 ' : t === 'Sports' ? '⚽ ' : '🔍 '}
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Age Group Filter */}
            <Text style={styles.sectionTitle}>👨‍👩‍👧 Age Group</Text>
            <View style={styles.typeGrid}>
              {AGE_GROUPS.map((ag) => (
                <TouchableOpacity
                  key={ag}
                  style={[styles.typeChip, ageGroup === ag && styles.chipActive]}
                  onPress={() => setAgeGroup(ag)}
                >
                  <Text style={[styles.chipText, ageGroup === ag && styles.chipTextActive]}>
                    {ag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                Showing activities up to ${budget === 0 ? 'Free' : `₹${budget}`} within {radius} miles
              </Text>
            </View>

          </ScrollView>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 20,
    maxHeight: '85%'
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#ddd',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  resetText: { color: '#FF6B35', fontSize: 15, fontWeight: '600' },
  sectionTitle: {
    fontSize: 15, fontWeight: 'bold',
    color: '#333', marginTop: 16, marginBottom: 10
  },
  budgetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: '#ddd', backgroundColor: '#f9f9f9'
  },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: '#ddd', backgroundColor: '#f9f9f9'
  },
  chipActive: { backgroundColor: '#FFF0EB', borderColor: '#FF6B35' },
  chipText: { color: '#555', fontSize: 13 },
  chipTextActive: { color: '#FF6B35', fontWeight: '600' },
  summary: {
    backgroundColor: '#f0f9ff', borderRadius: 10,
    padding: 12, marginTop: 20
  },
  summaryText: { color: '#555', fontSize: 13, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, borderWidth: 2, borderColor: '#ddd',
    padding: 14, borderRadius: 12, alignItems: 'center'
  },
  cancelBtnText: { color: '#555', fontWeight: '600', fontSize: 15 },
  applyBtn: {
    flex: 2, backgroundColor: '#FF6B35',
    padding: 14, borderRadius: 12, alignItems: 'center'
  },
  applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});