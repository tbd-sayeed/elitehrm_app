/**
 * Public Holidays Screen - List all public holidays for current year
 * @format
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { MainStackParamList } from '../../navigation/MainNavigator';
import { useAuthStore } from '../../store/authStore';

type NavProp = StackNavigationProp<MainStackParamList, 'PublicHolidays'>;

const parseYmdLocal = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-').map((x) => Number(x));
  if (parts.length < 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formatHolidayDate = (dateStr: string) => {
  const d = parseYmdLocal(dateStr);
  if (!d) return { left: dateStr, right: '' };
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const day = d.getDate();
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
  return { left: `${month} ${day}`, right: weekday };
};

const PublicHolidaysScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { dashboardData } = useAuthStore();

  const yearLabel =
    dashboardData?.publicHolidays?.year ||
    String(new Date().getFullYear());

  const items = useMemo(() => {
    const list = dashboardData?.publicHolidays?.holidays ?? [];
    const mapped = list
      .map((h) => {
        const d = parseYmdLocal(h.date);
        return {
          id: h.id,
          name: h.name,
          date: h.date,
          time: d?.getTime() ?? 0,
        };
      })
      .sort((a, b) => a.time - b.time);
    return mapped;
  }, [dashboardData?.publicHolidays?.holidays]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1a5a" />

      {/* Notch area - darker colored background */}
      <View style={[styles.notchArea, { height: insets.top }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Public Holidays</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.noteBanner}>
          <Ionicons name="calendar-outline" size={18} color="#1a237e" />
          <View style={{ flex: 1 }}>
            <Text style={styles.noteTitle}>Current year: {yearLabel}</Text>
            <Text style={styles.noteText}>
              This list shows all public holidays available for {yearLabel}.
            </Text>
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-clear-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No holidays found</Text>
            <Text style={styles.emptySub}>There are no public holidays available for this year.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Public holidays</Text>
            {items.map((h, idx) => {
              const f = formatHolidayDate(h.date);
              const isLast = idx === items.length - 1;
              return (
                <View key={h.id} style={[styles.row, isLast && styles.rowLast]}>
                  <View style={styles.rowLeft}>
                    <View style={styles.dot} />
                    <Text style={styles.rowName}>{h.name}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowDate}>{f.left}</Text>
                    <Text style={styles.rowDow}>{f.right}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  notchArea: { backgroundColor: '#0d1a5a', width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0d1a5a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a237e',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 110 },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginBottom: 12,
  },
  noteTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  noteText: { marginTop: 2, fontSize: 12, color: '#475569', lineHeight: 16, fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 18 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '900', color: '#0f172a' },
  emptySub: { marginTop: 6, fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLast: { borderBottomWidth: 0, paddingBottom: 4 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1a237e' },
  rowName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0f172a' },
  rowRight: { alignItems: 'flex-end' },
  rowDate: { fontSize: 13, fontWeight: '800', color: '#1a237e' },
  rowDow: { marginTop: 2, fontSize: 12, color: '#64748b', fontWeight: '600' },
});

export default PublicHolidaysScreen;

