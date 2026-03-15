/**
 * Upload Document Screen - Simple flow: pick category, add file, optional dates
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
  TextInput,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useAuthStore } from '../../store/authStore';
import type { EmployeeDocumentCategory } from '../../store/authStore';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  pick,
  types,
  errorCodes,
  isErrorWithCode,
} from '@react-native-documents/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { uploadDocument, updateDocument, listDocuments } from '../../api/documents';
import { showToast } from '../../utils/toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import DeviceInfo from 'react-native-device-info';

type UploadDocumentNavigationProp = StackNavigationProp<MainStackParamList, 'UploadDocument'>;
type UploadDocumentRouteProp = RouteProp<MainStackParamList, 'UploadDocument'>;

// Optimize images: reduce size for faster upload (max 5MB allowed)
const IMAGE_OPTIONS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.7,
  mediaType: 'photo' as const,
};

const formatDateForAPI = (d: Date | null): string => {
  if (!d) return '';
  return d.toISOString().split('T')[0];
};

/** Sanitize for filenames: spaces to hyphens, no special chars, looks professional */
const slugify = (s: string): string => {
  if (!s || typeof s !== 'string') return '';
  return s
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_.]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'document';
};

/** Get file extension from name or mime (e.g. .pdf, .jpg) */
const getFileExtension = (fileName: string, mimeType?: string): string => {
  const match = fileName.match(/\.[a-zA-Z0-9]+$/);
  if (match) return match[0].toLowerCase();
  if (mimeType) {
    if (mimeType.includes('pdf')) return '.pdf';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg';
    if (mimeType.includes('png')) return '.png';
    if (mimeType.includes('word') || mimeType.includes('msword')) return '.doc';
    if (mimeType.includes('openxml') && mimeType.includes('word')) return '.docx';
  }
  return '.pdf';
};

/** Build professional filename: EmployeeName-DocumentType-UniqueId.extension (no spaces) */
const buildProfessionalFileName = (
  employeeName: string,
  documentType: string,
  uniqueId: string,
  extension: string
): string => {
  const part1 = slugify(employeeName) || 'employee';
  const part2 = slugify(documentType) || 'document';
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${part1}-${part2}-${uniqueId}${ext}`;
};

const UploadDocumentScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<UploadDocumentNavigationProp>();
  const route = useRoute<UploadDocumentRouteProp>();
  const { user, updateUser } = useAuthStore();

  const categories: EmployeeDocumentCategory[] = user?.document_categories?.items ?? [];
  const preselectedCategoryId = route.params?.categoryId;

  const [categoryId, setCategoryId] = useState<number | null>(
    preselectedCategoryId ?? (categories[0]?.id ?? null)
  );
  const [file, setFile] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [optionalName, setOptionalName] = useState('');
  const [validityDate, setValidityDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'validity' | 'start' | 'end' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showFileSheet, setShowFileSheet] = useState(false);
  const [isEmulator, setIsEmulator] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const isPickingRef = useRef(false);
  const pendingPickerActionRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    DeviceInfo.isEmulator()
      .then((v) => setIsEmulator(Boolean(v)))
      .catch(() => setIsEmulator(false));
  }, []);

  const onPickImage = (launcher: typeof launchCamera | typeof launchImageLibrary) => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    setIsPicking(true);
    const options =
      launcher === launchCamera
        ? { ...IMAGE_OPTIONS, cameraType: 'back' as const, presentationStyle: 'fullScreen' as const }
        : { ...IMAGE_OPTIONS, presentationStyle: 'fullScreen' as const };

    launcher(options as any, (response) => {
      if (response.didCancel) {
        isPickingRef.current = false;
        setIsPicking(false);
        return;
      }
      if (response.errorCode) {
        showToast.error('Error', response.errorMessage || 'Could not open camera or photos');
        isPickingRef.current = false;
        setIsPicking(false);
        return;
      }
      const asset = response.assets?.[0];
      if (!asset?.uri) {
        isPickingRef.current = false;
        setIsPicking(false);
        return;
      }
      const type = asset.type || 'image/jpeg';
      const name = asset.fileName || `document_${Date.now()}.jpg`;
      setFile({ uri: asset.uri, type, name });
      isPickingRef.current = false;
      setIsPicking(false);
    });
  };

  const onPickFile = async () => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    setIsPicking(true);
    try {
      const result = await pick({
        type: [types.pdf, types.images, types.doc, types.docx],
        allowMultiSelection: false,
      });
      const doc = Array.isArray(result) ? result[0] : result;
      if (doc?.uri && doc?.name) {
        setFile({
          uri: doc.uri,
          type: doc.type || 'application/octet-stream',
          name: doc.name,
        });
      }
    } catch (err: unknown) {
      const maybeMessage =
        err instanceof Error ? err.message : typeof err === 'string' ? err : '';
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      // Avoid surfacing iOS internal "previous promise/picker still open" warnings as an error toast.
      if (typeof maybeMessage === 'string' && maybeMessage.toLowerCase().includes('previous')) return;
      showToast.error(
        'Error',
        err instanceof Error ? err.message : 'Could not open file picker'
      );
    } finally {
      isPickingRef.current = false;
      setIsPicking(false);
    }
  };

  const closeFileSheet = () => setShowFileSheet(false);

  const showFileOptions = () => {
    if (isPickingRef.current) return;
    setShowFileSheet(true);
  };

  const runAfterDismiss = (fn: () => void) => {
    // Store pending action and close the sheet; we'll run it in Modal.onDismiss (iOS)
    // and also via a timeout fallback (Android).
    pendingPickerActionRef.current = fn;
    closeFileSheet();

    if (Platform.OS !== 'ios') {
      setTimeout(() => {
        const action = pendingPickerActionRef.current;
        pendingPickerActionRef.current = null;
        if (action) {
          InteractionManager.runAfterInteractions(() => action());
        }
      }, 200);
    }
  };

  const chooseFile = () => {
    runAfterDismiss(() => void onPickFile());
  };

  const chooseFromGallery = () => {
    runAfterDismiss(() => onPickImage(launchImageLibrary));
  };

  const takePhoto = () => {
    if (Platform.OS === 'ios' && isEmulator) {
      showToast.info(
        'Camera unavailable',
        'iOS Simulator does not support the camera. Please use Photos or test on a real iPhone.'
      );
      return;
    }
    runAfterDismiss(() => onPickImage(launchCamera));
  };

  const buildFormData = (): FormData => {
    const form = new FormData();
    if (categoryId == null) throw new Error('Please select a document type');
    if (!file) throw new Error('Please select a file');

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const documentTypeName = selectedCategory?.name || 'Document';

    // Display name: user-provided or document type (for app/HR UI)
    const displayName = optionalName.trim() || documentTypeName;
    form.append('name', displayName);

    // Professional file name: EmployeeName-DocumentType-UniqueId.extension (no spaces, hyphens)
    const employeeName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
    const uniqueId = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36)}`;
    const extension = getFileExtension(file.name, file.type);
    const professionalFileName = buildProfessionalFileName(
      employeeName,
      documentTypeName,
      uniqueId,
      extension
    );

    form.append('category_id', String(categoryId));
    form.append('file', {
      uri: file.uri,
      type: file.type,
      name: professionalFileName,
    } as any);

    if (validityDate) form.append('validity_date', formatDateForAPI(validityDate));
    if (startDate) form.append('start_date', formatDateForAPI(startDate));
    if (endDate) form.append('end_date', formatDateForAPI(endDate));

    return form;
  };

  const handleUpload = async () => {
    if (!categoryId) {
      showToast.error('Required', 'Please select a document type');
      return;
    }
    if (!file) {
      showToast.error('Required', 'Please add a file (photo or image)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = buildFormData();

      // If this category already has a document, update/replace the most recent one.
      const existingDocs = user?.documents?.items ?? [];
      const existingForCategory = existingDocs
        .filter((d: any) => Number(d?.category?.id) === Number(categoryId))
        .sort((a: any, b: any) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
      const existingId = existingForCategory[0]?.id ? Number(existingForCategory[0].id) : null;

      if (existingId) {
        await updateDocument(existingId, formData, setUploadProgress);
        showToast.success('Updated', 'Your document has been replaced.');
      } else {
        await uploadDocument(formData, setUploadProgress);
        showToast.success('Uploaded', 'Your document has been submitted.');
      }

      // Refresh documents list and update store so Dashboard and Documents screen stay in sync
      try {
        const res = await listDocuments();
        if (res.data?.items) {
          const updatedDocs = {
            items: res.data.items,
            count: res.data.count ?? res.data.items.length,
            expired_count: res.data.expired_count ?? 0,
            expiring_within_30_days_count: res.data.expiring_within_30_days_count ?? 0,
          };
          updateUser({ documents: updatedDocs });
          // Remove the uploaded category from missing_items so dashboard notice updates
          const prevCategories = user?.document_categories;
          if (prevCategories && categoryId != null) {
            const newMissing = prevCategories.missing_items.filter((c) => c.id !== categoryId);
            updateUser({
              document_categories: {
                ...prevCategories,
                missing_items: newMissing,
                missing_count: Math.max(0, (prevCategories.missing_count ?? 0) - 1),
              },
            });
          }
        }
      } catch (_) {
        // Non-blocking: list refresh failed but upload succeeded
      }

      navigation.goBack();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.file?.[0] ||
        err.message ||
        'Upload failed. Please try again.';
      showToast.error('Upload failed', msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const renderDateButton = (
    label: string,
    value: Date | null,
    field: 'validity' | 'start' | 'end'
  ) => (
    <TouchableOpacity
      style={styles.dateRow}
      onPress={() => setShowDatePicker(field)}
      activeOpacity={0.7}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>
        {value ? value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Optional'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={uploading}>
          <Ionicons name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload document</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>
          Choose the document type and add a file. You can take a photo, choose from gallery, or
          pick a file (e.g. PDF) from your device.
        </Text>

        {/* Document type (required) */}
        <Text style={styles.label}>Document type *</Text>
        <View style={styles.categoryWrap}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipActive]}
              onPress={() => setCategoryId(cat.id)}
              activeOpacity={0.7}
              disabled={uploading}>
              <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {categories.length === 0 && (
          <Text style={styles.errorText}>No document types available. Please try again later.</Text>
        )}

        {/* File (required) */}
        <Text style={styles.label}>File *</Text>
        <TouchableOpacity
          style={styles.fileButton}
          onPress={showFileOptions}
          activeOpacity={0.7}
          disabled={uploading}>
          <Ionicons name={file ? 'document' : 'add-circle-outline'} size={32} color="#1a237e" />
          <Text style={styles.fileButtonText}>
            {file ? file.name : 'Tap to add a file (photo, gallery, or PDF/file)'}
          </Text>
        </TouchableOpacity>

        {/* Optional: name */}
        <Text style={[styles.label, styles.optionalLabel]}>Document name (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={optionalName}
          onChangeText={setOptionalName}
          placeholder="e.g. Passport 2025"
          placeholderTextColor="#9e9e9e"
          editable={!uploading}
        />

        {/* Optional dates */}
        <Text style={[styles.label, styles.optionalLabel]}>Dates (optional)</Text>
        {renderDateButton('Validity / Expiry date', validityDate, 'validity')}
        {renderDateButton('Start date', startDate, 'start')}
        {renderDateButton('End date', endDate, 'end')}

        {showDatePicker && (
          <DateTimePicker
            value={
              showDatePicker === 'validity' ? (validityDate || new Date())
              : showDatePicker === 'start' ? (startDate || new Date())
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

        {/* Upload */}
        <View style={styles.uploadSection}>
          {uploading && (
            <View style={styles.progressWrap}>
              <Text style={styles.progressText}>Uploading… {uploadProgress}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={uploading || !categoryId || !file || categories.length === 0}
            activeOpacity={0.8}>
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>Submit document</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showFileSheet}
        transparent
        animationType="fade"
        onRequestClose={closeFileSheet}
        onDismiss={() => {
          // iOS: guaranteed the modal finished dismissing here.
          const action = pendingPickerActionRef.current;
          pendingPickerActionRef.current = null;
          if (action) {
            InteractionManager.runAfterInteractions(() => action());
          }
        }}>
        <Pressable style={styles.sheetOverlay} onPress={closeFileSheet}>
          <Pressable style={styles.sheetContainer} onPress={() => {}}>
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetTitleRow}>
                <Ionicons name="attach-outline" size={18} color="#0f172a" />
                <Text style={styles.sheetTitle}>Select document</Text>
              </View>
              <TouchableOpacity
                style={styles.sheetCloseButton}
                onPress={closeFileSheet}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>
              Take a photo, choose from gallery, or pick a file (e.g. PDF).
            </Text>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.sheetAction}
                onPress={chooseFile}
                activeOpacity={0.8}
                disabled={isPicking}>
                <View style={styles.sheetActionLeft}>
                  <View style={[styles.sheetIcon, { backgroundColor: '#eef2ff' }]}>
                    <Ionicons name="document-text-outline" size={18} color="#1a237e" />
                  </View>
                  <View style={styles.sheetActionTextWrap}>
                    <Text style={styles.sheetActionTitle}>Choose file</Text>
                    <Text style={styles.sheetActionDesc}>PDF, image, DOC/DOCX</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetAction}
                onPress={chooseFromGallery}
                activeOpacity={0.8}
                disabled={isPicking}>
                <View style={styles.sheetActionLeft}>
                  <View style={[styles.sheetIcon, { backgroundColor: '#ecfeff' }]}>
                    <Ionicons name="images-outline" size={18} color="#0e7490" />
                  </View>
                  <View style={styles.sheetActionTextWrap}>
                    <Text style={styles.sheetActionTitle}>Choose from gallery</Text>
                    <Text style={styles.sheetActionDesc}>Select an image</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>

              {!(Platform.OS === 'ios' && isEmulator) && (
                <TouchableOpacity style={styles.sheetAction} onPress={takePhoto} activeOpacity={0.8}>
                  <View style={styles.sheetActionLeft}>
                    <View style={[styles.sheetIcon, { backgroundColor: '#f0fdf4' }]}>
                      <Ionicons name="camera-outline" size={18} color="#166534" />
                    </View>
                    <View style={styles.sheetActionTextWrap}>
                      <Text style={styles.sheetActionTitle}>Take a photo</Text>
                      <Text style={styles.sheetActionDesc}>Use your camera</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.sheetCancelButton}
              onPress={closeFileSheet}
              activeOpacity={0.8}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a237e' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  hint: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    lineHeight: 20,
  },
  label: { fontSize: 15, fontWeight: '600', color: '#212121', marginBottom: 8 },
  optionalLabel: { fontWeight: '500', color: '#757575' },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  categoryChipActive: { backgroundColor: '#1a237e' },
  categoryChipText: { fontSize: 14, fontWeight: '600', color: '#424242' },
  categoryChipTextActive: { color: '#fff' },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#e8eaf6',
    borderWidth: 2,
    borderColor: '#c5cae9',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  fileButtonText: { fontSize: 15, fontWeight: '500', color: '#1a237e', flex: 1 },
  textInput: {
    fontSize: 16,
    color: '#212121',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  dateLabel: { fontSize: 14, color: '#424242' },
  dateValue: { fontSize: 14, fontWeight: '500', color: '#1a237e' },
  errorText: { fontSize: 13, color: '#c62828', marginTop: 4 },
  uploadSection: { marginTop: 24 },
  progressWrap: { marginBottom: 12 },
  progressText: { fontSize: 13, color: '#555', marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#1a237e', borderRadius: 3 },
  uploadButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  uploadButtonDisabled: { opacity: 0.7 },
  uploadButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: Platform.select({ ios: 28, android: 18 }),
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  sheetSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  sheetActions: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  sheetAction: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  sheetActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetActionTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  sheetActionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetActionDesc: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  sheetCancelButton: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
});

export default UploadDocumentScreen;
