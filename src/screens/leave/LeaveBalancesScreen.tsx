/**
 * Leave Balances Screen - Display leave policy balances
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useAuthStore } from '../../store/authStore';
import { getLeaveBalances, type LeaveBalanceItem } from '../../api/leave';

type LeaveBalancesNavigationProp = StackNavigationProp<
  MainStackParamList,
  'LeaveBalances'
>;

interface LeaveBalance {
  id: string;
  policyName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

const mapApiToBalance = (item: LeaveBalanceItem): LeaveBalance => ({
  id: String(item.time_off_policy.id),
  policyName: item.time_off_policy.name,
  totalDays: item.total_days,
  usedDays: item.used_days,
  remainingDays: item.remaining_days,
});

const LeaveBalancesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LeaveBalancesNavigationProp>();
  const { dashboardData } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);

  const fetchBalances = useCallback(async () => {
    try {
      setError(null);
      const response = await getLeaveBalances();
      if (response.success && response.data?.length) {
        setLeaveBalances(response.data.map(mapApiToBalance));
      } else {
        // Fallback to dashboard data from login
        const fromDashboard = dashboardData?.leaveStatistics?.by_policy;
        if (fromDashboard?.length) {
          setLeaveBalances(
            fromDashboard.map((p) => ({
              id: String(p.time_off_policy_id),
              policyName: p.policy_name,
              totalDays: p.total_allowed,
              usedDays: p.days_taken,
              remainingDays: p.days_remaining,
            }))
          );
        } else {
          setLeaveBalances([]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load balances');
      // Fallback to dashboard data if API fails
      const fromDashboard = dashboardData?.leaveStatistics?.by_policy;
      if (fromDashboard?.length) {
        setLeaveBalances(
          fromDashboard.map((p) => ({
            id: String(p.time_off_policy_id),
            policyName: p.policy_name,
            totalDays: p.total_allowed,
            usedDays: p.days_taken,
            remainingDays: p.days_remaining,
          }))
        );
      } else {
        setLeaveBalances([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dashboardData?.leaveStatistics?.by_policy]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBalances();
  }, [fetchBalances]);

  const getProgressPercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return (used / total) * 100;
  };

  const getProgressColor = (percentage: number, usedDays: number) => {
    if (usedDays === 0) return '#9e9e9e'; // Neutral gray when nothing used
    if (percentage >= 90) return '#f44336'; // Red - almost exhausted
    if (percentage >= 70) return '#ff9800'; // Orange - low
    return '#4caf50'; // Green - good
  };

  const renderProgressBar = (balance: LeaveBalance) => {
    const percentage = getProgressPercentage(
      balance.usedDays,
      balance.totalDays,
    );
    const color = getProgressColor(percentage, balance.usedDays);

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {balance.usedDays}/{balance.totalDays}
        </Text>
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
        <Text style={styles.headerTitle}>Leave Balances</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Year Display */}
        <View style={styles.yearContainer}>
          <Text style={styles.yearText}>
            Leave Balances ({new Date().getFullYear()})
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>Loading balances...</Text>
          </View>
        ) : error && leaveBalances.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : leaveBalances.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No leave balances found</Text>
          </View>
        ) : (
          <>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}
            {/* Balance Cards */}
            {leaveBalances.map((balance) => {
          const percentage = getProgressPercentage(
            balance.usedDays,
            balance.totalDays,
          );
          const color = getProgressColor(percentage, balance.usedDays);

          return (
            <View key={balance.id} style={styles.card}>
              <Text style={styles.policyName}>{balance.policyName}</Text>
              {renderProgressBar(balance)}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total</Text>
                  <Text style={styles.statValue}>{balance.totalDays} days</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Used</Text>
                  <Text style={[styles.statValue, { color: '#f44336' }]}>
                    {balance.usedDays} days
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text style={[styles.statValue, { color: color }]}>
                    {balance.remainingDays} days
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
          </>
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
  yearContainer: {
    marginBottom: 20,
    paddingTop: 16,
  },
  yearText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
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
  errorBanner: {
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  errorBannerText: {
    fontSize: 14,
    color: '#e65100',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
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
  policyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
});

export default LeaveBalancesScreen;

