/**
 * Team Working Today Screen
 * Shows who is on shift now and who starts later today
 * @format
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { MainStackParamList } from '../../navigation/MainNavigator';
import {
  getTeamWorkingToday,
  type TeamWorkingTodayEmployee,
  type TeamWorkingTodayPlace,
} from '../../api/teamWorkingToday';
import { showToast } from '../../utils/toast';

type NavProp = StackNavigationProp<MainStackParamList, 'TeamWorkingToday'>;

const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, delta: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + delta);
  return next;
};

const toFriendlyDate = (d: Date) => {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
};

const formatHm12 = (hm?: string | null) => {
  if (!hm) return '—';
  const parts = hm.split(':');
  if (parts.length < 2) return hm;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return hm;
  const hour12 = h % 12 || 12;
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const isNextDay = (start: string, end: string) => {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  if ([sH, sM, eH, eM].some((n) => Number.isNaN(n))) return false;
  return eH * 60 + eM < sH * 60 + sM;
};

const initialsFromName = (name: string) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '—';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
};

const placesLabelForEmployee = (item: TeamWorkingTodayEmployee) => {
  const names: string[] = [];

  const pushPlace = (p: any) => {
    const n = String(p?.name ?? '').trim();
    if (n) names.push(n);
  };

  const pushName = (n: any) => {
    const s = String(n ?? '').trim();
    if (s) names.push(s);
  };

  // Common shapes (direct)
  const directPlacesOfWork = (item as any).places_of_work;
  if (Array.isArray(directPlacesOfWork)) directPlacesOfWork.forEach(pushPlace);

  const directPlaceOfWork = (item as any).place_of_work;
  if (Array.isArray(directPlaceOfWork)) {
    directPlaceOfWork.forEach(pushPlace);
  } else if (directPlaceOfWork && typeof directPlaceOfWork === 'object') {
    pushPlace(directPlaceOfWork);
  }

  // Alternate keys some backends use
  const altPlaces = (item as any).places;
  if (Array.isArray(altPlaces)) altPlaces.forEach(pushPlace);

  const altNames = (item as any).places_of_work_names;
  if (Array.isArray(altNames)) altNames.forEach(pushName);

  const altNameSingle = (item as any).place_of_work_name;
  if (altNameSingle) pushName(altNameSingle);

  // Nested employee payload (if the API wraps details)
  const nestedEmployee = (item as any).employee;
  if (nestedEmployee) {
    const nestedPlaces = nestedEmployee.places_of_work;
    if (Array.isArray(nestedPlaces)) nestedPlaces.forEach(pushPlace);
    const nestedPlace = nestedEmployee.place_of_work;
    if (Array.isArray(nestedPlace)) nestedPlace.forEach(pushPlace);
    else if (nestedPlace && typeof nestedPlace === 'object') pushPlace(nestedPlace);
    const nestedNames = nestedEmployee.places_of_work_names;
    if (Array.isArray(nestedNames)) nestedNames.forEach(pushName);
    const nestedNameSingle = nestedEmployee.place_of_work_name;
    if (nestedNameSingle) pushName(nestedNameSingle);
  }

  const unique = Array.from(new Set(names));
  return unique.length ? unique.join(', ') : '—';
};

const EmployeeRow: React.FC<{ item: TeamWorkingTodayEmployee }> = ({ item }) => {
  const start = item.shift?.start_time || '—';
  const end = item.shift?.end_time || '—';
  const nextDay = start !== '—' && end !== '—' ? isNextDay(start, end) : false;
  const place = placesLabelForEmployee(item);
  const breakStart = item.shift?.break_start_time || null;
  const breakEnd = item.shift?.break_end_time || null;
  const breakLine =
    breakStart && breakEnd ? `Break ${formatHm12(breakStart)} – ${formatHm12(breakEnd)}` : null;

  return (
    <View style={styles.row}>
      <View style={styles.avatarWrap}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{initialsFromName(item.name)}</Text>
          </View>
        )}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {formatHm12(start)} – {formatHm12(end)}
          {nextDay ? ' (next day)' : ''}
        </Text>
        {breakLine ? (
          <Text style={styles.rowSubMuted} numberOfLines={1}>
            {breakLine}
          </Text>
        ) : null}
        <Text style={styles.rowPlace} numberOfLines={2}>
          {place}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </View>
  );
};

const TeamWorkingTodayScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const [date, setDate] = useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [places, setPlaces] = useState<TeamWorkingTodayPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [placeModalOpen, setPlaceModalOpen] = useState(false);

  const [onShiftNow, setOnShiftNow] = useState<TeamWorkingTodayEmployee[]>([]);
  const [scheduledLater, setScheduledLater] = useState<TeamWorkingTodayEmployee[]>([]);
  const [timezone, setTimezone] = useState<string>('—');

  const ymd = useMemo(() => toYmd(date), [date]);

  const selectedPlaceLabel = useMemo(() => {
    if (!selectedPlaceId) {
      const names = (places ?? [])
        .map((p) => String(p?.name ?? '').trim())
        .filter(Boolean);
      return names.length ? names.join(', ') : 'All locations';
    }
    return places.find((p) => p.id === selectedPlaceId)?.name ?? 'All locations';
  }, [places, selectedPlaceId]);

  const fetchData = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);
      try {
        const res = await getTeamWorkingToday({
          date: ymd,
          place_of_work_id: selectedPlaceId ?? undefined,
        });
        if (!res.success) {
          showToast.error('Team schedule', res.message || 'Could not load team schedule');
          return;
        }
        setPlaces(res.data?.places ?? []);
        setTimezone(res.data?.timezone ?? '—');
        setOnShiftNow(res.data?.on_shift_now ?? []);
        setScheduledLater(res.data?.scheduled_later_today ?? []);
      } catch (e: any) {
        showToast.error('Team schedule', e?.message || 'Could not load team schedule');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedPlaceId, ymd]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData({ silent: true }).finally(() => setRefreshing(false));
  };

  const placeOptions = useMemo(() => {
    const all: Array<{ id: number | null; name: string }> = [
      { id: null, name: 'All locations' },
      ...places.map((p) => ({ id: p.id, name: p.name })),
    ];
    return all;
  }, [places]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1a5a" />
      <View style={[styles.notchArea, { height: insets.top }]} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <View style={styles.backRow}>
            <Ionicons name="arrow-back" size={18} color="#ffffff" />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Schedule</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Controls */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={styles.placeButton}
          onPress={() => setPlaceModalOpen(true)}
          activeOpacity={0.85}>
          <Ionicons name="business-outline" size={18} color="#1a237e" />
          <Text style={styles.placeButtonText} numberOfLines={1}>
            {selectedPlaceLabel}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.dateControls}>
          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={() => setDate((d) => addDays(d, -1))}
            activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={18} color="#1a237e" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.85}>
            <Text style={styles.dateButtonText}>{toFriendlyDate(date)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={() => setDate((d) => addDays(d, 1))}
            activeOpacity={0.85}>
            <Ionicons name="chevron-forward" size={18} color="#1a237e" />
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={(Platform.OS === 'ios'
            ? (Platform.isPad ? 'inline' : 'spinner')
            : 'calendar') as any}
          onChange={(event: any, d?: Date) => {
            if (Platform.OS === 'android') {
              if (event?.type === 'dismissed') {
                setShowDatePicker(false);
                return;
              }
              setDate(d ?? date);
              setShowDatePicker(false);
              return;
            }
            setDate(d ?? date);
          }}
          themeVariant="light"
          textColor="#0f172a"
        />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={18} color="#1a237e" />
            <Text style={styles.summaryText}>
              {onShiftNow.length} on shift now • {scheduledLater.length} later today
            </Text>
          </View>
          <Text style={styles.summaryHint}>Timezone: {timezone}</Text>
        </View>

        <Text style={styles.sectionTitle}>On shift now</Text>
        <View style={styles.sectionCard}>
          {loading && onShiftNow.length === 0 ? (
            <Text style={styles.emptyText}>Loading…</Text>
          ) : onShiftNow.length === 0 ? (
            <Text style={styles.emptyText}>No one is on shift right now.</Text>
          ) : (
            onShiftNow.map((it) => <EmployeeRow key={String(it.employee_id)} item={it} />)
          )}
        </View>

        <Text style={styles.sectionTitle}>Scheduled later today</Text>
        <View style={styles.sectionCard}>
          {loading && scheduledLater.length === 0 ? (
            <Text style={styles.emptyText}>Loading…</Text>
          ) : scheduledLater.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming shifts for today.</Text>
          ) : (
            scheduledLater.map((it) => <EmployeeRow key={String(it.employee_id)} item={it} />)
          )}
        </View>
      </ScrollView>

      {/* Places modal */}
      <Modal visible={placeModalOpen} transparent animationType="fade" onRequestClose={() => setPlaceModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPlaceModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Select place</Text>
            {placeOptions.map((p) => {
              const selected = (p.id ?? null) === (selectedPlaceId ?? null);
              return (
                <TouchableOpacity
                  key={String(p.id ?? 'all')}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  onPress={() => {
                    setSelectedPlaceId(p.id ?? null);
                    setPlaceModalOpen(false);
                  }}
                  activeOpacity={0.85}>
                  <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                    {p.name}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={18} color="#1a237e" /> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  notchArea: { backgroundColor: '#0d1a5a', width: '100%' },
  header: {
    backgroundColor: '#1a237e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { paddingVertical: 8, paddingHorizontal: 4 },
  backButtonText: { fontSize: 16, color: '#ffffff', fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },

  controlsBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },
  placeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  placeButtonText: { flex: 1, fontSize: 13, fontWeight: '900', color: '#0f172a' },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dateNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 110 },

  summaryCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { fontSize: 13, fontWeight: '900', color: '#0f172a' },
  summaryHint: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#475569' },

  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginTop: 6, marginBottom: 8 },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  emptyText: { padding: 16, fontSize: 13, color: '#64748b', fontWeight: '700' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  avatar: { width: 44, height: 44 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { fontWeight: '900', color: '#1a237e' },
  rowBody: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  rowSub: { marginTop: 3, fontSize: 12, fontWeight: '800', color: '#1a237e' },
  rowSubMuted: { marginTop: 3, fontSize: 12, fontWeight: '700', color: '#475569' },
  rowPlace: { marginTop: 3, fontSize: 12, fontWeight: '700', color: '#64748b', lineHeight: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  modalOptionText: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  modalOptionTextSelected: { color: '#1a237e' },
});

export default TeamWorkingTodayScreen;

