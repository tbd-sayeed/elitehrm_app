/**
 * Upload Payslip Screen
 * @format
 */

import React, { useMemo, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';

import { MainStackParamList } from '../../navigation/MainNavigator';
import { uploadPayslip } from '../../api/payslips';
import { showToast } from '../../utils/toast';

type NavProp = StackNavigationProp<MainStackParamList, 'UploadPayslip'>;

const toYm = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const ymToLabel = (ym: string) => {
  const [y, m] = ym.split('-').map((x) => Number(x));
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const UploadPayslipScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');

  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    now.setDate(1);
    return now;
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [file, setFile] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [showFileSheet, setShowFileSheet] = useState(false);
  const isPickingRef = useRef(false);
  const pendingPickerActionRef = useRef<null | (() => void)>(null);

  const payslipMonth = useMemo(() => toYm(monthDate), [monthDate]);

  const closeFileSheet = () => setShowFileSheet(false);
  const showFileOptions = () => {
    if (isPickingRef.current) return;
    setShowFileSheet(true);
  };

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

  const onPickFile = async () => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    try {
      const result = await pick({
        type: [types.pdf, types.images],
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
      if (typeof maybeMessage === 'string' && maybeMessage.toLowerCase().includes('previous')) return;
      showToast.error('Error', err instanceof Error ? err.message : 'Could not open file picker');
    } finally {
      isPickingRef.current = false;
    }
  };

  const buildFormData = () => {
    if (!file) throw new Error('Please choose a file');
    const form = new FormData();
    form.append('payslip_month', payslipMonth);
    if (notes.trim()) form.append('notes', notes.trim());
    form.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
    return form;
  };

  const handleSubmit = async () => {
    if (!file) {
      showToast.error('Required', 'Please attach your payslip file.');
      return;
    }
    setUploading(true);
    try {
      const formData = buildFormData();
      const res = await uploadPayslip(formData);
      if (!res.success) {
        showToast.error('Upload failed', res.message || 'Could not upload payslip');
        return;
      }
      showToast.success('Uploaded', res.message || 'Payslip uploaded');
      navigation.goBack();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.errors?.file?.[0] ||
        e?.message ||
        'Upload failed. Please try again.';
      showToast.error('Upload failed', msg);
    } finally {
      setUploading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Upload payslip</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#1a237e" />
          <Text style={styles.bannerText}>
            Please upload your payslip for the selected month. Only the last 3 months are kept on file.
          </Text>
        </View>

        <Text style={styles.label}>Payslip month *</Text>
        <TouchableOpacity
          style={styles.monthRow}
          onPress={() => setShowMonthPicker(true)}
          activeOpacity={0.8}
          disabled={uploading}>
          <Text style={styles.monthText}>{ymToLabel(payslipMonth)}</Text>
          <Ionicons name="calendar-outline" size={18} color="#1a237e" />
        </TouchableOpacity>

        {showMonthPicker && (
          <DateTimePicker
            value={monthDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              if (date) {
                const d = new Date(date);
                d.setDate(1);
                setMonthDate(d);
              }
              setShowMonthPicker(false);
            }}
          />
        )}

        <Text style={styles.label}>File *</Text>
        <TouchableOpacity
          style={styles.fileButton}
          onPress={showFileOptions}
          activeOpacity={0.7}
          disabled={uploading}>
          <Ionicons name={file ? 'document' : 'add-circle-outline'} size={30} color="#1a237e" />
          <Text style={styles.fileButtonText}>
            {file ? file.name : 'Tap to attach payslip (PDF or image)'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add a note if needed (optional)"
          placeholderTextColor="#9e9e9e"
          editable={!uploading}
          multiline
        />

        <TouchableOpacity
          style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
          onPress={() => void handleSubmit()}
          activeOpacity={0.85}
          disabled={uploading || !file}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit payslip</Text>}
        </TouchableOpacity>
      </ScrollView>

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
              <View style={styles.sheetTitleRow}>
                <Ionicons name="attach-outline" size={18} color="#0f172a" />
                <Text style={styles.sheetTitle}>Attach payslip</Text>
              </View>
              <TouchableOpacity style={styles.sheetCloseButton} onPress={closeFileSheet}>
                <Ionicons name="close" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>Choose a PDF or image file.</Text>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => runAfterDismiss(() => void onPickFile())}
                activeOpacity={0.8}>
                <View style={styles.sheetActionLeft}>
                  <View style={[styles.sheetIcon, { backgroundColor: '#eef2ff' }]}>
                    <Ionicons name="document-text-outline" size={18} color="#1a237e" />
                  </View>
                  <View>
                    <Text style={styles.sheetActionTitle}>Choose file</Text>
                    <Text style={styles.sheetActionDesc}>PDF or image</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a237e' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginBottom: 16,
  },
  bannerText: { flex: 1, fontSize: 13, color: '#1e293b', fontWeight: '600', lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 8, marginTop: 6 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  monthText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
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
    marginBottom: 16,
  },
  fileButtonText: { fontSize: 14, fontWeight: '700', color: '#1a237e', flex: 1 },
  textInput: {
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitBtnDisabled: { opacity: 0.75 },
  submitText: { color: '#fff', fontWeight: '900', fontSize: 15 },

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
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  sheetCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  sheetSubtitle: { marginTop: 8, fontSize: 13, color: '#475569', lineHeight: 18 },
  sheetActions: { marginTop: 14, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, overflow: 'hidden' },
  sheetAction: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
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
  sheetActionTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  sheetActionDesc: { marginTop: 2, fontSize: 12, color: '#64748b' },
  sheetCancelButton: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
});

export default UploadPayslipScreen;

