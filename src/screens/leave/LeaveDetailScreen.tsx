/**
 * Leave Detail Screen - Display full leave request details
 * @format
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { getLeaveDetail } from '../../api/leave';

type LeaveDetailNavigationProp = StackNavigationProp<
  MainStackParamList,
  'LeaveDetail'
>;
type LeaveDetailRouteProp = RouteProp<MainStackParamList, 'LeaveDetail'>;

const calcDays = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
};

const formatDaysText = (value: unknown, fallbackDays: number) => {
  if (typeof value === 'string') {
    const s = value.trim();
    if (s && !Number.isNaN(Number(s))) return s;
    const match = s.match(/-?\d+(?:\.\d+)?/);
    if (match?.[0]) return match[0];
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return String(fallbackDays);
};

const isNumericLike = (v: unknown) => {
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return false;
    return !Number.isNaN(Number(s)) || Boolean(s.match(/-?\d+(?:\.\d+)?/));
  }
  return false;
};

const getApiDays = (item: any) => {
  const direct =
    item?.total_days ??
    item?.number_of_days ??
    item?.days ??
    item?.duration ??
    item?.totalDays ??
    item?.total_days_requested ??
    item?.days_requested ??
    item?.requested_days ??
    item?.leave_days ??
    item?.leaveDays ??
    null;

  if (direct != null) return direct;

  // Last resort: scan unknown key names (backend variations)
  try {
    const entries = Object.entries(item || {});
    for (const [k, v] of entries) {
      const key = String(k).toLowerCase();
      if (key.includes('day') && !key.includes('start') && !key.includes('end') && isNumericLike(v)) {
        return v;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

const LeaveDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LeaveDetailNavigationProp>();
  const route = useRoute<LeaveDetailRouteProp>();
  const leaveId = route.params?.id || '';
  const daysTextFromList = route.params?.daysText;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveDetail, setLeaveDetail] = useState<{
    policyName: string;
    startDate: string;
    endDate: string;
    daysText: string;
    status: string;
    comments: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    approvedBy: string | null;
    statusChangeNotes: string | null;
  } | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!leaveId) {
      setError('Invalid leave ID');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const response = await getLeaveDetail(leaveId);
      if (response.success && response.data) {
        const d = response.data;
        const fallback = calcDays(d.start_date, d.end_date);
        const apiDays = getApiDays(d as any);
        const effectiveDays = apiDays != null ? apiDays : daysTextFromList;
        setLeaveDetail({
          policyName: d.time_off_policy?.name ?? 'Leave',
          startDate: d.start_date,
          endDate: d.end_date,
          daysText: formatDaysText(effectiveDays, fallback),
          status: d.status,
          comments: d.comments ?? null,
          createdAt: d.created_at ?? null,
          updatedAt: d.updated_at ?? null,
          approvedBy: d.approved_by?.name ?? null,
          statusChangeNotes: d.status_change_note ?? null,
        });
      } else {
        setError('Failed to load leave details');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load leave details');
      setLeaveDetail(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leaveId, daysTextFromList]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail();
  }, [fetchDetail]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (loading && !leaveDetail) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0d1a5a" />
        
        {/* Notch area - darker colored background */}
        <View style={[styles.notchArea, { height: insets.top }]} />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>Loading leave details...</Text>
        </View>
      </View>
    );
  }

  if (error && !leaveDetail) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0d1a5a" />
        
        {/* Notch area - darker colored background */}
        <View style={[styles.notchArea, { height: insets.top }]} />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => { setLoading(true); fetchDetail(); }}
            activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!leaveDetail) return null;

  const statusConfig = getStatusConfig(leaveDetail.status);

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
        <Text style={styles.headerTitle}>Leave Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text
              style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Leave Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leave Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Policy:</Text>
            <Text style={styles.infoValue}>{leaveDetail.policyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date:</Text>
            <Text style={styles.infoValue}>
              {formatDate(leaveDetail.startDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date:</Text>
            <Text style={styles.infoValue}>
              {formatDate(leaveDetail.endDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Number of Days:</Text>
            <Text style={styles.infoValue}>{leaveDetail.daysText} days</Text>
          </View>
        </View>

        {/* Comments Card */}
        {leaveDetail.comments && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Comments</Text>
            <Text style={styles.commentsText}>{leaveDetail.comments}</Text>
          </View>
        )}

        {/* Approval Information Card */}
        {(leaveDetail.status === 'approved' ||
          leaveDetail.status === 'rejected') && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Approval Information</Text>
            {leaveDetail.approvedBy && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Approved By:</Text>
                <Text style={styles.infoValue}>{leaveDetail.approvedBy}</Text>
              </View>
            )}
            {leaveDetail.statusChangeNotes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>
                  {leaveDetail.statusChangeNotes}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Timestamps Card */}
        {(leaveDetail.createdAt || leaveDetail.updatedAt) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timestamps</Text>
            {leaveDetail.createdAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(leaveDetail.createdAt)}
                </Text>
              </View>
            )}
            {leaveDetail.updatedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Updated:</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(leaveDetail.updatedAt)}
                </Text>
              </View>
            )}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
    textAlign: 'right',
  },
  commentsText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
});

export default LeaveDetailScreen;

