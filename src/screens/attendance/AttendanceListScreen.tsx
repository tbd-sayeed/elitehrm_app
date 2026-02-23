/**
 * Attendance List Screen - Display attendance entries
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';

type AttendanceListNavigationProp = StackNavigationProp<
  MainStackParamList,
  'AttendanceList'
>;

interface AttendanceEntry {
  id: string;
  date: string;
  dayOfWeek: string;
  type: 'attendance' | 'leave' | 'holiday';
  startTime?: string;
  finishTime?: string;
  breakDuration?: string;
  totalHours?: string;
  contractHours?: string;
  difference?: string;
  notes?: string;
  leaveType?: string;
  holidayName?: string;
}

const AttendanceListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AttendanceListNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-01');
  const [showFilters, setShowFilters] = useState(false);

  // Static data - will be replaced with API data later
  const attendanceEntries: AttendanceEntry[] = [
    {
      id: '1',
      date: '2026-01-12',
      dayOfWeek: 'Mon',
      type: 'attendance',
      startTime: '09:00',
      finishTime: '17:00',
      breakDuration: '1h',
      totalHours: '7h 0m',
      contractHours: '7h 30m',
      difference: '-0h 30m',
      notes: 'Regular work day',
    },
    {
      id: '2',
      date: '2026-01-11',
      dayOfWeek: 'Sun',
      type: 'leave',
      leaveType: 'Annual Leave',
    },
    {
      id: '3',
      date: '2026-01-10',
      dayOfWeek: 'Sat',
      type: 'holiday',
      holidayName: "New Year's Day",
    },
    {
      id: '4',
      date: '2026-01-09',
      dayOfWeek: 'Fri',
      type: 'attendance',
      startTime: '09:00',
      finishTime: '18:00',
      breakDuration: '1h',
      totalHours: '8h 0m',
      contractHours: '7h 30m',
      difference: '+0h 30m',
      notes: 'Overtime work',
    },
    {
      id: '5',
      date: '2026-01-08',
      dayOfWeek: 'Thu',
      type: 'attendance',
      startTime: '09:00',
      finishTime: '17:00',
      breakDuration: '1h',
      totalHours: '7h 0m',
      contractHours: '7h 30m',
      difference: '-0h 30m',
    },
    {
      id: '6',
      date: '2026-01-07',
      dayOfWeek: 'Wed',
      type: 'attendance',
      startTime: '09:00',
      finishTime: '17:00',
      breakDuration: '1h',
      totalHours: '7h 0m',
      contractHours: '7h 30m',
      difference: '-0h 30m',
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Static - will add API call later
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDifferenceColor = (difference?: string) => {
    if (!difference) return '#757575';
    if (difference.startsWith('+')) return '#4caf50'; // Green for overtime
    if (difference.startsWith('-')) return '#f44336'; // Red for under
    return '#757575';
  };

  const renderAttendanceCard = (entry: AttendanceEntry) => {
    if (entry.type === 'leave') {
      return (
        <View key={entry.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.dateIcon}>📅</Text>
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>
                {formatDate(entry.date)} ({entry.dayOfWeek})
              </Text>
            </View>
          </View>
          <View style={styles.leaveContainer}>
            <Text style={styles.leaveText}>Leave</Text>
            {entry.leaveType && (
              <Text style={styles.leaveTypeText}>{entry.leaveType}</Text>
            )}
          </View>
        </View>
      );
    }

    if (entry.type === 'holiday') {
      return (
        <View key={entry.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.dateIcon}>📅</Text>
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>
                {formatDate(entry.date)} ({entry.dayOfWeek})
              </Text>
            </View>
          </View>
          <View style={styles.holidayContainer}>
            <Text style={styles.holidayText}>Public Holiday</Text>
            {entry.holidayName && (
              <Text style={styles.holidayNameText}>{entry.holidayName}</Text>
            )}
          </View>
        </View>
      );
    }

    return (
      <View key={entry.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateIcon}>📅</Text>
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>
              {formatDate(entry.date)} ({entry.dayOfWeek})
            </Text>
          </View>
        </View>
        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>
            {entry.startTime} - {entry.finishTime}
          </Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Break:</Text>
          <Text style={styles.detailValue}>{entry.breakDuration}</Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValue}>{entry.totalHours}</Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Contract:</Text>
          <Text style={styles.detailValue}>{entry.contractHours}</Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Difference:</Text>
          <Text
            style={[
              styles.detailValue,
              { color: getDifferenceColor(entry.difference) },
            ]}>
            {entry.difference}
          </Text>
        </View>
        {entry.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{entry.notes}</Text>
          </View>
        )}
      </View>
    );
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
        <Text style={styles.headerTitle}>Attendance</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}>
          <Text style={styles.filterButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filters Section */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Month:</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="YYYY-MM"
              placeholderTextColor="#9e9e9e"
              value={selectedMonth}
              onChangeText={setSelectedMonth}
            />
          </View>
          <TouchableOpacity
            style={styles.applyFilterButton}
            activeOpacity={0.7}>
            <Text style={styles.applyFilterText}>Apply Filter</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {attendanceEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        ) : (
          attendanceEntries.map((entry) => renderAttendanceCard(entry))
        )}
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
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  filterButtonText: {
    fontSize: 20,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginRight: 12,
    width: 60,
  },
  filterInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#fafafa',
  },
  applyFilterButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  timeInfo: {
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#424242',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesText: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
  leaveContainer: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  leaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e65100',
    marginBottom: 4,
  },
  leaveTypeText: {
    fontSize: 14,
    color: '#e65100',
  },
  holidayContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  holidayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  holidayNameText: {
    fontSize: 14,
    color: '#1976d2',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
  },
});

export default AttendanceListScreen;

