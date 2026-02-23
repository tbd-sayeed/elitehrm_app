/**
 * Dashboard Screen - Main screen after login
 * @format
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Alert } from 'react-native';
import { navigationRef } from '../../utils/navigationRef';
import { logout as logoutAPI } from '../../api/auth';
import { clearAllStorage } from '../../utils/storage';
import { useAuthStore } from '../../store/authStore';

type DashboardNavigationProp = StackNavigationProp<MainStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DashboardNavigationProp>();
  const { logout: logoutStore, user, dashboardData } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Get employee information from user data
  const employeeName = user
    ? `${user.first_name} ${user.last_name}`
    : 'Employee';
  const employeeDesignation = user?.positions?.[0]?.name || 'Employee';
  const companyName = user?.company?.name || 'Company';

  // Places of work (active only)
  const placesOfWork =
    user?.places_of_work?.filter((p: { is_active?: boolean }) => p.is_active !== false) ?? [];

  // Get leave statistics from dashboard data
  const leaveStats = dashboardData?.leaveStatistics?.summary
    ? {
        total: dashboardData.leaveStatistics.summary.total_allowed,
        taken: dashboardData.leaveStatistics.summary.total_taken,
        remaining: dashboardData.leaveStatistics.summary.total_remaining,
      }
    : {
        total: 0,
        taken: 0,
        remaining: 0,
      };

  // Get latest timesheet from dashboard data
  const latestTimesheet = dashboardData?.latestTimesheet
    ? {
        period: dashboardData.latestTimesheet.period_code,
        status: dashboardData.latestTimesheet.status,
        hours: dashboardData.latestTimesheet.total_hours,
      }
    : {
        period: 'N/A',
        status: 'N/A',
        hours: '0h 0m',
      };

  // Get last attendance from dashboard data
  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    // If time is already formatted (contains AM/PM), return as is
    if (time.includes('AM') || time.includes('PM')) {
      return time;
    }
    // If time is in HH:MM:SS or HH:MM format, convert to 12-hour format
    const timeParts = time.split(':');
    if (timeParts.length >= 2) {
      const hour = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return time;
  };

  const formatTimeSchedule = (time: string | null) => {
    if (!time) return '';
    const timeParts = time.split(':');
    if (timeParts.length >= 2) {
      const hour = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];
      const ampm = hour >= 12 ? 'pm' : 'am';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return time;
  };

  const formatBreakDuration = (
    breakStart: string | null,
    breakEnd: string | null,
  ) => {
    if (!breakStart || !breakEnd) return null;
    const [sH, sM] = breakStart.split(':').map(Number);
    const [eH, eM] = breakEnd.split(':').map(Number);
    const totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (totalMinutes <= 0) return null;
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    const dates: { dayName: string; date: Date }[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push({ dayName: dayNames[i], date: d });
    }
    return dates;
  };

  const currentTimesheetRows = React.useMemo(() => {
    const pattern = dashboardData?.workingPatterns?.current;
    if (!pattern?.days?.length) return [];
    const weekDates = getCurrentWeekDates();
    return pattern.days.map((dayData, idx) => {
      const { date } = weekDates[idx];
      const dayShort = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = date.getDate();
      const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
      const datePart = `${dayShort} ${dayNum} ${monthShort}`;
      if (!dayData.is_working_day) {
        return { line: `${datePart} · Day off`, isOff: true };
      }
      const start = formatTimeSchedule(dayData.work_start_time);
      const end = formatTimeSchedule(dayData.work_end_time);
      const breakDur = formatBreakDuration(
        dayData.break_start_time,
        dayData.break_end_time,
      );
      const timePart = breakDur
        ? `${start} – ${end} · ${breakDur} break`
        : `${start} – ${end}`;
      return { line: `${datePart}, ${timePart}`, isOff: false };
    });
  }, [dashboardData?.workingPatterns?.current]);

  const shiftStatus = React.useMemo(() => {
    const pattern = dashboardData?.workingPatterns?.current;
    if (!pattern?.days?.length) return null;

    const dayOfWeek = now.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const todayData = pattern.days[dayIndex];
    if (!todayData) return null;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;

    const formatCurrentTime = () => {
      const h = currentHour % 12 || 12;
      const m = currentMinute.toString().padStart(2, '0');
      const ampm = currentHour >= 12 ? 'pm' : 'am';
      return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
    };

    const formatDuration = (mins: number) => {
      if (mins < 60) return `${mins}m`;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const formatDurationLong = (mins: number) => {
      if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`;
      return `${h} hour${h !== 1 ? 's' : ''} and ${m} min${m !== 1 ? 's' : ''}`;
    };

    const startStr = todayData.work_start_time;
    const endStr = todayData.work_end_time;
    const scheduleLine =
      startStr && endStr
        ? `${formatTimeSchedule(startStr)} – ${formatTimeSchedule(endStr)}`
        : null;

    if (!todayData.is_working_day) {
      return {
        type: 'day_off' as const,
        primary: formatCurrentTime(),
        secondary: 'No working schedule / Day Off',
        scheduleLine: null,
      };
    }

    if (!startStr || !endStr) return null;

    const [sH, sM] = startStr.split(':').map(Number);
    const [eH, eM] = endStr.split(':').map(Number);
    const startMinutes = sH * 60 + sM;
    const endMinutes = eH * 60 + eM;

    if (currentMinutes < startMinutes) {
      const minsUntilStart = startMinutes - currentMinutes;
      return {
        type: 'before_shift' as const,
        primary: formatCurrentTime(),
        secondary: `Shift starting in ${formatDurationLong(minsUntilStart)}`,
        scheduleLine,
      };
    }

    if (currentMinutes >= endMinutes) {
      return {
        type: 'after_shift' as const,
        primary: formatCurrentTime(),
        secondary: 'Shift ended',
        scheduleLine,
      };
    }

    const elapsedMinutes = currentMinutes - startMinutes;
    const remainingMinutes = endMinutes - currentMinutes;
    return {
      type: 'on_shift' as const,
      primary: formatDuration(elapsedMinutes),
      secondary: `On shift, Shift complete in ${formatDurationLong(remainingMinutes)}`,
      scheduleLine,
    };
  }, [dashboardData?.workingPatterns?.current, now]);

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      present: 'Present',
      absent: 'Absent',
      day_off: 'Day Off',
      public_holiday: 'Public Holiday',
      leave: 'On Leave',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const getStatusBadgeStyle = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'present') {
      return styles.statusPresent;
    } else if (statusLower === 'day_off' || statusLower === 'public_holiday') {
      return styles.statusDayOff;
    } else if (statusLower === 'absent') {
      return styles.statusAbsent;
    }
    return styles.statusPresent;
  };

  const getTimesheetStatusStyle = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved') {
      return styles.statusApproved;
    } else if (statusLower === 'draft') {
      return styles.statusDraft;
    } else if (statusLower === 'rejected') {
      return styles.statusRejected;
    }
    return styles.statusDraft;
  };

  const formatTimesheetStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const lastAttendance = dashboardData?.lastAttendance
    ? {
        date: formatDate(dashboardData.lastAttendance.date),
        day: dashboardData.lastAttendance.day,
        checkIn: formatTime(dashboardData.lastAttendance.checkin),
        checkOut: formatTime(dashboardData.lastAttendance.checkout),
        totalHours: dashboardData.lastAttendance.total_hours || '0h 0m',
        status: formatStatus(dashboardData.lastAttendance.status),
        rawStatus: dashboardData.lastAttendance.status,
      }
    : {
        date: 'N/A',
        day: 'N/A',
        checkIn: 'N/A',
        checkOut: 'N/A',
        totalHours: '0h 0m',
        status: 'N/A',
        rawStatus: '',
      };

  // Get public holidays from dashboard data
  const formatHolidayDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const publicHolidays = dashboardData?.publicHolidays?.holidays
    ? dashboardData.publicHolidays.holidays
        .slice(0, 5) // Show only first 5 holidays
        .map((holiday) => ({
          name: holiday.name,
          date: formatHolidayDate(holiday.date),
        }))
    : [];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Static - will add API call later
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const tabNav = navigation.getParent();

  const handleViewAttendance = () => {
    (tabNav as any)?.navigate('Attendance');
  };

  const handleRequestLeave = () => {
    (tabNav as any)?.navigate('Leave', { screen: 'CreateLeave' });
  };

  const handleViewProfile = () => {
    (tabNav as any)?.navigate('Profile');
  };

  const handleViewDocuments = () => {
    (tabNav as any)?.navigate('Profile', { screen: 'Documents' });
  };

  const handleViewWhatYouCanDo = () => {
    navigation.navigate('WhatYouCanDo');
  };

  // Document notices: missing and expiring/expired
  const missingDocs = user?.document_categories?.missing_items ?? [];
  const documentItems = user?.documents?.items ?? [];
  const expiredOrExpiringDocs = documentItems.filter(
    (d: { is_expired?: boolean; expires_in_days?: number | null }) =>
      d.is_expired || (d.expires_in_days != null && d.expires_in_days <= 30),
  );
  const hasDocumentNotices = missingDocs.length > 0 || expiredOrExpiringDocs.length > 0;

  const handleViewLeaveList = () => {
    (tabNav as any)?.navigate('Leave');
  };

  const handleViewLeaveBalances = () => {
    (tabNav as any)?.navigate('Leave', { screen: 'LeaveBalances' });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call logout API
              await logoutAPI();
              
              // Clear all storage (tokens, user data, etc.)
              await clearAllStorage();
              
              // Clear auth store
              logoutStore();
              
              // Navigate back to Auth flow
              if (navigationRef.isReady()) {
                navigationRef.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Auth' }],
                  }),
                );
              } else {
                // Fallback: try using parent navigator
                const rootNav = navigation.getParent();
                if (rootNav) {
                  rootNav.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'Auth' }],
                    }),
                  );
                } else {
                  Alert.alert('Error', 'Navigation not ready. Please restart the app.');
                }
              }
            } catch (error) {
              console.error('Logout error:', error);
              // Even if API call fails, clear local data and logout
              try {
                await clearAllStorage();
                logoutStore();
                if (navigationRef.isReady()) {
                  navigationRef.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'Auth' }],
                    }),
                  );
                }
              } catch (clearError) {
                console.error('Error clearing storage:', clearError);
                Alert.alert('Error', 'Unable to logout. Please restart the app.');
              }
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1a5a" />
      
      {/* Notch area - darker colored background */}
      <View style={[styles.notchArea, { height: insets.top }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.employeeName}>{employeeName}</Text>
            <Text style={styles.employeeDesignation}>{employeeDesignation} • {companyName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.profilePhoto}
              onPress={handleViewProfile}
              activeOpacity={0.7}>
              {user?.photo_url ? (
                <Image
                  source={{ uri: user.photo_url }}
                  style={styles.profilePhotoImage}
                />
              ) : (
                <Text style={styles.profilePhotoText}>
                  {employeeName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Shift Status Block */}
        {shiftStatus && (
          <View
            style={[
              styles.shiftStatusCard,
              shiftStatus.type === 'day_off' && styles.shiftStatusDayOff,
              shiftStatus.type === 'before_shift' && styles.shiftStatusBefore,
              shiftStatus.type === 'on_shift' && styles.shiftStatusOnShift,
              shiftStatus.type === 'after_shift' && styles.shiftStatusAfter,
            ]}>
            <View style={styles.shiftStatusContent}>
              <Text style={styles.shiftStatusLabel}>TODAY</Text>
              <Text style={styles.shiftStatusPrimary}>{shiftStatus.primary}</Text>
              <Text style={styles.shiftStatusSecondary}>{shiftStatus.secondary}</Text>
              {shiftStatus.scheduleLine && (
                <Text style={styles.shiftStatusScheduleLine}>
                  {shiftStatus.scheduleLine}
                </Text>
              )}
              {placesOfWork.length > 0 && (
                <Text style={styles.shiftStatusPlacesOfWork}>
                  {placesOfWork.map((p: { name: string }) => p.name).join(' · ')}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Important notices – missing / expiring documents */}
        {hasDocumentNotices && (
          <TouchableOpacity
            style={styles.noticeCard}
            onPress={handleViewDocuments}
            activeOpacity={0.8}>
            <View style={styles.noticeHeader}>
              <Text style={styles.noticeTitle}>Important notices</Text>
              <Text style={styles.noticeViewAll}>View documents →</Text>
            </View>
            <Text style={styles.noticeSubtitle}>
              Please review and submit documents as soon as possible.
            </Text>
            {missingDocs.length > 0 && (
              <View style={styles.noticeBlock}>
                <Text style={styles.noticeBlockLabel}>Missing documents</Text>
                {missingDocs.slice(0, 3).map((cat: { id: number; name: string }) => (
                  <Text key={cat.id} style={styles.noticeItem}>• {cat.name}</Text>
                ))}
                {missingDocs.length > 3 && (
                  <Text style={styles.noticeItem}>• +{missingDocs.length - 3} more</Text>
                )}
              </View>
            )}
            {expiredOrExpiringDocs.length > 0 && (
              <View style={styles.noticeBlock}>
                <Text style={styles.noticeBlockLabel}>Expired or expiring soon</Text>
                {expiredOrExpiringDocs.slice(0, 3).map((doc: { id: number; name: string; is_expired?: boolean; expires_in_days?: number | null }) => (
                  <Text key={doc.id} style={styles.noticeItem}>
                    • {doc.name}
                    {doc.is_expired
                      ? ' (expired)'
                      : doc.expires_in_days != null
                      ? ` (${doc.expires_in_days} days left)`
                      : ''}
                  </Text>
                ))}
                {expiredOrExpiringDocs.length > 3 && (
                  <Text style={styles.noticeItem}>• +{expiredOrExpiringDocs.length - 3} more</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Current Timesheet (Working Schedule) Card */}
        {currentTimesheetRows.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Timesheet</Text>
            <Text style={styles.cardSubtitle}>This week's schedule</Text>
            {currentTimesheetRows.map((row, index) => (
              <View
                key={index}
                style={[
                  styles.timesheetRowItem,
                  index < currentTimesheetRows.length - 1 &&
                    styles.timesheetRowItemBorder,
                ]}>
                <Text
                  style={[
                    styles.timesheetRowLine,
                    row.isOff && styles.timesheetRowLineOff,
                  ]}>
                  {row.line}
                </Text>
              </View>
            ))}
            {placesOfWork.length > 0 && (
              <View style={styles.placesOfWorkSection}>
                <Text style={styles.placesOfWorkLabel}>Places of work</Text>
                <Text style={styles.placesOfWorkText}>
                  {placesOfWork.map((p: { name: string }) => p.name).join(' · ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Last Attendance Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleViewAttendance}
          activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Last Attendance</Text>
            <Text style={styles.viewAllText}>View All →</Text>
          </View>
          <View style={styles.attendanceInfo}>
            <View style={styles.attendanceDateRow}>
              <Text style={styles.attendanceDate}>{lastAttendance.date}</Text>
              <Text style={styles.attendanceDay}>{lastAttendance.day}</Text>
            </View>
            <View style={styles.attendanceDetails}>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Check In:</Text>
                <Text style={styles.attendanceValue}>{lastAttendance.checkIn}</Text>
              </View>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Check Out:</Text>
                <Text style={styles.attendanceValue}>{lastAttendance.checkOut}</Text>
              </View>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Total Hours:</Text>
                <Text style={styles.attendanceValue}>{lastAttendance.totalHours}</Text>
              </View>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Status:</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(lastAttendance.rawStatus)]}>
                  <Text style={[
                    styles.statusText,
                    lastAttendance.rawStatus === 'day_off' || lastAttendance.rawStatus === 'public_holiday' 
                      ? styles.statusTextDayOff 
                      : lastAttendance.rawStatus === 'absent'
                      ? styles.statusTextAbsent
                      : styles.statusTextPresent
                  ]}>
                    {lastAttendance.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Latest Timesheet Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => (tabNav as any)?.navigate('Attendance', { screen: 'TimesheetDetail' })}
          activeOpacity={0.7}>
          <Text style={styles.cardTitle}>Latest Timesheet</Text>
          <View style={styles.timesheetInfo}>
            <View style={styles.timesheetRow}>
              <Text style={styles.timesheetLabel}>Period:</Text>
              <Text style={styles.timesheetValue}>{latestTimesheet.period}</Text>
            </View>
            <View style={styles.timesheetRow}>
              <Text style={styles.timesheetLabel}>Status:</Text>
              <View style={[styles.statusBadge, getTimesheetStatusStyle(latestTimesheet.status)]}>
                <Text style={[
                  styles.statusText,
                  latestTimesheet.status.toLowerCase() === 'approved'
                    ? styles.statusTextApproved
                    : latestTimesheet.status.toLowerCase() === 'draft'
                    ? styles.statusTextDraft
                    : styles.statusTextRejected
                ]}>
                  {formatTimesheetStatus(latestTimesheet.status)}
                </Text>
              </View>
            </View>
            <View style={styles.timesheetRow}>
              <Text style={styles.timesheetLabel}>Hours:</Text>
              <Text style={styles.timesheetValue}>{latestTimesheet.hours}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Upcoming Public Holidays Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Public Holidays</Text>
          {publicHolidays.length > 0 ? (
            publicHolidays.map((holiday, index) => (
              <View key={index} style={styles.holidayItem}>
                <View style={styles.holidayDot} />
                <Text style={styles.holidayText}>
                  {holiday.name} - {holiday.date}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No upcoming holidays</Text>
          )}
        </View>

        {/* Leave Statistics Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleViewLeaveList}
          activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Leave Statistics</Text>
            <Text style={styles.viewAllText}>View All →</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{leaveStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{leaveStats.taken}</Text>
              <Text style={styles.statLabel}>Taken</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, styles.statNumberRemaining]}>
                {leaveStats.remaining}
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewAttendance}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>📅 View Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewLeaveList}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>📋 View Leave List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRequestLeave}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>➕ Request Leave</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewLeaveBalances}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>📊 View Leave Balances</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewDocuments}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>📄 My Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewProfile}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>👤 View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewWhatYouCanDo}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>ℹ️ What you can do</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  employeeName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  employeeDesignation: {
    fontSize: 12,
    color: '#E3F2FD',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  profilePhoto: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profilePhotoImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  profilePhotoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  shiftStatusCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  noticeCard: {
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fff8e1',
    borderLeftWidth: 5,
    borderLeftColor: '#e65100',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e65100',
  },
  noticeViewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a237e',
  },
  noticeSubtitle: {
    fontSize: 13,
    color: '#5d4037',
    marginBottom: 12,
  },
  noticeBlock: {
    marginBottom: 8,
  },
  noticeBlockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5d4037',
    marginBottom: 4,
  },
  noticeItem: {
    fontSize: 13,
    color: '#3e2723',
    marginLeft: 4,
    marginBottom: 2,
  },
  shiftStatusOnShift: {
    backgroundColor: '#f1f8e9',
    borderLeftWidth: 5,
    borderLeftColor: '#2e7d32',
  },
  shiftStatusBefore: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 5,
    borderLeftColor: '#1565c0',
  },
  shiftStatusDayOff: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 5,
    borderLeftColor: '#e65100',
  },
  shiftStatusAfter: {
    backgroundColor: '#fafafa',
    borderLeftWidth: 5,
    borderLeftColor: '#616161',
  },
  shiftStatusContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#757575',
    letterSpacing: 1,
    marginBottom: 6,
  },
  shiftStatusPrimary: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  shiftStatusSecondary: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '500',
    marginTop: 8,
    lineHeight: 20,
    textAlign: 'center',
  },
  shiftStatusScheduleLine: {
    fontSize: 13,
    color: '#757575',
    marginTop: 8,
    lineHeight: 18,
  },
  shiftStatusPlacesOfWork: {
    fontSize: 13,
    color: '#757575',
    marginTop: 10,
    lineHeight: 18,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 16,
  },
  timesheetRowItem: {
    paddingVertical: 12,
  },
  timesheetRowItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timesheetRowLine: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },
  timesheetRowLineOff: {
    color: '#9e9e9e',
    fontStyle: 'italic',
  },
  placesOfWorkSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placesOfWorkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 6,
  },
  placesOfWorkText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  statNumberRemaining: {
    color: '#4caf50',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  timesheetInfo: {
    gap: 12,
  },
  timesheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timesheetLabel: {
    fontSize: 16,
    color: '#757575',
  },
  timesheetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusApproved: {
    backgroundColor: '#c8e6c9',
  },
  statusPresent: {
    backgroundColor: '#c8e6c9',
  },
  statusDayOff: {
    backgroundColor: '#fff3cd',
  },
  statusAbsent: {
    backgroundColor: '#ffcdd2',
  },
  statusDraft: {
    backgroundColor: '#e3f2fd',
  },
  statusRejected: {
    backgroundColor: '#ffcdd2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPresent: {
    color: '#2e7d32',
  },
  statusTextApproved: {
    color: '#2e7d32',
  },
  statusTextDayOff: {
    color: '#856404',
  },
  statusTextAbsent: {
    color: '#c62828',
  },
  statusTextDraft: {
    color: '#1976d2',
  },
  statusTextRejected: {
    color: '#c62828',
  },
  noDataText: {
    fontSize: 14,
    color: '#9e9e9e',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  attendanceInfo: {
    gap: 12,
  },
  attendanceDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  attendanceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  attendanceDay: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  attendanceDetails: {
    gap: 10,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 15,
    color: '#757575',
  },
  attendanceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  holidayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a237e',
    marginRight: 12,
  },
  holidayText: {
    fontSize: 16,
    color: '#424242',
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
  },
});

export default DashboardScreen;
