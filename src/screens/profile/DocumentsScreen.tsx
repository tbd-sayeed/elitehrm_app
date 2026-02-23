/**
 * Documents Screen - List employee documents with validity and expiry info
 * @format
 */

import React, { useState, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useAuthStore } from '../../store/authStore';
import type { EmployeeDocument, EmployeeDocumentCategory } from '../../store/authStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { listDocuments } from '../../api/documents';

type DocumentsNavigationProp = StackNavigationProp<MainStackParamList, 'Documents'>;

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const DocumentRow: React.FC<{
  doc: EmployeeDocument;
}> = ({ doc }) => {
  const isExpired = doc.is_expired;
  const expiringSoon =
    doc.expires_in_days != null && doc.expires_in_days <= 30 && !isExpired;
  const statusColor = isExpired ? '#c62828' : expiringSoon ? '#e65100' : '#2e7d32';

  return (
    <View style={styles.docCard}>
      <View style={styles.docHeader}>
        <Text style={styles.docName}>{doc.name}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>
            {isExpired
              ? 'Expired'
              : expiringSoon
              ? `Expires in ${doc.expires_in_days} days`
              : doc.expires_in_days != null
              ? `${doc.expires_in_days} days left`
              : '—'}
          </Text>
        </View>
      </View>
      <Text style={styles.docCategory}>{doc.category?.name ?? '—'}</Text>
      <View style={styles.docRow}>
        <Text style={styles.docLabel}>Start date</Text>
        <Text style={styles.docValue}>{formatDate(doc.start_date)}</Text>
      </View>
      <View style={styles.docRow}>
        <Text style={styles.docLabel}>End date</Text>
        <Text style={styles.docValue}>{formatDate(doc.end_date)}</Text>
      </View>
      <View style={styles.docRow}>
        <Text style={styles.docLabel}>Validity / Expires on</Text>
        <Text style={styles.docValue}>{formatDate(doc.expires_on ?? doc.validity_date)}</Text>
      </View>
      {doc.expires_in_days != null && (
        <View style={styles.docRow}>
          <Text style={styles.docLabel}>Days until expiry</Text>
          <Text style={[styles.docValue, isExpired && styles.docValueExpired]}>
            {isExpired ? 'Expired' : doc.expires_in_days}
          </Text>
        </View>
      )}
    </View>
  );
};

const MissingCategoryRow: React.FC<{
  category: EmployeeDocumentCategory;
  onUpload?: (categoryId: number) => void;
}> = ({ category, onUpload }) => (
  <TouchableOpacity
    style={styles.missingCard}
    onPress={() => onUpload?.(category.id)}
    activeOpacity={0.7}>
    <Ionicons name="document-outline" size={20} color="#e65100" />
    <Text style={styles.missingName}>{category.name}</Text>
    <Text style={styles.missingLabel}>Tap to upload</Text>
  </TouchableOpacity>
);

const DocumentsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DocumentsNavigationProp>();
  const { user, updateUser } = useAuthStore();
  // Use store as source of truth so Dashboard and this screen stay in sync after upload
  const documents = user?.documents?.items ?? [];
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setListError(null);
    try {
      const res = await listDocuments();
      if (res.data?.items) {
        const updated = {
          items: res.data.items,
          count: res.data.count ?? res.data.items.length,
          expired_count: res.data.expired_count ?? 0,
          expiring_within_30_days_count: res.data.expiring_within_30_days_count ?? 0,
        };
        updateUser({ documents: updated });
      }
    } catch (e: any) {
      const isNetwork = e?.code === 'ERR_NETWORK' || e?.message?.toLowerCase().includes('network');
      setListError(isNetwork ? 'Server unreachable. Showing last saved list.' : 'Could not refresh list.');
    }
  }, [updateUser]);

  useFocusEffect(
    useCallback(() => {
      fetchList();
    }, [fetchList])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchList();
    setRefreshing(false);
  }, [fetchList]);

  const missingItems = user?.document_categories?.missing_items ?? [];

  const handleUploadDocument = (categoryId?: number) => {
    navigation.navigate('UploadDocument', categoryId != null ? { categoryId } : {});
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
        <Text style={styles.headerTitle}>My Documents</Text>
        <View style={styles.backButton} />
      </View>
      <TouchableOpacity
        style={styles.backToProfileLink}
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.7}>
        <Ionicons name="person-outline" size={16} color="#fff" />
        <Text style={styles.backToProfileText}>Back to Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadFab}
        onPress={() => handleUploadDocument()}
        activeOpacity={0.8}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.uploadFabText}>Upload document</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        {listError ? (
          <View style={styles.listErrorBanner}>
            <Text style={styles.listErrorText}>{listError}</Text>
          </View>
        ) : null}
        {/* Missing documents section */}
        {missingItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missing documents</Text>
            <Text style={styles.sectionSubtitle}>
              Tap a document type to upload it.
            </Text>
            {missingItems.map((cat) => (
              <MissingCategoryRow
                key={cat.id}
                category={cat}
                onUpload={handleUploadDocument}
              />
            ))}
          </View>
        )}

        {/* Document list */}
        {documents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document list</Text>
            <Text style={styles.sectionSubtitle}>
              Start date, end date, validity and days until expiry.
            </Text>
            {documents.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} />
            ))}
          </View>
        )}

        {documents.length === 0 && missingItems.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="#9e9e9e" />
            <Text style={styles.emptyText}>No documents on file</Text>
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
  backToProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1a237e',
    borderBottomWidth: 1,
    borderBottomColor: '#0d1a5a',
  },
  backToProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  uploadFab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadFabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listErrorBanner: {
    backgroundColor: '#fff3e0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e65100',
  },
  listErrorText: {
    fontSize: 13,
    color: '#5d4037',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 12,
  },
  docCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  docName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  docCategory: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 10,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  docLabel: {
    fontSize: 13,
    color: '#757575',
  },
  docValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
  },
  docValueExpired: {
    color: '#c62828',
  },
  missingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#e65100',
    gap: 10,
  },
  missingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  missingLabel: {
    fontSize: 12,
    color: '#e65100',
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
  },
});

export default DocumentsScreen;
