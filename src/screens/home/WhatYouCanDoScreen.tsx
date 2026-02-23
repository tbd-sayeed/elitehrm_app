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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';

type WhatYouCanDoNavigationProp = StackNavigationProp<MainStackParamList, 'WhatYouCanDo'>;

const WhatYouCanDoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WhatYouCanDoNavigationProp>();

  const handleViewDocuments = () => {
    const tabNav = navigation.getParent();
    (tabNav as any)?.navigate('Profile', { screen: 'Documents' });
  };

  const handleViewAttendance = () => {
    const tabNav = navigation.getParent();
    (tabNav as any)?.navigate('Attendance');
  };

  const handleViewLeaveList = () => {
    const tabNav = navigation.getParent();
    (tabNav as any)?.navigate('Leave');
  };

  const handleViewProfile = () => {
    const tabNav = navigation.getParent();
    (tabNav as any)?.navigate('Profile');
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.introSubtitle}>
          Manage your work, track attendance, and request leaves all in one place.
        </Text>

        {/* Track attendance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Track your attendance</Text>
          </View>
          <Text style={styles.sectionText}>
            View your attendance history, check in/out, and see your timesheet status.
          </Text>
          <TouchableOpacity
            style={styles.sectionLink}
            onPress={handleViewAttendance}
            activeOpacity={0.7}>
            <Text style={styles.sectionLinkText}>View attendance →</Text>
          </TouchableOpacity>
        </View>

        {/* Request and manage leave */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Request and manage leave</Text>
          </View>
          <Text style={styles.sectionText}>
            Submit leave requests, view leave balances, and track your leave history.
          </Text>
          <TouchableOpacity
            style={styles.sectionLink}
            onPress={handleViewLeaveList}
            activeOpacity={0.7}>
            <Text style={styles.sectionLinkText}>View leave →</Text>
          </TouchableOpacity>
        </View>

        {/* View profile and timesheets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>View your profile and timesheets</Text>
          </View>
          <Text style={styles.sectionText}>
            Access your profile, view timesheets, and update your personal information.
          </Text>
          <TouchableOpacity
            style={styles.sectionLink}
            onPress={handleViewProfile}
            activeOpacity={0.7}>
            <Text style={styles.sectionLinkText}>View profile →</Text>
          </TouchableOpacity>
        </View>

        {/* Manage documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>4</Text>
            </View>
            <Text style={styles.sectionTitle}>Manage your documents</Text>
          </View>
          <Text style={styles.sectionText}>
            Upload and manage your documents including:
          </Text>
          <View style={styles.docList}>
            <View style={styles.docItem}>
              <Ionicons name="document-outline" size={20} color="#1a237e" />
              <Text style={styles.docItemText}>Passport</Text>
            </View>
            <View style={styles.docItem}>
              <Ionicons name="document-outline" size={20} color="#1a237e" />
              <Text style={styles.docItemText}>Visa/eVisa</Text>
            </View>
            <View style={styles.docItem}>
              <Ionicons name="document-outline" size={20} color="#1a237e" />
              <Text style={styles.docItemText}>Right to Work</Text>
            </View>
            <View style={styles.docItem}>
              <Ionicons name="document-outline" size={20} color="#1a237e" />
              <Text style={styles.docItemText}>Employee Contract</Text>
            </View>
            <View style={styles.docItem}>
              <Ionicons name="document-outline" size={20} color="#1a237e" />
              <Text style={styles.docItemText}>Monthly payslips</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.sectionLink}
            onPress={handleViewDocuments}
            activeOpacity={0.7}>
            <Text style={styles.sectionLinkText}>View all documents →</Text>
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
    padding: 20,
    paddingBottom: 100,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
    lineHeight: 24,
    textAlign: 'center',
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
