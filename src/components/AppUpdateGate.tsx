/**
 * App Update Gate - Shows update modal based on /api/v1/app-version policy
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAppVersionPolicy, AppVersionPolicy } from '../api/appVersion';
import { showToast } from '../utils/toast';

type UpdateState =
  | { visible: false }
  | {
      visible: true;
      force: boolean;
      storeUrl: string;
      installedBuild: number;
      minBuild: number;
      latestBuild: number;
    };

const toInt = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const evaluatePolicy = (policy: AppVersionPolicy) => {
  const installedBuild = toInt(DeviceInfo.getBuildNumber());
  const minBuild =
    Platform.OS === 'ios' ? toInt(policy.min_build_ios) : toInt(policy.min_build_android);
  const latestBuild =
    Platform.OS === 'ios' ? toInt(policy.latest_build_ios) : toInt(policy.latest_build_android);
  const storeUrl = Platform.OS === 'ios' ? policy.app_store_url : policy.play_store_url;

  const force = installedBuild > 0 && installedBuild < minBuild;
  const optional = installedBuild > 0 && installedBuild >= minBuild && installedBuild < latestBuild;

  return { installedBuild, minBuild, latestBuild, storeUrl, force, optional };
};

const AppUpdateGate: React.FC = () => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [state, setState] = useState<UpdateState>({ visible: false });
  const lastCheckedAtRef = useRef<number>(0);

  const openStore = useCallback(async (url: string) => {
    try {
      if (!url) {
        showToast.error('Update', 'Store link is not configured.');
        return;
      }
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        showToast.error('Update', 'Could not open the store link on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showToast.error('Update', 'Could not open the store. Please try again.');
    }
  }, []);

  const showIfNeeded = useCallback(async () => {
    // throttle checks (e.g. rapid foreground events)
    const now = Date.now();
    if (now - lastCheckedAtRef.current < 15_000) return;
    lastCheckedAtRef.current = now;

    try {
      const res = await getAppVersionPolicy();
      if (!res.success || !res.data) return;

      const { installedBuild, minBuild, latestBuild, storeUrl, force, optional } =
        evaluatePolicy(res.data);

      if (force) {
        setState({
          visible: true,
          force: true,
          storeUrl,
          installedBuild,
          minBuild,
          latestBuild,
        });
        return;
      }

      if (optional) {
        setState({
          visible: true,
          force: false,
          storeUrl,
          installedBuild,
          minBuild,
          latestBuild,
        });
        return;
      }

      setState({ visible: false });
    } catch {
      // Silent failure: don't block app if version endpoint fails
    }
  }, []);

  useEffect(() => {
    void showIfNeeded();

    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;
      appState.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        void showIfNeeded();
      }
    });
    return () => sub.remove();
  }, [showIfNeeded]);

  const dismissOptional = useCallback(async () => {
    if (!state.visible || state.force) return;
    setState({ visible: false });
  }, [state]);

  const title = state.visible && state.force ? 'Update required' : 'Update available';
  const message = useMemo(() => {
    if (!state.visible) return '';
    if (state.force) {
      return 'A newer version of EliteHR is required to continue. Please update the app to get the latest changes.';
    }
    return 'A newer version of EliteHR is available. Update now to get the latest improvements.';
  }, [state]);

  if (!state.visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!state.force) void dismissOptional();
      }}>
      <Pressable
        style={styles.overlay}
        onPress={() => {
          if (!state.force) void dismissOptional();
        }}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="arrow-up-circle-outline" size={24} color="#1a237e" />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Installed: {state.installedBuild}</Text>
            <Text style={styles.metaText}>Latest: {state.latestBuild}</Text>
          </View>

          <View style={styles.actions}>
            {!state.force && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => void dismissOptional()}
                activeOpacity={0.8}>
                <Text style={styles.secondaryText}>Later</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => void openStore(state.storeUrl)}
              activeOpacity={0.85}>
              <Text style={styles.primaryText}>Update now</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a', flex: 1 },
  message: { marginTop: 10, fontSize: 13, color: '#475569', lineHeight: 18 },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  actions: { marginTop: 14, flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryText: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#1a237e',
  },
  primaryText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});

export default AppUpdateGate;

