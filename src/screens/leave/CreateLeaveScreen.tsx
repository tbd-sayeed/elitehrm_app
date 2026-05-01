/**
 * Create Leave Request Screen - Form to create new leave request
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { getLeaveBalances, createLeaveRequest } from '../../api/leave';
import { showToast } from '../../utils/toast';

type CreateLeaveNavigationProp = StackNavigationProp<
  MainStackParamList,
  'CreateLeave'
>;

const parseDate = (str: string): Date => {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  return new Date();
};

const formatDateForDisplay = (str: string): string => {
  if (!str) return '';
  const d = parseDate(str);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateForApi = (d: Date): string => d.toISOString().slice(0, 10);

interface LeavePolicy {
  id: string;
  policyId: number;
  name: string;
  remainingDays: number;
}

const CreateLeaveScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CreateLeaveNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);

  const [formData, setFormData] = useState({
    policyId: '',
    startDate: '',
    endDate: '',
    comments: '',
  });

  const [calculatedDays, setCalculatedDays] = useState(0);
  const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(
    null,
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const iosDateDisplay = Platform.OS === 'ios' ? (Platform.isPad ? 'inline' : 'spinner') : 'calendar';

  useEffect(() => {
    const loadPolicies = async () => {
      try {
        const response = await getLeaveBalances();
        if (response.success && response.data?.length) {
          setPolicies(
            response.data.map((b) => ({
              id: String(b.time_off_policy.id),
              policyId: b.time_off_policy.id,
              name: b.time_off_policy.name,
              remainingDays: b.remaining_days,
            }))
          );
        } else {
          setPolicies([]);
        }
      } catch {
        setPolicies([]);
      } finally {
        setLoadingPolicies(false);
      }
    };
    loadPolicies();
  }, []);

  const handlePolicySelect = (policy: LeavePolicy) => {
    setSelectedPolicy(policy);
    setFormData((prev) => ({ ...prev, policyId: policy.id }));
  };

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      setCalculatedDays(0);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setCalculatedDays(0);
      return;
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setCalculatedDays(diffDays);
  };

  const handleStartDateSelect = (selectedDate: Date | undefined) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const str = formatDateForApi(selectedDate);
      setFormData((prev) => ({ ...prev, startDate: str }));
      calculateDays(str, formData.endDate);
    }
  };

  const handleEndDateSelect = (selectedDate: Date | undefined) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const str = formatDateForApi(selectedDate);
      setFormData((prev) => ({ ...prev, endDate: str }));
      calculateDays(formData.startDate, str);
    }
  };

  const validateForm = () => {
    if (!formData.policyId) {
      Alert.alert('Validation Error', 'Please select a leave policy');
      return false;
    }
    if (!formData.startDate) {
      Alert.alert('Validation Error', 'Please select a start date');
      return false;
    }
    if (!formData.endDate) {
      Alert.alert('Validation Error', 'Please select an end date');
      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      Alert.alert(
        'Validation Error',
        'Start date must be today or in the future',
      );
      return false;
    }

    if (end < start) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return false;
    }

    if (selectedPolicy && calculatedDays > selectedPolicy.remainingDays) {
      Alert.alert(
        'Insufficient Balance',
        `You only have ${selectedPolicy.remainingDays} days remaining. You are requesting ${calculatedDays} days.`,
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedPolicy) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await createLeaveRequest({
        time_off_policy_id: selectedPolicy.policyId,
        leave_type: 'regular',
        start_date: formData.startDate,
        end_date: formData.endDate,
        comments: formData.comments.trim() || undefined,
      });

      if (response.success) {
        showToast.success('Leave Request', response.message);
        navigation.goBack();
      } else {
        showToast.error('Submit Failed', response.message || 'Failed to submit leave request');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors as Record<string, string[]>)
              .flat()
              .join(', ')
          : null) ||
        err.message ||
        'Failed to submit leave request. Please try again.';
      showToast.error('Submit Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1a5a" />
      
      {/* Notch area - darker colored background */}
      <View style={[styles.notchArea, { height: insets.top }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Leave Request</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Policy Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Time Off Policy <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            Select a leave policy from the available options
          </Text>
          {loadingPolicies ? (
            <View style={styles.loadingPolicies}>
              <ActivityIndicator size="small" color="#1a237e" />
              <Text style={styles.loadingPoliciesText}>Loading policies...</Text>
            </View>
          ) : policies.length === 0 ? (
            <Text style={styles.noPoliciesText}>No leave policies available</Text>
          ) : (
          policies.map((policy) => (
            <TouchableOpacity
              key={policy.id}
              style={[
                styles.policyOption,
                formData.policyId === policy.id && styles.policyOptionSelected,
              ]}
              onPress={() => handlePolicySelect(policy)}
              activeOpacity={0.7}>
              <View style={styles.policyInfo}>
                <Text
                  style={[
                    styles.policyName,
                    formData.policyId === policy.id &&
                      styles.policyNameSelected,
                  ]}>
                  {policy.name}
                </Text>
                <Text style={styles.policyRemaining}>
                  {policy.remainingDays} days remaining
                </Text>
              </View>
              {formData.policyId === policy.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
          )}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Start Date <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.datePickerTouchable}
              onPress={() => setShowStartDatePicker(true)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.datePickerText,
                  !formData.startDate && styles.datePickerPlaceholder,
                ]}>
                {formData.startDate
                  ? formatDateForDisplay(formData.startDate)
                  : 'Select start date'}
              </Text>
              <Text style={styles.datePickerIcon}>📅</Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <>
                <DateTimePicker
                  value={formData.startDate ? parseDate(formData.startDate) : new Date()}
                  mode="date"
                  display={iosDateDisplay as any}
                  minimumDate={new Date()}
                  themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
                  textColor={Platform.OS === 'ios' ? '#0f172a' : undefined}
                  onChange={(_, selectedDate) => handleStartDateSelect(selectedDate)}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.datePickerDoneBtn}
                    onPress={() => setShowStartDatePicker(false)}>
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              End Date <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.datePickerTouchable}
              onPress={() => setShowEndDatePicker(true)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.datePickerText,
                  !formData.endDate && styles.datePickerPlaceholder,
                ]}>
                {formData.endDate
                  ? formatDateForDisplay(formData.endDate)
                  : 'Select end date'}
              </Text>
              <Text style={styles.datePickerIcon}>📅</Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <>
                <DateTimePicker
                  value={
                    formData.endDate
                      ? parseDate(formData.endDate)
                      : formData.startDate
                        ? parseDate(formData.startDate)
                        : new Date()
                  }
                  mode="date"
                  display={iosDateDisplay as any}
                  minimumDate={
                    formData.startDate
                      ? parseDate(formData.startDate)
                      : new Date()
                  }
                  themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
                  textColor={Platform.OS === 'ios' ? '#0f172a' : undefined}
                  onChange={(_, selectedDate) => handleEndDateSelect(selectedDate)}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.datePickerDoneBtn}
                    onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {calculatedDays > 0 && (
            <View style={styles.daysContainer}>
              <Text style={styles.daysLabel}>Calculated Days:</Text>
              <Text style={styles.daysValue}>{calculatedDays} days</Text>
              {selectedPolicy &&
                calculatedDays > selectedPolicy.remainingDays && (
                  <Text style={styles.warningText}>
                    ⚠️ Insufficient balance! You only have{' '}
                    {selectedPolicy.remainingDays} days remaining.
                  </Text>
                )}
            </View>
          )}
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any additional comments..."
            placeholderTextColor="#9e9e9e"
            value={formData.comments}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, comments: value }))
            }
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}>
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  loadingPolicies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  loadingPoliciesText: {
    fontSize: 15,
    color: '#757575',
  },
  noPoliciesText: {
    fontSize: 15,
    color: '#757575',
    paddingVertical: 24,
  },
  required: {
    color: '#f44336',
  },
  policyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  policyOptionSelected: {
    borderColor: '#1a237e',
    backgroundColor: '#e3f2fd',
  },
  policyInfo: {
    flex: 1,
  },
  policyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  policyNameSelected: {
    color: '#1a237e',
  },
  policyRemaining: {
    fontSize: 14,
    color: '#757575',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#757575',
    marginTop: 6,
  },
  datePickerTouchable: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },
  datePickerText: {
    fontSize: 16,
    color: '#212121',
  },
  datePickerPlaceholder: {
    color: '#9e9e9e',
  },
  datePickerIcon: {
    fontSize: 20,
  },
  datePickerDoneBtn: {
    backgroundColor: '#1a237e',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  datePickerDoneText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  daysContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  daysValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  warningText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 8,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#b0bec5',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

export default CreateLeaveScreen;

