/**
 * Timesheet Detail Screen - Display current timesheet details
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { getCurrentTimesheet, type AttendanceEntryApi, type AttendanceTimesheetSummary } from '../../api/attendance';
import { showToast } from '../../utils/toast';

type TimesheetDetailNavigationProp = StackNavigationProp<
  MainStackParamList,
  'TimesheetDetail'
>;

const TimesheetDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TimesheetDetailNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timesheet, setTimesheet] = useState<AttendanceTimesheetSummary | null>(null);
  const [entries, setEntries] = useState<AttendanceEntryApi[]>([]);

  const stripSeconds = (t?: string | null) => {
    if (!t) return '—';
    const parts = t.split(':');
    if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return t;
  };

  const decimalHoursToLabel = (val?: string | null) => {
    if (val === null || val === undefined || val === '') return '—';
    const n = Number(val);
    if (Number.isNaN(n)) return String(val);
    const abs = Math.abs(n);
    const hours = Math.floor(abs);
    const mins = Math.round((abs - hours) * 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const loadTimesheet = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setIsLoading(true);
    try {
      const response = await getCurrentTimesheet();
      if (response.success) {
        setTimesheet(response.data?.timesheet ?? null);
        setEntries(response.data?.entries ?? []);
      } else {
        showToast.error('Timesheet', response.message || 'Could not load timesheet');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Could not load timesheet. Please try again.';
      showToast.error('Timesheet', message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimesheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadTimesheet({ silent: true }).finally(() => setRefreshing(false));
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRange = (start?: string, end?: string) => {
    if (!start || !end) return '—';
    try {
      const s = new Date(start);
      const e = new Date(end);
      return `${s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#4caf50';
      case 'pending':
      case 'submitted':
        return '#ff9800';
      case 'rejected':
        return '#f44336';
      case 'draft':
        return '#757575';
      default:
        return '#757575';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#c8e6c9';
      case 'pending':
      case 'submitted':
        return '#ffe0b2';
      case 'rejected':
        return '#ffcdd2';
      case 'draft':
        return '#e0e0e0';
      default:
        return '#e0e0e0';
    }
  };

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
          activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timesheet Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {isLoading && !timesheet ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timesheet Information</Text>
            <Text style={styles.loadingText}>Loading timesheet…</Text>
          </View>
        ) : !timesheet ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timesheet Information</Text>
            <Text style={styles.loadingText}>No timesheet found</Text>
          </View>
        ) : (
          <>
            {/* Timesheet Summary Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Timesheet Information</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Period:</Text>
                <Text style={styles.summaryValue}>{timesheet.period_code}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date Range:</Text>
                <Text style={styles.summaryValue}>
                  {formatRange(timesheet.start_date, timesheet.end_date)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Status:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusBgColor(timesheet.status),
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(timesheet.status) },
                    ]}>
                    {timesheet.status}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Hours:</Text>
                <Text style={[styles.summaryValue, styles.totalHours]}>
                  {decimalHoursToLabel(timesheet.total_hours ?? null)}
                </Text>
              </View>
            </View>

            {/* Entries List */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Entries</Text>
              {entries.length === 0 ? (
                <Text style={styles.loadingText}>No entries</Text>
              ) : (
                entries.map((entry, index) => (
                  <View
                    key={String(entry.id ?? index)}
                    style={[
                      styles.entryItem,
                      index < entries.length - 1 && styles.entryBorder,
                    ]}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryDate}>
                        {formatDate(entry.date)} ({entry.day ?? '—'})
                      </Text>
                    </View>
                    <View style={styles.entryDetails}>
                      <View style={styles.entryRow}>
                        <Text style={styles.entryLabel}>Time:</Text>
                        <Text style={styles.entryValue}>
                          {stripSeconds(entry.start_time)} -{' '}
                          {stripSeconds(entry.finish_time)}
                        </Text>
                      </View>
                      <View style={styles.entryRow}>
                        <Text style={styles.entryLabel}>Break:</Text>
                        <Text style={styles.entryValue}>
                          {decimalHoursToLabel(entry.break_duration ?? null)}
                        </Text>
                      </View>
                      <View style={styles.entryRow}>
                        <Text style={styles.entryLabel}>Total:</Text>
                        <Text style={[styles.entryValue, styles.entryTotal]}>
                          {decimalHoursToLabel(entry.total_hours ?? null)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* Link to Full Attendance List */}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('AttendanceList')}
          activeOpacity={0.7}>
          <Text style={styles.linkButtonText}>
            View Full Attendance List →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  notchArea: {
    backgroundColor: '#0d1a5a',
    width: '100%',
  },
  header: {
    backgroundColor: '#1a237e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  totalHours: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryItem: {
    paddingVertical: 12,
  },
  entryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  entryHeader: {
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  entryDetails: {
    marginLeft: 8,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryLabel: {
    fontSize: 14,
    color: '#757575',
  },
  entryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  entryTotal: {
    fontWeight: '600',
    color: '#1a237e',
  },
  linkButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a237e',
    marginTop: 8,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
  },
  loadingText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default TimesheetDetailScreen;

