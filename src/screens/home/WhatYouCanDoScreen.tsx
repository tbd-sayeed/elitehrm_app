/**
 * What You Can Do Screen - Detailed overview of app features
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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getCenteredTextMaxWidth, getScreenHorizontalPadding } from '../../utils/layout';

type WhatYouCanDoNavigationProp = StackNavigationProp<MainStackParamList, 'WhatYouCanDo'>;

const FeatureCard: React.FC<{
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  cta: string;
  onPress: () => void;
}> = ({ icon, iconBg, iconColor, title, description, cta, onPress }) => {
  return (
    <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.featureTopRow}>
        <View style={[styles.featureIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{description}</Text>
      <View style={styles.featureCtaRow}>
        <Text style={styles.featureCtaText}>{cta}</Text>
        <Ionicons name="arrow-forward" size={16} color="#1a237e" />
      </View>
    </TouchableOpacity>
  );
};

const WhatYouCanDoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WhatYouCanDoNavigationProp>();
  const { width } = useWindowDimensions();
  const screenPadding = getScreenHorizontalPadding(width);
  const centeredMaxWidth = getCenteredTextMaxWidth(width, screenPadding, 520);
  const tabNav = navigation.getParent();

  const handleViewDocuments = () => {
    (tabNav as any)?.navigate('Profile', { screen: 'Documents' });
  };

  const handleViewAttendance = () => {
    (tabNav as any)?.navigate('Attendance', { screen: 'AttendanceList' });
  };

  const handleViewLeaveList = () => {
    (tabNav as any)?.navigate('Leave', { screen: 'LeaveList' });
  };

  const handleViewLeaveBalances = () => {
    (tabNav as any)?.navigate('Leave', { screen: 'LeaveBalances' });
  };

  const handleViewProfile = () => {
    (tabNav as any)?.navigate('Profile');
  };

  const handleViewPayslips = () => {
    (tabNav as any)?.navigate('Profile', { screen: 'Payslips' });
  };

  const handleViewBankGp = () => {
    (tabNav as any)?.navigate('Profile', { screen: 'BankGpDetails' });
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
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What you can do</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: screenPadding, paddingBottom: 110 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIconRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="sparkles-outline" size={18} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Everything you need in one place</Text>
          </View>
          <Text style={[styles.introSubtitle, { maxWidth: centeredMaxWidth }]}>
            Attendance, leave, profile, documents and payslips — designed to help you manage work quickly and professionally.
          </Text>
        </View>

        <Text style={styles.sectionHeading}>Quick access</Text>
        <Text style={[styles.sectionSubHeading, { maxWidth: centeredMaxWidth }]}>
          Tap a card to open that section.
        </Text>

        <FeatureCard
          icon="calendar-outline"
          iconBg="#e0f2fe"
          iconColor="#0369a1"
          title="Attendance"
          description="View your attendance history and timesheet details."
          cta="Open attendance"
          onPress={handleViewAttendance}
        />

        <FeatureCard
          icon="leaf-outline"
          iconBg="#ecfdf5"
          iconColor="#047857"
          title="Leave requests"
          description="Submit leave requests and track approvals and history."
          cta="Open leave list"
          onPress={handleViewLeaveList}
        />

        <FeatureCard
          icon="pie-chart-outline"
          iconBg="#eef2ff"
          iconColor="#1a237e"
          title="Leave balances"
          description="See your current leave year period and remaining balances."
          cta="Open balances"
          onPress={handleViewLeaveBalances}
        />

        <FeatureCard
          icon="document-text-outline"
          iconBg="#fff7ed"
          iconColor="#c2410c"
          title="Documents"
          description="Upload and manage documents like passport, visa and right to work."
          cta="Open documents"
          onPress={handleViewDocuments}
        />

        <FeatureCard
          icon="receipt-outline"
          iconBg="#fdf2f8"
          iconColor="#be185d"
          title="Payslips"
          description="Upload and view your last 3 months payslips (HMRC requirement)."
          cta="Open payslips"
          onPress={handleViewPayslips}
        />

        <FeatureCard
          icon="person-outline"
          iconBg="#f1f5f9"
          iconColor="#0f172a"
          title="Profile"
          description="Review your personal details and update profile information."
          cta="Open profile"
          onPress={handleViewProfile}
        />

        <FeatureCard
          icon="medical-outline"
          iconBg="#f0fdf4"
          iconColor="#166534"
          title="Bank & GP details"
          description="Add or update your bank details and GP information."
          cta="Open bank & GP"
          onPress={handleViewBankGp}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0d1a5a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a237e',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 18,
  },
  hero: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  introSubtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 6,
    marginBottom: 4,
  },
  sectionSubHeading: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featureTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  featureCtaRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a237e',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  sectionLink: {
    alignSelf: 'flex-start',
  },
  sectionLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
  },
  docList: {
    marginTop: 8,
    marginBottom: 12,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  docItemText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
});

export default WhatYouCanDoScreen;
