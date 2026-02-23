/**
 * Timesheet Detail Screen - Display current timesheet details
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';

type TimesheetDetailNavigationProp = StackNavigationProp<
  MainStackParamList,
  'TimesheetDetail'
>;

const TimesheetDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TimesheetDetailNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  // Static data - will be replaced with API data later
  const timesheetData = {
    period: 'M01-2026',
    dateRange: 'January 1 - January 31, 2026',
    status: 'Approved',
    totalHours: '45h 30m',
    entries: [
      {
        date: '2026-01-12',
        dayOfWeek: 'Mon',
        startTime: '09:00',
        finishTime: '17:00',
        breakDuration: '1h',
        totalHours: '7h 0m',
      },
      {
        date: '2026-01-09',
        dayOfWeek: 'Fri',
        startTime: '09:00',
        finishTime: '18:00',
        breakDuration: '1h',
        totalHours: '8h 0m',
      },
      {
        date: '2026-01-08',
        dayOfWeek: 'Thu',
        startTime: '09:00',
        finishTime: '17:00',
        breakDuration: '1h',
        totalHours: '7h 0m',
      },
    ],
  };

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
        {/* Timesheet Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timesheet Information</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Period:</Text>
            <Text style={styles.summaryValue}>{timesheetData.period}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date Range:</Text>
            <Text style={styles.summaryValue}>{timesheetData.dateRange}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status:</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusBgColor(timesheetData.status),
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(timesheetData.status) },
                ]}>
                {timesheetData.status}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Hours:</Text>
            <Text style={[styles.summaryValue, styles.totalHours]}>
              {timesheetData.totalHours}
            </Text>
          </View>
        </View>

        {/* Entries List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entries</Text>
          {timesheetData.entries.map((entry, index) => (
            <View
              key={index}
              style={[
                styles.entryItem,
                index < timesheetData.entries.length - 1 && styles.entryBorder,
              ]}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>
                  {formatDate(entry.date)} ({entry.dayOfWeek})
                </Text>
              </View>
              <View style={styles.entryDetails}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLabel}>Time:</Text>
                  <Text style={styles.entryValue}>
                    {entry.startTime} - {entry.finishTime}
                  </Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLabel}>Break:</Text>
                  <Text style={styles.entryValue}>{entry.breakDuration}</Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLabel}>Total:</Text>
                  <Text style={[styles.entryValue, styles.entryTotal]}>
                    {entry.totalHours}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

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
});

export default TimesheetDetailScreen;

