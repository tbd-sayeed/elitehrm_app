/**
 * Payslips Screen - List/upload last 3 months payslips
 * @format
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { MainStackParamList } from '../../navigation/MainNavigator';
import { deletePayslip, getPayslipDownloadUrl, listPayslips, PayslipItem } from '../../api/payslips';
import { tokenStorage } from '../../utils/storage';
import { showToast } from '../../utils/toast';

type NavProp = StackNavigationProp<MainStackParamList, 'Payslips'>;

const monthLabel = (ym: string) => {
  // ym = "YYYY-MM"
  const [y, m] = ym.split('-').map((x) => Number(x));
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const bytesToLabel = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return null;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const inferMime = (fileName?: string | null, mimeType?: string | null) => {
  if (mimeType) return mimeType;
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'application/pdf';
};

const inferExt = (fileName?: string | null, mimeType?: string | null) => {
  const lower = String(fileName || '').toLowerCase();
  const m = lower.match(/\.[a-z0-9]+$/);
  if (m?.[0]) return m[0];
  const mt = mimeType || '';
  if (mt.includes('png')) return '.png';
  if (mt.includes('jpeg') || mt.includes('jpg')) return '.jpg';
  if (mt.includes('pdf')) return '.pdf';
  return '.pdf';
};

const PayslipCard: React.FC<{
  item: PayslipItem;
  onOpen: (item: PayslipItem) => void;
  onDelete: (id: number) => void;
}> = ({ item, onOpen, onDelete }) => {
  const sizeLabel = bytesToLabel(item.file_size);
  const subtitleParts = [
    item.file_name || null,
    sizeLabel,
  ].filter(Boolean);

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.monthText}>{monthLabel(item.payslip_month)}</Text>
          <Text style={styles.subText} numberOfLines={1}>
            {subtitleParts.length ? subtitleParts.join(' · ') : 'Payslip'}
          </Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onOpen(item)}
            activeOpacity={0.8}>
            <Ionicons name="open-outline" size={18} color="#1a237e" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.iconBtnDanger]}
            onPress={() => onDelete(item.id)}
            activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color="#b91c1c" />
          </TouchableOpacity>
        </View>
      </View>

      {item.notes ? (
        <View style={styles.noteRow}>
          <Ionicons name="chatbox-ellipses-outline" size={14} color="#64748b" />
          <Text style={styles.noteText} numberOfLines={2}>
            {item.notes}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.openBtn}
          onPress={() => onOpen(item)}
          activeOpacity={0.85}>
          <Ionicons name="document-text-outline" size={16} color="#fff" />
          <Text style={styles.openBtnText}>Open</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PayslipsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<PayslipItem[]>([]);
  const [retentionNote, setRetentionNote] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const normalizeList = (res: any): { list: PayslipItem[]; note: string | null } => {
    const note =
      res?.retention_note ||
      res?.data?.retention_note ||
      null;

    const data = res?.data;
    const list: PayslipItem[] =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.payslips)
        ? data.payslips
        : [];

    return { list, note };
  };

  const fetchList = useCallback(async () => {
    setListError(null);
    try {
      const res = await listPayslips();
      const { list, note } = normalizeList(res);
      setItems(
        list
          .slice()
          .sort((a, b) => String(b.payslip_month).localeCompare(String(a.payslip_month)))
      );
      setRetentionNote(note);
    } catch (e: any) {
      const isNetwork =
        e?.code === 'ERR_NETWORK' || e?.message?.toLowerCase().includes('network');
      setListError(isNetwork ? 'Server unreachable. Please try again.' : 'Could not load payslips.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchList();
  }, [fetchList]);

  const handleUpload = () => {
    navigation.navigate('UploadPayslip');
  };

  const handleOpen = useCallback(async (item: PayslipItem) => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        showToast.error('Open payslip', 'Session expired. Please login again.');
        return;
      }

      const url = getPayslipDownloadUrl(item.id);
      const dir = ReactNativeBlobUtil.fs.dirs.CacheDir;
      const ext = inferExt(item.file_name, item.mime_type);
      const path = `${dir}/elitehr_payslip_${item.id}_${Date.now()}${ext}`;
      const mime = inferMime(item.file_name, item.mime_type);

      showToast.info('Downloading', 'Preparing your payslip…');
      const res = await ReactNativeBlobUtil.config({ path, fileCache: true }).fetch(
        'GET',
        url,
        { Authorization: `Bearer ${token}`, Accept: '*/*' }
      );

      const filePath = res.path();
      if (Platform.OS === 'ios') {
        await ReactNativeBlobUtil.ios.openDocument(filePath);
      } else {
        ReactNativeBlobUtil.android.actionViewIntent(filePath, mime);
      }
    } catch (e: any) {
      Alert.alert('Open payslip', e?.message || 'Could not open this payslip');
    }
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert(
        'Delete payslip?',
        'This will remove the payslip from your account.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await deletePayslip(id);
                if (!res.success) {
                  showToast.error('Delete failed', res.message || 'Could not delete payslip');
                  return;
                }
                showToast.success('Deleted', res.message || 'Payslip deleted');
                setItems((prev) => prev.filter((p) => p.id !== id));
              } catch (e: any) {
                showToast.error('Delete failed', e?.message || 'Could not delete payslip');
              }
            },
          },
        ]
      );
    },
    []
  );

  const headerSubtitle = useMemo(() => {
    if (retentionNote) return retentionNote;
    return 'For HMRC compliance, your last 3 months payslips are kept on file.';
  }, [retentionNote]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1a5a" />
      <View style={[styles.notchArea, { height: insets.top }]} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payslips</Text>
        <View style={styles.backButton} />
      </View>

      <TouchableOpacity style={styles.uploadFab} onPress={handleUpload} activeOpacity={0.85}>
        <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
        <Text style={styles.uploadFabText}>Upload payslip</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.noteBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#1a237e" />
          <Text style={styles.noteBannerText}>{headerSubtitle}</Text>
        </View>

        {listError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{listError}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>Loading payslips…</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No payslips uploaded</Text>
            <Text style={styles.emptySub}>Upload your latest payslip to keep your records up to date.</Text>
            <TouchableOpacity style={styles.emptyCta} onPress={handleUpload} activeOpacity={0.85}>
              <Text style={styles.emptyCtaText}>Upload payslip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last 3 months</Text>
            <Text style={styles.sectionSubtitle}>Tap Open to view, or delete if uploaded by mistake.</Text>
            {items.map((p) => (
              <PayslipCard key={p.id} item={p} onOpen={handleOpen} onDelete={handleDelete} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  notchArea: { backgroundColor: '#0d1a5a', width: '100%' },
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
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
  uploadFabText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginBottom: 12,
  },
  noteBannerText: { flex: 1, fontSize: 13, color: '#1e293b', fontWeight: '600', lineHeight: 18 },
  errorBanner: {
    backgroundColor: '#fff3e0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e65100',
  },
  errorBannerText: { fontSize: 13, color: '#5d4037' },
  loading: { paddingVertical: 48, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b', fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 18 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '800', color: '#0f172a' },
  emptySub: { marginTop: 8, fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  emptyCta: { marginTop: 14, backgroundColor: '#1a237e', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  emptyCtaText: { color: '#fff', fontWeight: '800' },
  section: { marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 12 },

  card: {
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
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardTopLeft: { flex: 1 },
  monthText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  subText: { marginTop: 4, fontSize: 12, color: '#64748b', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDanger: { backgroundColor: '#fee2e2' },
  noteRow: { marginTop: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 12, color: '#475569', fontWeight: '600', lineHeight: 16 },
  cardFooter: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  openBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  openBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

export default PayslipsScreen;

