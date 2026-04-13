/**
 * Bank & GP Details Screen
 * @format
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { MainStackParamList } from '../../navigation/MainNavigator';
import { getBankGpDetails, updateBankGpDetails } from '../../api/bankGp';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../../utils/toast';

type NavProp = StackNavigationProp<MainStackParamList, 'BankGpDetails'>;

type BankForm = {
  account_holder_name: string;
  sort_code: string;
  account_number: string;
  bank_name: string;
};

type GpForm = {
  gp_name: string;
  address: string;
  telephone: string;
  medical_information: string;
};

const emptyBank: BankForm = {
  account_holder_name: '',
  sort_code: '',
  account_number: '',
  bank_name: '',
};

const emptyGp: GpForm = {
  gp_name: '',
  address: '',
  telephone: '',
  medical_information: '',
};

const toStr = (v: any) => (v == null ? '' : String(v));

const normalizeSection = <T extends Record<string, string>>(obj: T) => {
  const out: Record<string, string | null> = {};
  Object.keys(obj).forEach((k) => {
    const val = obj[k as keyof T];
    const trimmed = typeof val === 'string' ? val.trim() : '';
    out[k] = trimmed.length ? trimmed : null;
  });
  return out;
};

const isAllEmpty = (obj: Record<string, string>) =>
  Object.values(obj).every((v) => !String(v || '').trim());

const BankGpDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { user, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bank, setBank] = useState<BankForm>(emptyBank);
  const [gp, setGp] = useState<GpForm>(emptyGp);

  const initialBankRef = useRef<BankForm>(emptyBank);
  const initialGpRef = useRef<GpForm>(emptyGp);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBankGpDetails();
      if (!res.success) {
        showToast.error('Details', res.message || 'Could not load details');
      }
      const bd = res.data?.bank_details ?? (user?.bank_details ?? null);
      const gi = res.data?.gp_information ?? (user?.gp_information ?? null);

      const nextBank: BankForm = {
        account_holder_name: toStr((bd as any)?.account_holder_name),
        sort_code: toStr((bd as any)?.sort_code),
        account_number: toStr((bd as any)?.account_number),
        bank_name: toStr((bd as any)?.bank_name),
      };
      const nextGp: GpForm = {
        gp_name: toStr((gi as any)?.gp_name),
        address: toStr((gi as any)?.address),
        telephone: toStr((gi as any)?.telephone),
        medical_information: toStr((gi as any)?.medical_information),
      };

      setBank(nextBank);
      setGp(nextGp);
      initialBankRef.current = nextBank;
      initialGpRef.current = nextGp;
    } catch (e: any) {
      showToast.error('Details', e?.message || 'Could not load details');
    } finally {
      setLoading(false);
    }
  }, [user?.bank_details, user?.gp_information]);

  useEffect(() => {
    void load();
  }, [load]);

  const bankChanged = useMemo(
    () => JSON.stringify(bank) !== JSON.stringify(initialBankRef.current),
    [bank]
  );
  const gpChanged = useMemo(
    () => JSON.stringify(gp) !== JSON.stringify(initialGpRef.current),
    [gp]
  );

  const handleSave = useCallback(async () => {
    const nothingChanged = !bankChanged && !gpChanged;
    if (nothingChanged) {
      showToast.info('No changes', 'Nothing to update.');
      return;
    }

    const payload: any = {};
    if (bankChanged) {
      payload.bank_details = isAllEmpty(bank) ? {} : normalizeSection(bank);
    }
    if (gpChanged) {
      payload.gp_information = isAllEmpty(gp) ? {} : normalizeSection(gp);
    }

    setSaving(true);
    try {
      const res = await updateBankGpDetails(payload);
      if (!res.success) {
        showToast.error('Update failed', res.message || 'Could not update details');
        return;
      }

      // Reflect immediately in local user store.
      const updatedBank = res.data?.bank_details ?? (isAllEmpty(bank) ? null : (normalizeSection(bank) as any));
      const updatedGp = res.data?.gp_information ?? (isAllEmpty(gp) ? null : (normalizeSection(gp) as any));
      updateUser({
        bank_details: updatedBank,
        gp_information: updatedGp,
      });

      initialBankRef.current = bank;
      initialGpRef.current = gp;
      showToast.success('Updated', 'Your details have been saved.');
      navigation.goBack();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Could not update details. Please try again.';
      showToast.error('Update failed', msg);
    } finally {
      setSaving(false);
    }
  }, [bank, gp, bankChanged, gpChanged, navigation, updateUser]);

  const handleClearBank = () => {
    Alert.alert(
      'Clear bank details?',
      'This will remove your saved bank details from the system.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setBank(emptyBank) },
      ]
    );
  };

  const handleClearGp = () => {
    Alert.alert(
      'Clear GP information?',
      'This will remove your saved GP information from the system.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setGp(emptyGp) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1a5a" />
      <View style={[styles.notchArea, { height: insets.top }]} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={saving}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank & GP Details</Text>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => void handleSave()}
          disabled={saving || loading}
          activeOpacity={0.8}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Bank Details</Text>
              <TouchableOpacity onPress={handleClearBank} activeOpacity={0.8}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Account holder name</Text>
            <TextInput
              style={styles.input}
              value={bank.account_holder_name}
              onChangeText={(v) => setBank((p) => ({ ...p, account_holder_name: v }))}
              placeholder="e.g. John Smith"
              placeholderTextColor="#9e9e9e"
            />

            <Text style={styles.label}>Sort code</Text>
            <TextInput
              style={styles.input}
              value={bank.sort_code}
              onChangeText={(v) => setBank((p) => ({ ...p, sort_code: v }))}
              placeholder="e.g. 12-34-56"
              placeholderTextColor="#9e9e9e"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.label}>Account number</Text>
            <TextInput
              style={styles.input}
              value={bank.account_number}
              onChangeText={(v) => setBank((p) => ({ ...p, account_number: v }))}
              placeholder="e.g. 12345678"
              placeholderTextColor="#9e9e9e"
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Bank name</Text>
            <TextInput
              style={styles.input}
              value={bank.bank_name}
              onChangeText={(v) => setBank((p) => ({ ...p, bank_name: v }))}
              placeholder="e.g. Barclays"
              placeholderTextColor="#9e9e9e"
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>GP Information</Text>
              <TouchableOpacity onPress={handleClearGp} activeOpacity={0.8}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>GP name</Text>
            <TextInput
              style={styles.input}
              value={gp.gp_name}
              onChangeText={(v) => setGp((p) => ({ ...p, gp_name: v }))}
              placeholder="e.g. Dr Jane Doe"
              placeholderTextColor="#9e9e9e"
            />

            <Text style={styles.label}>Telephone</Text>
            <TextInput
              style={styles.input}
              value={gp.telephone}
              onChangeText={(v) => setGp((p) => ({ ...p, telephone: v }))}
              placeholder="e.g. +44 20 1234 5678"
              placeholderTextColor="#9e9e9e"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={gp.address}
              onChangeText={(v) => setGp((p) => ({ ...p, address: v }))}
              placeholder="GP address"
              placeholderTextColor="#9e9e9e"
              multiline
            />

            <Text style={styles.label}>Medical information</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={gp.medical_information}
              onChangeText={(v) => setGp((p) => ({ ...p, medical_information: v }))}
              placeholder="Optional notes"
              placeholderTextColor="#9e9e9e"
              multiline
            />
          </View>

          <View style={styles.footerSpace} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  notchArea: { backgroundColor: '#0d1a5a', width: '100%' },
  header: {
    backgroundColor: '#1a237e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  saveBtn: {
    minWidth: 64,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 10, color: '#475569', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  clearText: { fontSize: 13, fontWeight: '800', color: '#b91c1c' },
  label: { marginTop: 10, marginBottom: 6, fontSize: 13, fontWeight: '700', color: '#0f172a' },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  footerSpace: { height: 24 },
});

export default BankGpDetailsScreen;

