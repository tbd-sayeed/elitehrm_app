/**
 * Profile Screen - Display employee profile information
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useAuthStore } from '../../store/authStore';
import { withCacheBust } from '../../utils/image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showToast } from '../../utils/toast';

const PRIVACY_POLICY_URL = 'https://hrm.elitementors.org.uk/privacy-policy';
const DATA_DELETION_POLICY_URL = 'https://hrm.elitementors.org.uk/data-deletion';
const ACCOUNT_DELETION_URL = 'https://hrm.elitementors.org.uk/account-deletion';

const capitalizeFirst = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '—';

type ProfileNavigationProp = StackNavigationProp<MainStackParamList, 'Profile'>;

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, photoCacheKey } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const profileData = {
    firstName: user?.first_name ?? '—',
    lastName: user?.last_name ?? '—',
    title: user?.positions?.[0]?.name ?? '—',
    email: user?.email ?? '—',
    phone: user?.phone ?? user?.mobile_phone ?? '—',
    homePhone: user?.home_phone ?? '—',
    mobilePhone: user?.mobile_phone ?? user?.phone ?? '—',
    address: user?.address ?? '—',
    city: user?.city ?? '—',
    postcode: user?.postcode ?? '—',
    country: user?.country ?? '—',
    nationality: user?.nationality ?? '—',
    dateOfBirth: user?.date_of_birth ?? '—',
    gender: user?.gender ? capitalizeFirst(user.gender) : '—',
    maritalStatus: user?.marital_status ? capitalizeFirst(user.marital_status) : '—',
    companyName: user?.company?.name ?? '—',
    position: user?.positions?.[0]?.name ?? '—',
    employmentType: user?.employment_type?.name ?? '—',
    photoUrl: user?.photo_url,
    placesOfWork: user?.places_of_work ?? [],
    emergencyContact: user?.emergency_contact,
    spouse: user?.spouse ?? null,
    bankDetails: user?.bank_details ?? null,
    gpInformation: user?.gp_information ?? null,
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Static - will add API call later
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleViewDocuments = () => {
    navigation.navigate('Documents');
  };

  const handleEditBankGp = () => {
    navigation.navigate('BankGpDetails');
  };

  const openUrl = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        showToast.error('Open link', 'Could not open the link on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showToast.error('Open link', 'Could not open the link. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Request account deletion',
      'This will open a secure page where you can request permanent deletion of your EliteHR account and profile data. Some records (e.g., timesheets/leave) may be retained for legal or payroll purposes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => void openUrl(ACCOUNT_DELETION_URL) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '—') return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const spouseStatusLabel = () => {
    const s: any = profileData.spouse;
    if (!s) return 'Not provided';
    const hasAny =
      Boolean(s.name) ||
      Boolean(s.date_of_birth) ||
      Boolean(s.passport_number) ||
      Boolean(s.phone);
    return hasAny ? 'On file' : 'Not provided';
  };

  const bankStatusLabel = () => {
    const b: any = profileData.bankDetails;
    if (!b) return 'Not provided';
    const hasAny =
      Boolean(b.account_holder_name) ||
      Boolean(b.sort_code) ||
      Boolean(b.account_number) ||
      Boolean(b.bank_name);
    return hasAny ? 'On file' : 'Not provided';
  };

  const gpStatusLabel = () => {
    const g: any = profileData.gpInformation;
    if (!g) return 'Not provided';
    const hasAny =
      Boolean(g.gp_name) ||
      Boolean(g.address) ||
      Boolean(g.telephone) ||
      Boolean(g.medical_information);
    return hasAny ? 'On file' : 'Not provided';
  };

  const maskAccountNumber = (value: string) => {
    const s = String(value || '').replace(/\s+/g, '');
    if (s.length <= 4) return s || '—';
    return `•••• ${s.slice(-4)}`;
  };

  const getInitials = () => {
    const f = profileData.firstName?.[0] ?? '';
    const l = profileData.lastName?.[0] ?? '';
    return `${f}${l}`.toUpperCase() || '—';
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
          activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Profile Photo Section */}
        <View style={styles.profilePhotoSection}>
          <View style={styles.profilePhotoContainer}>
            <View style={styles.profilePhoto}>
              {profileData.photoUrl ? (
                <Image
                  source={{ uri: withCacheBust(profileData.photoUrl, photoCacheKey) }}
                  style={styles.profilePhotoImage}
                />
              ) : (
                <Text style={styles.profilePhotoText}>{getInitials()}</Text>
              )}
            </View>
          </View>
          <Text style={styles.profileName}>
            {profileData.firstName} {profileData.lastName}
          </Text>
          <Text style={styles.profileTitle}>{profileData.title}</Text>
        </View>

        {/* Personal Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>First Name</Text>
            <Text style={styles.infoValue}>{profileData.firstName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Name</Text>
            <Text style={styles.infoValue}>{profileData.lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profileData.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{profileData.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Home Phone</Text>
            <Text style={styles.infoValue}>{profileData.homePhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Phone</Text>
            <Text style={styles.infoValue}>{profileData.mobilePhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>
              {formatDate(profileData.dateOfBirth)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{profileData.gender}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Marital Status</Text>
            <Text style={styles.infoValue}>{profileData.maritalStatus}</Text>
          </View>
        </View>

        {/* Address Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Address Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{profileData.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City</Text>
            <Text style={styles.infoValue}>{profileData.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Postcode</Text>
            <Text style={styles.infoValue}>{profileData.postcode}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Country</Text>
            <Text style={styles.infoValue}>{profileData.country}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nationality</Text>
            <Text style={styles.infoValue}>{profileData.nationality}</Text>
          </View>
        </View>

        {/* Employment Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Employment Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company</Text>
            <Text style={styles.infoValue}>{profileData.companyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Position</Text>
            <Text style={styles.infoValue}>{profileData.position}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employment Type</Text>
            <Text style={styles.infoValue}>{profileData.employmentType}</Text>
          </View>
          {profileData.placesOfWork.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Places of Work</Text>
              <Text style={styles.infoValue}>
                {profileData.placesOfWork.map((p: { name: string }) => p.name).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Emergency Contact Card */}
        {profileData.emergencyContact && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Emergency Contact</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{profileData.emergencyContact.full_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profileData.emergencyContact.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Relation</Text>
              <Text style={styles.infoValue}>{profileData.emergencyContact.relation}</Text>
            </View>
          </View>
        )}

        {/* Spouse Details (Optional) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spouse Details (Optional)</Text>
          {!profileData.spouse ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{spouseStatusLabel()}</Text>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {(profileData.spouse as any)?.name ?? '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>
                  {formatDate((profileData.spouse as any)?.date_of_birth ?? '—')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Passport Number</Text>
                <Text style={styles.infoValue}>
                  {(profileData.spouse as any)?.passport_number ?? '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>
                  {(profileData.spouse as any)?.phone ?? '—'}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{spouseStatusLabel()}</Text>
              </View>
            </>
          )}
        </View>

        {/* Bank Details & GP Information */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitleNoBorder}>Bank Details & GP Information</Text>
            <TouchableOpacity
              style={styles.cardIconBtn}
              onPress={handleEditBankGp}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="create-outline" size={18} color="#1a237e" />
            </TouchableOpacity>
          </View>
          <View style={styles.cardDivider} />

          <Text style={styles.subTitle}>Bank details</Text>
          {!profileData.bankDetails ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{bankStatusLabel()}</Text>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account holder</Text>
                <Text style={styles.infoValue}>
                  {(profileData.bankDetails as any)?.account_holder_name ?? '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bank name</Text>
                <Text style={styles.infoValue}>
                  {(profileData.bankDetails as any)?.bank_name ?? '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sort code</Text>
                <Text style={styles.infoValue}>
                  {(profileData.bankDetails as any)?.sort_code ?? '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account number</Text>
                <Text style={styles.infoValue}>
                  {maskAccountNumber((profileData.bankDetails as any)?.account_number)}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{bankStatusLabel()}</Text>
              </View>
            </>
          )}

          <View style={styles.blockDivider} />

          <Text style={styles.subTitle}>GP information</Text>
          {!profileData.gpInformation ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{gpStatusLabel()}</Text>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GP name</Text>
                <Text style={styles.infoValue}>
                  {(profileData.gpInformation as any)?.gp_name ?? '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telephone</Text>
                <Text style={styles.infoValue}>
                  {(profileData.gpInformation as any)?.telephone ?? '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {(profileData.gpInformation as any)?.address ?? '—'}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                <Text style={styles.infoLabel}>Medical info</Text>
                <Text style={styles.infoValue}>
                  {(profileData.gpInformation as any)?.medical_information ?? '—'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* My Documents */}
        <TouchableOpacity
          style={styles.documentsButton}
          onPress={handleViewDocuments}
          activeOpacity={0.8}>
          <Text style={styles.documentsButtonText}>My Documents</Text>
          <Text style={styles.documentsButtonSubtext}>
            View documents, validity and expiry
          </Text>
        </TouchableOpacity>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
          activeOpacity={0.8}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Legal & Privacy */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal & Privacy</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => void openUrl(PRIVACY_POLICY_URL)}
            activeOpacity={0.8}>
            <View style={styles.linkRowLeft}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#1a237e" />
              <Text style={styles.linkRowText}>Privacy Policy</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, styles.linkRowBorder]}
            onPress={() => void openUrl(DATA_DELETION_POLICY_URL)}
            activeOpacity={0.8}>
            <View style={styles.linkRowLeft}>
              <Ionicons name="document-text-outline" size={18} color="#1a237e" />
              <Text style={styles.linkRowText}>Data Deletion Policy</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, styles.linkRowBorder]}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}>
            <View style={styles.linkRowLeft}>
              <Ionicons name="trash-outline" size={18} color="#b91c1c" />
              <View>
                <Text style={[styles.linkRowText, { color: '#b91c1c' }]}>Delete account</Text>
                <Text style={styles.linkRowSubText}>
                  Request permanent account deletion
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
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
    backgroundColor: '#1a237e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
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
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  profilePhotoContainer: {
    marginBottom: 16,
  },
  profilePhotoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profilePhotoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 16,
    color: '#757575',
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleNoBorder: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
    paddingRight: 12,
  },
  cardIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: {
    marginTop: 12,
    marginBottom: 14,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  blockDivider: {
    marginTop: 16,
    marginBottom: 16,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  documentsButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
  },
  documentsButtonSubtext: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  editButton: {
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
  editButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  linkRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  linkRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  linkRowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  linkRowSubText: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});

export default ProfileScreen;

