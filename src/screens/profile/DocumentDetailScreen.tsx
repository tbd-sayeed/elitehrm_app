/**
 * Document Detail Screen - View + update document (file optional)
 * @format
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
  TextInput,
  InteractionManager,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';

import { MainStackParamList } from '../../navigation/MainNavigator';
import type { EmployeeDocument } from '../../store/authStore';
import { useAuthStore } from '../../store/authStore';
import {
  getDocument,
  listDocumentCategories,
  listDocuments,
  updateDocument,
} from '../../api/documents';
import { tokenStorage } from '../../utils/storage';
import { showToast } from '../../utils/toast';

type NavProp = StackNavigationProp<MainStackParamList, 'DocumentDetail'>;
type RouteP = RouteProp<MainStackParamList, 'DocumentDetail'>;

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
};

const formatDateForAPI = (d: Date | null): string => {
  if (!d) return '';
  return d.toISOString().split('T')[0];
};

const parseDate = (str?: string | null): Date => {
  if (!str) return new Date(1990, 0, 1);
  const [y, m, d] = str.split('-').map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  return new Date(1990, 0, 1);
};

const IMAGE_OPTIONS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.7,
  mediaType: 'photo' as const,
};

const DocumentDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { user, updateUser } = useAuthStore();

  const documentId = route.params?.documentId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState<EmployeeDocument | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; description?: string | null }>>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [validityDate, setValidityDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'validity' | 'start' | 'end' | null>(null);

  const [file, setFile] = useState<{ uri: string; type: string; name: string } | null>(null);

  const [showFileSheet, setShowFileSheet] = useState(false);
  const pendingPickerActionRef = useRef<null | (() => void)>(null);
  const isPickingRef = useRef(false);

  const isExpired = Boolean(doc?.is_expired);
  const expiringSoon = doc?.expires_in_days != null && doc.expires_in_days <= 30 && !isExpired;

  const statusColor = isExpired ? '#c62828' : expiringSoon ? '#e65100' : '#2e7d32';

  const loadCategories = useCallback(async () => {
    // Prefer store categories if present, otherwise call /document-categories.
    const storeItems = user?.document_categories?.items;
    if (storeItems && storeItems.length > 0) {
      setCategories(storeItems.map((c) => ({ id: c.id, name: c.name, description: c.description })));
      return;
    }
    try {
      const res = await listDocumentCategories();
      const data: any = res?.data;
      const items: any[] =
        Array.isArray(data) ? data :
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.categories) ? data.categories :
        [];
      setCategories(items.map((c) => ({ id: c.id, name: c.name, description: c.description })));
    } catch {
      // Non-blocking: can still edit other fields.
    }
  }, [user?.document_categories?.items]);

  const syncFormFromDoc = useCallback((d: EmployeeDocument) => {
    setName(d.name ?? '');
    setDescription((d as any).description ?? '');
    setCategoryId((d as any)?.category?.id ?? null);
    setValidityDate(d.validity_date ? parseDate(d.validity_date) : null);
    setStartDate(d.start_date ? parseDate(d.start_date) : null);
    setEndDate(d.end_date ? parseDate(d.end_date) : null);
    setFile(null);
  }, []);

  const loadDoc = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDocument(documentId);
      if (res.success && res.data) {
        setDoc(res.data as any);
        syncFormFromDoc(res.data as any);
      } else {
        showToast.error('Document', res.message || 'Could not load document');
      }
    } catch (e: any) {
      showToast.error('Document', e?.message || 'Could not load document');
    } finally {
      setLoading(false);
    }
  }, [documentId, syncFormFromDoc]);

  useEffect(() => {
    void loadCategories();
    void loadDoc();
  }, [loadCategories, loadDoc]);

  const closeFileSheet = () => setShowFileSheet(false);

  const runAfterDismiss = (fn: () => void) => {
    pendingPickerActionRef.current = fn;
    closeFileSheet();
    if (Platform.OS !== 'ios') {
      setTimeout(() => {
        const action = pendingPickerActionRef.current;
        pendingPickerActionRef.current = null;
        if (action) InteractionManager.runAfterInteractions(() => action());
      }, 200);
    }
  };

  const onPickImage = (launcher: typeof launchCamera | typeof launchImageLibrary) => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    const options =
      launcher === launchCamera
        ? { ...IMAGE_OPTIONS, cameraType: 'back' as const, presentationStyle: 'fullScreen' as const }
        : { ...IMAGE_OPTIONS, presentationStyle: 'fullScreen' as const };

    launcher(options as any, (response) => {
      isPickingRef.current = false;
      if (response.didCancel) return;
      if (response.errorCode) {
        showToast.error('Error', response.errorMessage || 'Could not open camera or photos');
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri) {
        setFile({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `document_${Date.now()}.jpg`,
        });
      }
    });
  };

  const onPickFile = async () => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    try {
      const result = await pick({
        type: [types.pdf, types.images, types.doc, types.docx],
        allowMultiSelection: false,
      });
      const picked = Array.isArray(result) ? result[0] : result;
      if (picked?.uri && picked?.name) {
        setFile({
          uri: picked.uri,
          type: picked.type || 'application/octet-stream',
          name: picked.name,
        });
      }
    } catch (err: unknown) {
      const maybeMessage =
        err instanceof Error ? err.message : typeof err === 'string' ? err : '';
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      if (typeof maybeMessage === 'string' && maybeMessage.toLowerCase().includes('previous')) return;
      showToast.error('Error', err instanceof Error ? err.message : 'Could not open file picker');
    } finally {
      isPickingRef.current = false;
    }
  };

  const buildUpdateFormData = (): FormData => {
    const form = new FormData();
    form.append('name', name.trim());
    form.append('description', description.trim());
    if (categoryId != null) form.append('category_id', String(categoryId));
    if (validityDate) form.append('validity_date', formatDateForAPI(validityDate));
    if (startDate) form.append('start_date', formatDateForAPI(startDate));
    if (endDate) form.append('end_date', formatDateForAPI(endDate));
    if (file) {
      form.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    }
    return form;
  };

  const handleSave = async () => {
    if (!doc) return;
    if (!name.trim()) {
      showToast.error('Required', 'Document name is required');
      return;
    }
    setSaving(true);
    try {
      const formData = buildUpdateFormData();
      const res = await updateDocument(doc.id, formData);
      if (!res.success) {
        showToast.error('Update failed', res.message || 'Could not update document');
        return;
      }
      showToast.success('Updated', res.message || 'Document updated');

      // Refresh list and update store (keeps dashboard/docs in sync)
      try {
        const listRes = await listDocuments();
        if (listRes.data?.items) {
          updateUser({
            documents: {
              items: listRes.data.items as any,
              count: listRes.data.count ?? listRes.data.items.length,
              expired_count: listRes.data.expired_count ?? 0,
              expiring_within_30_days_count: listRes.data.expiring_within_30_days_count ?? 0,
            },
          });
        }
      } catch {
        // non-blocking
      }

      // Update current doc state from API response (if present)
      if (res.data) {
        setDoc(res.data as any);
        syncFormFromDoc(res.data as any);
      } else {
        await loadDoc();
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.errors?.file?.[0] ||
        e?.message ||
        'Could not update document';
      showToast.error('Update failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDocument = async () => {
    if (!doc) return;
    const url = (doc as any).download_url || (doc as any).file_url;
    if (!url) {
      showToast.error('Open', 'No download URL available for this document.');
      return;
    }

    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        showToast.error('Open', 'Session expired. Please login again.');
        return;
      }

      const ext = (() => {
        const fileName = (doc as any).file_name || (doc as any).name || 'document';
        const m = String(fileName).match(/\.[a-zA-Z0-9]+$/);
        return m ? m[0] : '';
      })();

      const mime = (doc as any).mime_type || 'application/octet-stream';
      const dir = ReactNativeBlobUtil.fs.dirs.CacheDir;
      const path = `${dir}/elitehr_doc_${doc.id}_${Date.now()}${ext}`;

      showToast.info('Downloading', 'Preparing the document…');
      const res = await ReactNativeBlobUtil.config({ path, fileCache: true }).fetch(
        'GET',
        url,
        {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
        }
      );

      const filePath = res.path();
      if (Platform.OS === 'ios') {
        await ReactNativeBlobUtil.ios.openDocument(filePath);
      } else {
        ReactNativeBlobUtil.android.actionViewIntent(filePath, mime);
      }
    } catch (e: any) {
      Alert.alert('Open document', e?.message || 'Could not open this document');
    }
  };

  const renderDateRow = (label: string, value: Date | null, field: 'validity' | 'start' | 'end') => (
    <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(field)} activeOpacity={0.7}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>
        {value ? value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
      </Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Document</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>Loading document…</Text>
        </View>
      ) : !doc ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Document not found.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={styles.docTitle}>{doc.name}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor }]}>
                <Text style={styles.badgeText}>
                  {isExpired
                    ? 'Expired'
                    : expiringSoon
                    ? `Expires in ${doc.expires_in_days} days`
                    : doc.expires_in_days != null
                    ? `${doc.expires_in_days} days left`
                    : 'On file'}
                </Text>
              </View>
            </View>
            <Text style={styles.muted}>{doc.category?.name ?? '—'}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Validity / Expires on</Text>
              <Text style={styles.infoValue}>{formatDate(doc.expires_on ?? doc.validity_date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Start date</Text>
              <Text style={styles.infoValue}>{formatDate(doc.start_date)}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
              <Text style={styles.infoLabel}>End date</Text>
              <Text style={styles.infoValue}>{formatDate(doc.end_date)}</Text>
            </View>

            <TouchableOpacity style={styles.openButton} onPress={() => void handleOpenDocument()} activeOpacity={0.8}>
              <Ionicons name="open-outline" size={18} color="#fff" />
              <Text style={styles.openButtonText}>Open document</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit details</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Document name"
              placeholderTextColor="#9e9e9e"
              editable={!saving}
            />

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add description"
              placeholderTextColor="#9e9e9e"
              editable={!saving}
              multiline
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipsWrap}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, categoryId === c.id && styles.chipActive]}
                  onPress={() => setCategoryId(c.id)}
                  activeOpacity={0.7}
                  disabled={saving}>
                  <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {categories.length === 0 && (
                <Text style={styles.mutedSmall}>No categories loaded.</Text>
              )}
            </View>

            <Text style={styles.label}>Dates (optional)</Text>
            {renderDateRow('Validity / Expiry date', validityDate, 'validity')}
            {renderDateRow('Start date', startDate, 'start')}
            {renderDateRow('End date', endDate, 'end')}

            {showDatePicker && (
              <DateTimePicker
                value={
                  showDatePicker === 'validity'
                    ? (validityDate || new Date())
                    : showDatePicker === 'start'
                    ? (startDate || new Date())
                    : (endDate || new Date())
                }
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (date) {
                    if (showDatePicker === 'validity') setValidityDate(date);
                    if (showDatePicker === 'start') setStartDate(date);
                    if (showDatePicker === 'end') setEndDate(date);
                  }
                  setShowDatePicker(null);
                }}
              />
            )}

            <Text style={styles.label}>File (optional)</Text>
            <TouchableOpacity
              style={styles.fileButton}
              onPress={() => setShowFileSheet(true)}
              activeOpacity={0.7}
              disabled={saving}>
              <Ionicons name={file ? 'document' : 'attach-outline'} size={22} color="#1a237e" />
              <Text style={styles.fileButtonText}>
                {file ? file.name : 'Replace file (optional)'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={() => void handleSave()}
              activeOpacity={0.8}
              disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showFileSheet}
        transparent
        animationType="fade"
        onRequestClose={closeFileSheet}
        onDismiss={() => {
          const action = pendingPickerActionRef.current;
          pendingPickerActionRef.current = null;
          if (action) InteractionManager.runAfterInteractions(() => action());
        }}>
        <Pressable style={styles.sheetOverlay} onPress={closeFileSheet}>
          <Pressable style={styles.sheetContainer} onPress={() => {}}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Replace file</Text>
              <TouchableOpacity style={styles.sheetCloseButton} onPress={closeFileSheet}>
                <Ionicons name="close" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => runAfterDismiss(() => void onPickFile())}
              activeOpacity={0.8}>
              <View style={styles.sheetActionLeft}>
                <View style={[styles.sheetIcon, { backgroundColor: '#eef2ff' }]}>
                  <Ionicons name="document-text-outline" size={18} color="#1a237e" />
                </View>
                <Text style={styles.sheetActionText}>Choose file</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => runAfterDismiss(() => onPickImage(launchImageLibrary))}
              activeOpacity={0.8}>
              <View style={styles.sheetActionLeft}>
                <View style={[styles.sheetIcon, { backgroundColor: '#ecfeff' }]}>
                  <Ionicons name="images-outline" size={18} color="#0e7490" />
                </View>
                <Text style={styles.sheetActionText}>Choose from gallery</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => runAfterDismiss(() => onPickImage(launchCamera))}
              activeOpacity={0.8}>
              <View style={styles.sheetActionLeft}>
                <View style={[styles.sheetIcon, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="camera-outline" size={18} color="#166534" />
                </View>
                <Text style={styles.sheetActionText}>Take a photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancelButton} onPress={closeFileSheet} activeOpacity={0.8}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#475569', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  docTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', flex: 1 },
  muted: { marginTop: 6, fontSize: 12, color: '#64748b' },
  mutedSmall: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: { fontSize: 13, color: '#64748b', flex: 1 },
  infoValue: { fontSize: 13, color: '#0f172a', fontWeight: '600', flex: 1, textAlign: 'right' },
  openButton: {
    marginTop: 14,
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  openButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  label: { marginTop: 10, marginBottom: 6, fontSize: 14, fontWeight: '700', color: '#0f172a' },
  textInput: {
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: { minHeight: 84, textAlignVertical: 'top' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#1a237e' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  chipTextActive: { color: '#fff' },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dateLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  dateValue: { fontSize: 13, color: '#0f172a', fontWeight: '700' },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  fileButtonText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1a237e' },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#1a237e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.75 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: Platform.select({ ios: 28, android: 18 }),
  },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sheetCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  sheetAction: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
  },
  sheetActionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  sheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetActionText: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  sheetCancelButton: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
});

export default DocumentDetailScreen;

