/**
 * Leave List Screen - Display leave requests
 * @format
 */

import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { getLeaveList, type LeaveListItem } from '../../api/leave';

type LeaveListNavigationProp = StackNavigationProp<
  MainStackParamList,
  'LeaveList'
>;

interface LeaveRequest {
  id: string;
  policyName: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  comments?: string;
}

const calcDays = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
};

const mapApiToRequest = (item: LeaveListItem): LeaveRequest => ({
  id: String(item.id),
  policyName: item.time_off_policy?.name ?? 'Leave',
  startDate: item.start_date,
  endDate: item.end_date,
  days: calcDays(item.start_date, item.end_date),
  status: item.status as LeaveRequest['status'],
  comments: item.comments,
});

const LeaveListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LeaveListNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeaves = useCallback(async (showLoading = true) => {
    try {
      setError(null);
      if (showLoading) setLoading(true);
      const params =
        selectedStatus !== 'all' ? { status: selectedStatus } : undefined;
      const response = await getLeaveList(params);
      const raw = response.data;
      const leaves = Array.isArray(raw)
        ? raw
        : (raw as any)?.leaves ?? [];
      setLeaveRequests(leaves.map(mapApiToRequest));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load leave requests');
      setLeaveRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus]);

  // Fetch when screen comes into focus (including after creating new leave)
  useFocusEffect(
    useCallback(() => {
      fetchLeaves();
    }, [fetchLeaves])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaves(false);
  }, [fetchLeaves]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start.getTime() === end.getTime()) {
      return formatDate(startDate);
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: '🟡',
          text: 'Pending',
          color: '#ff9800',
          bgColor: '#fff3e0',
        };
      case 'approved':
        return {
          icon: '✅',
          text: 'Approved',
          color: '#4caf50',
          bgColor: '#c8e6c9',
        };
      case 'rejected':
        return {
          icon: '❌',
          text: 'Rejected',
          color: '#f44336',
          bgColor: '#ffcdd2',
        };
      case 'cancelled':
        return {
          icon: '🚫',
          text: 'Cancelled',
          color: '#757575',
          bgColor: '#e0e0e0',
        };
      default:
        return {
          icon: '⚪',
          text: status,
          color: '#757575',
          bgColor: '#e0e0e0',
        };
    }
  };

  const filteredRequests =
    selectedStatus === 'all'
      ? leaveRequests
      : leaveRequests.filter((req) => req.status === selectedStatus);

  const handleCreateLeave = () => {
    navigation.navigate('CreateLeave');
  };

  const handleViewDetail = (leaveId: string) => {
    navigation.navigate('LeaveDetail', { id: leaveId });
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
        <Text style={styles.headerTitle}>Leave Requests</Text>
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
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.statusFilters}>
            {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(
              (status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusFilterButton,
                    selectedStatus === status && styles.statusFilterActive,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.statusFilterText,
                      selectedStatus === status &&
                        styles.statusFilterTextActive,
                    ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateLeave}
          activeOpacity={0.8}>
          <Text style={styles.createButtonText}>+ New Request</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.balancesButton}
          onPress={() => navigation.navigate('LeaveBalances')}
          activeOpacity={0.8}>
          <Text style={styles.balancesButtonText}>View Balances</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>Loading leave requests...</Text>
          </View>
        ) : error && leaveRequests.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No leave requests found</Text>
          </View>
        ) : (
          filteredRequests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            return (
              <TouchableOpacity
                key={request.id}
                style={styles.card}
                onPress={() => handleViewDetail(request.id)}
                activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusConfig.bgColor },
                    ]}>
                    <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusConfig.color },
                      ]}>
                      {statusConfig.text}
                    </Text>
                  </View>
                </View>
                <Text style={styles.policyName}>{request.policyName}</Text>
                <Text style={styles.dateRange}>
                  {formatDateRange(request.startDate, request.endDate)}
                </Text>
                <Text style={styles.days}>{request.days} days</Text>
                {request.comments && (
                  <View style={styles.commentsContainer}>
                    <Text style={styles.commentsLabel}>Comments:</Text>
                    <Text style={styles.commentsText} numberOfLines={2}>
                      {request.comments}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
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
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 12,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusFilterActive: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#424242',
  },
  statusFilterTextActive: {
    color: '#ffffff',
  },
  createButtonContainer: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  createButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  balancesButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a237e',
  },
  balancesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
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
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  policyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 6,
  },
  days: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 8,
  },
  commentsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: '#424242',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
  },
  errorContainer: {
    padding: 24,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
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

export default LeaveListScreen;
