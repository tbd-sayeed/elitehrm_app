/**
 * Edit Profile Screen - Edit employee profile information
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
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useAuthStore } from '../../store/authStore';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { updateProfile, updateProfilePhoto } from '../../api/profile';
import { showToast } from '../../utils/toast';
import { withCacheBust } from '../../utils/image';

type EditProfileNavigationProp = StackNavigationProp<
  MainStackParamList,
  'EditProfile'
>;

const initialFormData = {
  firstName: '',
  lastName: '',
  phone: '',
  homePhone: '',
  mobilePhone: '',
  dateOfBirth: '',
  address: '',
  city: '',
  postcode: '',
  country: '',
  nationality: '',
  gender: '',
  maritalStatus: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
};

const capitalizeFirst = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

const parseDate = (str: string): Date => {
  if (!str) return new Date(1990, 0, 1);
  const [y, m, d] = str.split('-').map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  return new Date(1990, 0, 1);
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

const formatDateForApi = (d: Date): string =>
  d.toISOString().slice(0, 10);

const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<EditProfileNavigationProp>();
  const { user, updateUser, photoCacheKey } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name ?? '',
        lastName: user.last_name ?? '',
        phone: user.phone ?? user.mobile_phone ?? '',
        homePhone: user.home_phone ?? '',
        mobilePhone: user.mobile_phone ?? user.phone ?? '',
        dateOfBirth: user.date_of_birth ?? '',
        address: user.address ?? '',
        city: user.city ?? '',
        postcode: user.postcode ?? '',
        country: user.country ?? '',
        nationality: user.nationality ?? '',
        gender: capitalizeFirst(user.gender ?? ''),
        maritalStatus: capitalizeFirst(user.marital_status ?? ''),
        emergencyContactName: user.emergency_contact?.full_name ?? '',
        emergencyContactPhone: user.emergency_contact?.phone ?? '',
        emergencyContactRelation: user.emergency_contact?.relation ?? '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Validation Error', 'First Name and Last Name are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateProfile({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
        home_phone: formData.homePhone.trim() || undefined,
        mobile_phone: formData.mobilePhone.trim() || undefined,
        emergency_contact_full_name: formData.emergencyContactName.trim() || undefined,
        emergency_contact_phone: formData.emergencyContactPhone.trim() || undefined,
        emergency_contact_relation: formData.emergencyContactRelation.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        postcode: formData.postcode.trim() || undefined,
        country: formData.country.trim() || undefined,
        date_of_birth: formData.dateOfBirth.trim() || undefined,
        gender: formData.gender.trim() || undefined,
        marital_status: formData.maritalStatus.trim() || undefined,
        nationality: formData.nationality.trim() || undefined,
      });

      if (response.success && response.data) {
        // Use form data for fields we sent so home_phone and others persist
        // even when backend omits them from the response
        const r = response.data;
        updateUser({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim(),
          home_phone: formData.homePhone.trim(),
          mobile_phone: formData.mobilePhone.trim(),
          emergency_contact: formData.emergencyContactName.trim()
            ? {
                full_name: formData.emergencyContactName.trim(),
                phone: formData.emergencyContactPhone.trim(),
                relation: formData.emergencyContactRelation.trim(),
              }
            : null,
          photo_url: r.photo_url,
          date_of_birth: formData.dateOfBirth.trim(),
          gender: formData.gender.trim()
            ? formData.gender.toLowerCase()
            : r.gender,
          marital_status: formData.maritalStatus.trim()
            ? formData.maritalStatus.toLowerCase()
            : r.marital_status,
          address: formData.address.trim(),
          city: formData.city.trim(),
          postcode: formData.postcode.trim(),
          country: formData.country.trim(),
          nationality: formData.nationality.trim(),
        });
        showToast.success('Profile Updated', response.message);
        navigation.goBack();
      } else {
        showToast.error('Update Failed', response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors
          ? Object.values(err.response.data.errors as Record<string, string[]>).flat().join(', ')
          : err.message ||
          'Failed to update profile. Please try again.';
      showToast.error('Update Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const uploadPhoto = async (uri: string, type?: string, fileName?: string) => {
    setIsUploadingPhoto(true);
    try {
      const response = await updateProfilePhoto({ uri, type, fileName });
      if (response.success && response.data?.photo_url) {
        updateUser({ photo_url: response.data.photo_url });
        setPhotoPreviewUri(null);
        showToast.success('Photo Updated', response.message);
      } else {
        showToast.error('Upload Failed', response.message || 'Failed to update photo');
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
        'Failed to update photo. Please try again.';
      showToast.error('Upload Failed', message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      const { ActionSheetIOS } = require('react-native');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Take Photo', 'Choose from Library', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) openCamera();
          else if (buttonIndex === 1) openLibrary();
        }
      );
    } else {
      Alert.alert('Profile Photo', undefined, [
        { text: 'Take Photo', onPress: () => openCamera() },
        { text: 'Choose from Library', onPress: () => openLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const confirmAndUploadPhoto = (uri: string, type?: string, fileName?: string) => {
    Alert.alert(
      'Upload Profile Photo',
      'Use this photo as your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' as const, onPress: () => setPhotoPreviewUri(null) },
        {
          text: 'Upload',
          onPress: () => uploadPhoto(uri, type, fileName),
        },
      ]
    );
  };

  const openCamera = () => {
    launchCamera(
      { mediaType: 'photo', maxWidth: 512, maxHeight: 512, quality: 0.6 },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          showToast.error('Camera Error', response.errorMessage || 'Could not access camera');
          return;
        }
        const asset = response.assets?.[0];
        if (asset?.uri) {
          setPhotoPreviewUri(asset.uri);
          confirmAndUploadPhoto(asset.uri, asset.type, asset.fileName);
        }
      }
    );
  };

  const openLibrary = () => {
    launchImageLibrary(
      { mediaType: 'photo', maxWidth: 512, maxHeight: 512, quality: 0.6 },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          showToast.error('Library Error', response.errorMessage || 'Could not access photos');
          return;
        }
        const asset = response.assets?.[0];
        if (asset?.uri) {
          setPhotoPreviewUri(asset.uri);
          confirmAndUploadPhoto(asset.uri, asset.type, asset.fileName);
        }
      }
    );
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getInitials = () => {
    return `${formData.firstName[0] || 'U'}${formData.lastName[0] || 'U'}`.toUpperCase();
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.saveButtonText,
              isLoading && styles.saveButtonTextDisabled,
            ]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Profile Photo Section */}
        <View style={styles.profilePhotoSection}>
          <View style={styles.profilePhotoContainer}>
            <View style={styles.profilePhoto}>
              {photoPreviewUri || user?.photo_url ? (
                <Image
                  source={{
                    uri: photoPreviewUri || (user?.photo_url ? withCacheBust(user.photo_url, photoCacheKey) : ''),
                  }}
                  style={styles.profilePhotoImage}
                />
              ) : (
                <Text style={styles.profilePhotoText}>{getInitials()}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handleChangePhoto}
              disabled={isUploadingPhoto}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.changePhotoText,
                  isUploadingPhoto && styles.changePhotoTextDisabled,
                ]}>
                {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              First Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter first name"
              placeholderTextColor="#9e9e9e"
              value={formData.firstName}
              onChangeText={(value) => updateField('firstName', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Last Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter last name"
              placeholderTextColor="#9e9e9e"
              value={formData.lastName}
              onChangeText={(value) => updateField('lastName', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#9e9e9e"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Home Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter home phone"
              placeholderTextColor="#9e9e9e"
              value={formData.homePhone}
              onChangeText={(value) => updateField('homePhone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter mobile phone"
              placeholderTextColor="#9e9e9e"
              value={formData.mobilePhone}
              onChangeText={(value) => updateField('mobilePhone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.datePickerTouchable}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.datePickerText,
                  !formData.dateOfBirth && styles.datePickerPlaceholder,
                ]}>
                {formData.dateOfBirth
                  ? formatDateForDisplay(formData.dateOfBirth)
                  : 'Select date'}
              </Text>
              <Text style={styles.datePickerIcon}>📅</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={parseDate(formData.dateOfBirth)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    updateField('dateOfBirth', formatDateForApi(selectedDate));
                  }
                }}
                maximumDate={new Date()}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.datePickerDoneBtn}
                  onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.radioGroup}>
              {['Male', 'Female', 'Other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioOption}
                  onPress={() => updateField('gender', option)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.radioCircle,
                      formData.gender === option && styles.radioCircleSelected,
                    ]}>
                    {formData.gender === option && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Marital Status</Text>
            <View style={styles.radioGroup}>
              {['Single', 'Married', 'Divorced', 'Widowed'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioOption}
                  onPress={() => updateField('maritalStatus', option)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.radioCircle,
                      formData.maritalStatus === option &&
                        styles.radioCircleSelected,
                    ]}>
                    {formData.maritalStatus === option && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Address Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter address"
              placeholderTextColor="#9e9e9e"
              value={formData.address}
              onChangeText={(value) => updateField('address', value)}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              placeholderTextColor="#9e9e9e"
              value={formData.city}
              onChangeText={(value) => updateField('city', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Postcode</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter postcode"
              placeholderTextColor="#9e9e9e"
              value={formData.postcode}
              onChangeText={(value) => updateField('postcode', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter country"
              placeholderTextColor="#9e9e9e"
              value={formData.country}
              onChangeText={(value) => updateField('country', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nationality</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter nationality"
              placeholderTextColor="#9e9e9e"
              value={formData.nationality}
              onChangeText={(value) => updateField('nationality', value)}
            />
          </View>
        </View>

        {/* Emergency Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter emergency contact name"
              placeholderTextColor="#9e9e9e"
              value={formData.emergencyContactName}
              onChangeText={(value) => updateField('emergencyContactName', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter emergency contact phone"
              placeholderTextColor="#9e9e9e"
              value={formData.emergencyContactPhone}
              onChangeText={(value) => updateField('emergencyContactPhone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Relation</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Spouse, Parent, Friend"
              placeholderTextColor="#9e9e9e"
              value={formData.emergencyContactRelation}
              onChangeText={(value) => updateField('emergencyContactRelation', value)}
            />
          </View>
        </View>
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
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  profilePhotoContainer: {
    alignItems: 'center',
  },
  profilePhotoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profilePhotoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  changePhotoTextDisabled: {
    opacity: 0.6,
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
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
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
  required: {
    color: '#f44336',
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
    height: 80,
    paddingTop: 16,
    textAlignVertical: 'top',
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
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  datePickerDoneBtn: {
    backgroundColor: '#1a237e',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  datePickerDoneText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#b0bec5',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#1a237e',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a237e',
  },
  radioLabel: {
    fontSize: 14,
    color: '#424242',
  },
});

export default EditProfileScreen;

