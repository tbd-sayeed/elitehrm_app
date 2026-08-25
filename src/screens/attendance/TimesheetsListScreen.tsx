/**
 * Timesheets List Screen - Show monthly timesheets and navigate to attendance
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
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { MainStackParamList } from '../../navigation/MainNavigator';
import { getTimesheets, getTimesheetDownloadPdfUrl, type TimesheetListItem } from '../../api/attendance';
import { showToast } from '../../utils/toast';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { tokenStorage } from '../../utils/storage';

type NavProp = StackNavigationProp<MainStackParamList, 'TimesheetsList'>;

const monthToLabel = (ym: string) => {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatRange = (start: string, end: string) => {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const left = s.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const right = e.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${left} - ${right}`;
  } catch {
    return `${start} - ${end}`;
  }
};

const statusMeta = (status: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return { label: 'Approved', bg: '#c8e6c9', fg: '#2e7d32' };
  if (s === 'submitted' || s === 'pending') return { label: 'Submitted', bg: '#ffe0b2', fg: '#e65100' };
  if (s === 'rejected') return { label: 'Rejected', bg: '#ffcdd2', fg: '#c62828' };
  if (s === 'draft') return { label: 'Draft', bg: '#e0e0e0', fg: '#424242' };
  return { label: status, bg: '#e0e0e0', fg: '#424242' };
};

const TimesheetsListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const currentYear = useMemo(() => String(new Date().getFullYear()), []);
  const [showFilters, setShowFilters] = useState(false);
  const [year, setYear] = useState<string>(currentYear);
  const [status, setStatus] = useState<string>('all');

  const [items, setItems] = useState<TimesheetListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const canLoadMore = items.length < (total || 0);

  const fetchPage = useCallback(
    async (nextPage: number, opts?: { append?: boolean; silent?: boolean }) => {
      const append = opts?.append ?? false;
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);
      try {
        const params: any = { page: nextPage, per_page: perPage };
        if (year && /^\d{4}$/.test(year)) params.year = Number(year);
        if (status && status !== 'all') params.status = status;

        const res = await getTimesheets(params);
        if (!res.success) {
          showToast.error('Timesheets', res.message || 'Could not load timesheets');
          return;
        }
        const newItems = res.data?.items ?? [];
        const newTotal = res.data?.total ?? newItems.length;
        setTotal(newTotal);
        setPage(nextPage);
        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
      } catch (e: any) {
        showToast.error('Timesheets', e?.message || 'Could not load timesheets');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [perPage, status, year]
  );

  useEffect(() => {
    void fetchPage(1, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilters = () => {
    void fetchPage(1, { append: false });
    setShowFilters(false);
  };

  const onReset = () => {
    setYear(currentYear);
    setStatus('all');
    void fetchPage(1, { append: false });
    setShowFilters(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(1, { append: false, silent: true }).finally(() => setRefreshing(false));
  };

  const handleViewMonth = (it: TimesheetListItem) => {
    const month = it.attendance_month || it.month_key;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      showToast.error('View attendance', 'Invalid month for this timesheet');
      return;
    }
    if (it.can_view_attendance === false) {
      showToast.error('View attendance', 'Attendance is not available for this timesheet');
      return;
    }
    navigation.navigate('AttendanceList', { month });
  };

  const handleDownload = async (it: TimesheetListItem) => {
    if (!it?.id) return;
    const isApproved = String(it.status || '').toLowerCase() === 'approved';
    if (!isApproved) {
      showToast.error('Download', 'Only approved timesheets can be downloaded');
      return;
    }
    if (it.can_download_pdf === false) {
      showToast.error('Download', 'Download is not available for this timesheet');
      return;
    }
    if (downloadingId === it.id) return;

    try {
      setDownloadingId(it.id);
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        showToast.error('Download', 'Session expired. Please login again.');
        return;
      }

      const url = it.download_pdf_url || getTimesheetDownloadPdfUrl(it.id);
      const period = (it.period_code || it.month_key || String(it.id)).replace(/[^0-9A-Za-z_-]/g, '');
      const dir = ReactNativeBlobUtil.fs.dirs.CacheDir;
      const path = `${dir}/elitehr_timesheet_${period}_${Date.now()}.pdf`;

      showToast.info('Downloading', 'Preparing your timesheet report…');
      const res = await ReactNativeBlobUtil.config({ path, fileCache: true }).fetch(
        'GET',
        url,
        { Authorization: `Bearer ${token}`, Accept: 'application/pdf' }
      );

      const info = res.info();
      const status = info?.status ?? 0;
      const headers = (info?.headers ?? {}) as Record<string, string>;
      const contentType = headers['content-type'] || headers['Content-Type'] || '';
      if (status >= 300) throw new Error(`Download failed (HTTP ${status}).`);
      if (!String(contentType).toLowerCase().includes('pdf')) throw new Error('Server did not return a PDF.');

      const filePath = res.path();
      if (Platform.OS === 'ios') {
        await ReactNativeBlobUtil.ios.openDocument(filePath);
      } else {
        ReactNativeBlobUtil.android.actionViewIntent(filePath, 'application/pdf');
      }
    } catch (e: any) {
      Alert.alert('Download', e?.message || 'Could not download this report');
    } finally {
      setDownloadingId(null);
    }
  };

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
        <Text style={styles.headerTitle}>Timesheets</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => setShowFilters((v) => !v)}
          activeOpacity={0.8}>
          <Ionicons name={showFilters ? 'close' : 'options-outline'} size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersCard}>
            <View style={styles.filtersHeaderRow}>
              <View style={styles.filtersTitleRow}>
                <Ionicons name="filter-outline" size={18} color="#1a237e" />
                <Text style={styles.filtersTitle}>Filters</Text>
              </View>
              <TouchableOpacity
                style={styles.filtersCloseButton}
                onPress={() => setShowFilters(false)}
                activeOpacity={0.7}>
                <Ionicons name="close" size={18} color="#1a237e" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Year</Text>
              <View style={styles.chipsRow}>
                {[currentYear, String(Number(currentYear) - 1)].map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.chip, year === y && styles.chipActive]}
                    onPress={() => setYear(y)}
                    activeOpacity={0.8}>
                    <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.chipsRow}>
                {['all', 'draft', 'submitted', 'approved', 'rejected'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, status === s && styles.chipActive]}
                    onPress={() => setStatus(s)}
                    activeOpacity={0.8}>
                    <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterActionsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={onReset} activeOpacity={0.8}>
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={onApplyFilters} activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {monthToLabel(`${year}-01`).split(' ')[1] ? `Year ${year}` : `Year ${year}`}
          </Text>
          <Text style={styles.metaText}>{total ? `${items.length} of ${total}` : `${items.length}`}</Text>
        </View>

        {loading && items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading timesheets…</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No timesheets found</Text>
          </View>
        ) : (
          items.map((it) => {
            const meta = statusMeta(it.status);
            return (
              <View key={String(it.id)} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.periodWrap}>
                    <Text style={styles.periodText}>{it.period_code}</Text>
                    <Text style={styles.monthText}>{monthToLabel(it.month_key)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.statusText, { color: meta.fg }]}>{meta.label}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date Range</Text>
                  <Text style={styles.detailValue}>{formatRange(it.start_date, it.end_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Hours</Text>
                  <Text style={styles.detailValueStrong}>{it.total_hours}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contract Hours</Text>
                  <Text style={styles.detailValue}>{it.contract_hours}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.viewButton,
                      it.can_view_attendance === false && styles.viewButtonDisabled,
                    ]}
                    onPress={() => handleViewMonth(it)}
                    disabled={it.can_view_attendance === false}
                    activeOpacity={0.85}>
                    <Ionicons name="eye-outline" size={16} color="#ffffff" />
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  {String(it.status || '').toLowerCase() === 'approved' && (
                    <TouchableOpacity
                      style={[
                        styles.downloadBtn,
                        downloadingId === it.id && styles.downloadBtnDisabled,
                        it.can_download_pdf === false && styles.downloadBtnDisabled,
                      ]}
                      onPress={() => handleDownload(it)}
                      disabled={downloadingId === it.id || it.can_download_pdf === false}
                      activeOpacity={0.85}>
                      <Ionicons name="download-outline" size={16} color="#1a237e" />
                      <Text style={styles.downloadBtnText}>
                        {downloadingId === it.id ? 'Downloading…' : 'Download'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        {canLoadMore && (
          <TouchableOpacity
            style={[styles.loadMoreBtn, loading && styles.loadMoreBtnDisabled]}
            onPress={() => fetchPage(page + 1, { append: true })}
            disabled={loading}
            activeOpacity={0.85}>
            <Text style={styles.loadMoreText}>{loading ? 'Loading…' : 'Load more'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  headerIconBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filtersTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filtersTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  filtersCloseButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#eef2ff',
  },
  filterRow: { marginTop: 10 },
  filterLabel: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  chipText: { fontSize: 12, fontWeight: '800', color: '#1a237e' },
  chipTextActive: { color: '#ffffff' },
  filterActionsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '800', color: '#1a237e' },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 110 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metaText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#757575' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodWrap: { flex: 1, paddingRight: 12 },
  periodText: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  monthText: { marginTop: 2, fontSize: 12, fontWeight: '700', color: '#64748b' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 12, fontWeight: '900' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  detailLabel: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  detailValue: { fontSize: 13, color: '#0f172a', fontWeight: '700', textAlign: 'right' },
  detailValueStrong: { fontSize: 13, color: '#1a237e', fontWeight: '900', textAlign: 'right' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a237e',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  viewButtonDisabled: { opacity: 0.6 },
  viewButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  downloadBtn: {
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  downloadBtnDisabled: { opacity: 0.6 },
  downloadBtnText: { color: '#1a237e', fontWeight: '900', fontSize: 13 },
  loadMoreBtn: {
    marginTop: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadMoreBtnDisabled: { opacity: 0.7 },
  loadMoreText: { fontSize: 14, fontWeight: '900', color: '#1a237e' },
});

export default TimesheetsListScreen;

