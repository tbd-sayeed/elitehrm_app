# React Native Mobile App - Development Plan

## Overview
This document provides a detailed, step-by-step plan for developing the Employee Mobile App using React Native, based on the HR Management System API.

## Technology Stack

### Core Technologies
- **React Native** (Latest stable version)
- **JavaScript** (ES6+)
- **React Navigation** (v6+) - For navigation
- **React Query / TanStack Query** - For API state management and caching
- **Axios** - For HTTP requests
- **AsyncStorage** - For local token storage
- **React Hook Form** - For form handling
- **Yup** or **Joi** - For form validation

### UI Libraries (Optional)
- **React Native Paper** or **NativeBase** - UI component library
- **React Native Vector Icons** - For icons
- **React Native Image Picker** - For photo uploads
- **React Native Date Picker** - For date selection

### State Management
- **Zustand** or **Redux Toolkit** - For global state (if needed beyond React Query)
- **React Query** - Primary state management for API data

---

## Project Structure

```
employee-mobile-app/
├── src/
│   ├── api/
│   │   ├── client.js              # Axios instance with interceptors
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── profile.js              # Profile endpoints
│   │   ├── attendance.js          # Attendance/timesheet endpoints
│   │   └── leave.js               # Leave management endpoints
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── ErrorMessage.js
│   │   │   └── Card.js
│   │   ├── auth/
│   │   │   ├── EmailInput.js
│   │   │   ├── CodeInput.js
│   │   │   └── PasswordInput.js
│   │   └── leave/
│   │       ├── LeaveCard.js
│   │       └── PolicySelector.js
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── EmailVerificationScreen.js
│   │   │   ├── CodeVerificationScreen.js
│   │   │   ├── SetPasswordScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   └── ForgotPasswordScreen.js
│   │   ├── profile/
│   │   │   ├── ProfileScreen.js
│   │   │   └── EditProfileScreen.js
│   │   ├── attendance/
│   │   │   ├── AttendanceListScreen.js
│   │   │   └── TimesheetDetailScreen.js
│   │   ├── leave/
│   │   │   ├── LeaveListScreen.js
│   │   │   ├── LeaveDetailScreen.js
│   │   │   ├── CreateLeaveScreen.js
│   │   │   └── LeaveBalancesScreen.js
│   │   └── home/
│   │       └── DashboardScreen.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── MainNavigator.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProfile.js
│   │   ├── useAttendance.js
│   │   └── useLeave.js
│   ├── store/
│   │   ├── authStore.js           # Auth state (tokens, user info)
│   │   └── appStore.js            # App-wide state
│   ├── utils/
│   │   ├── storage.js             # AsyncStorage helpers
│   │   ├── validation.js          # Validation schemas
│   │   ├── dateUtils.js           # Date formatting helpers
│   │   └── constants.js           # App constants
│   └── App.js
├── assets/
│   ├── images/
│   └── fonts/
├── .env.example
└── package.json
```

---

## Phase 1: Project Setup & Configuration (Week 1)

### Step 1.1: Initialize React Native Project
```bash
npx react-native init EmployeeMobileApp
cd EmployeeMobileApp
```

### Step 1.2: Install Core Dependencies
```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# API & State Management
npm install @tanstack/react-query axios
npm install zustand  # or @reduxjs/toolkit react-redux

# Storage
npm install @react-native-async-storage/async-storage

# Forms & Validation
npm install react-hook-form yup  # or joi

# UI Components (Choose one)
npm install react-native-paper  # or native-base

# Utilities
npm install react-native-vector-icons
npm install react-native-image-picker
npm install react-native-date-picker
npm install date-fns  # For date manipulation
```

### Step 1.3: Configure Environment Variables
Create `.env` file:
```env
API_BASE_URL=http://127.0.0.1:8000/api/v1/employee
API_TIMEOUT=30000
```

Install `react-native-config` for environment variables:
```bash
npm install react-native-config
```

### Step 1.4: Setup API Client
Create `src/api/client.js`:
- Configure Axios instance with base URL
- Add request interceptor to attach auth token
- Add response interceptor for error handling
- Handle token refresh logic

### Step 1.5: Setup Navigation Structure
- Setup Auth Navigator (for login/registration flow)
- Setup Main Navigator (for authenticated screens)
- Create App Navigator that switches between Auth and Main

### Step 1.6: Setup Storage Utilities
Create `src/utils/storage.js`:
- Functions to store/retrieve access token
- Functions to store/retrieve refresh token
- Functions to store/retrieve user data
- Clear storage on logout

---

## Phase 2: Authentication Flow (Week 2)

### Step 2.1: Email Verification Screen
**Screen**: `EmailVerificationScreen.js`

**Features**:
- Email input field
- Validation (email format, required)
- "Send Code" button
- Loading state
- Error handling
- Success message

**API Call**: `POST /api/v1/employee/auth/verify-email`

**Flow**:
1. User enters email
2. Validate email format
3. Call API to send verification code
4. Show success message
5. Navigate to Code Verification Screen

### Step 2.2: Code Verification Screen
**Screen**: `CodeVerificationScreen.js`

**Features**:
- 6-digit code input (auto-focus between fields)
- Resend code button (with countdown timer)
- "Verify" button
- Loading state
- Error handling

**API Call**: `POST /api/v1/employee/auth/verify-code`

**Flow**:
1. User enters 6-digit code
2. Call API to verify code
3. If verified and password not set → Navigate to Set Password Screen
4. If verified and password already set → Navigate to Login Screen
5. Handle expired/invalid code errors

### Step 2.3: Set Password Screen
**Screen**: `SetPasswordScreen.js`

**Features**:
- Password input (with show/hide toggle)
- Confirm password input
- Password strength indicator (optional)
- Validation:
  - Minimum 8 characters
  - Mixed case letters
  - At least one number
  - Passwords match
- "Set Password" button
- Loading state

**API Call**: `POST /api/v1/employee/auth/set-password`

**Flow**:
1. User enters password and confirmation
2. Validate password requirements
3. Call API with email, code, and password
4. On success → Navigate to Login Screen
5. Handle errors (expired code, validation errors)

### Step 2.4: Login Screen
**Screen**: `LoginScreen.js`

**Features**:
- Email input
- Password input (with show/hide toggle)
- "Login" button
- "Forgot Password?" link
- Loading state
- Error handling
- Remember me checkbox (optional)

**API Call**: `POST /api/v1/employee/auth/login`

**Flow**:
1. User enters email and password
2. Validate inputs
3. Call login API
4. Store tokens and user data
5. Navigate to Dashboard/Home Screen

**Response Handling**:
- Store `access_token` and `refresh_token`
- Store employee data
- Store leave statistics
- Store latest timesheet data
- Store public holidays

### Step 2.5: Forgot Password Flow
**Screens**: `ForgotPasswordScreen.js`, `ResetPasswordScreen.js`

**Features**:
- Email verification (same as registration)
- Code verification (same as registration)
- Password reset form
- Success message and redirect to login

**API Calls**:
- `POST /api/v1/employee/auth/forgot-password`
- `POST /api/v1/employee/auth/verify-code`
- `POST /api/v1/employee/auth/reset-password`

### Step 2.6: Token Management
**File**: `src/api/client.js` and `src/hooks/useAuth.js`

**Features**:
- Automatic token refresh on 401 errors
- Token storage in AsyncStorage
- Token expiration handling
- Logout on refresh failure

**Implementation**:
1. Intercept 401 responses
2. Attempt token refresh using refresh token
3. Retry original request with new token
4. If refresh fails → Logout user

### Step 2.7: Auth State Management
**File**: `src/store/authStore.js`

**State**:
- `isAuthenticated: boolean`
- `user: Employee | null`
- `accessToken: string | null`
- `refreshToken: string | null`
- `isLoading: boolean`

**Actions**:
- `login(tokenData, userData)`
- `logout()`
- `refreshAccessToken()`
- `updateUser(userData)`

---

## Phase 3: Dashboard & Profile (Week 3)

### Step 3.1: Dashboard Screen
**Screen**: `DashboardScreen.js`

**Layout**:
```
┌─────────────────────────────┐
│  Welcome, [Employee Name]   │
│  [Profile Photo]            │
├─────────────────────────────┤
│  Leave Statistics           │
│  ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 35  │ │  0  │ │ 35  │  │
│  │Total│ │Taken│ │Remain│  │
│  └─────┘ └─────┘ └─────┘  │
├─────────────────────────────┤
│  Latest Timesheet            │
│  Period: M01-2026            │
│  Status: Approved            │
│  Hours: 45h 30m              │
├─────────────────────────────┤
│  Upcoming Public Holidays    │
│  • New Year's Day - Jan 1    │
│  • Easter Monday - Apr 6     │
├─────────────────────────────┤
│  Quick Actions               │
│  [View Attendance]           │
│  [Request Leave]              │
│  [View Profile]              │
└─────────────────────────────┘
```

**Data Sources**:
- Use login response data (cached)
- Refresh on pull-to-refresh
- Display employee info, leave stats, latest timesheet, public holidays

**Features**:
- Pull-to-refresh
- Navigation to detail screens
- Quick action buttons
- Profile photo display

### Step 3.2: Profile Screen
**Screen**: `ProfileScreen.js`

**Display**:
- Profile photo (large, circular)
- Employee information (read-only):
  - Name, Title
  - Email
  - Phone numbers
  - Address
  - Date of birth
  - Gender, Marital status
  - Company name
  - Position(s)
  - Employment type
- "Edit Profile" button

**API Call**: `GET /api/v1/employee/profile`

**Features**:
- Pull-to-refresh
- Loading state
- Error handling
- Edit button navigation

### Step 3.3: Edit Profile Screen
**Screen**: `EditProfileScreen.js`

**Form Fields**:
- First Name (required)
- Last Name (required)
- Phone
- Home Phone
- Mobile Phone
- Date of Birth (date picker)
- Address
- City
- Postcode
- Country
- Nationality
- Gender (dropdown)
- Marital Status (dropdown)
- Photo (image picker with preview)

**API Call**: `PUT /api/v1/employee/profile`

**Features**:
- Form validation
- Photo upload (multipart/form-data)
- Photo preview
- Loading state
- Success/error messages
- Cancel button
- Save button

**Implementation**:
- Use `react-hook-form` for form management
- Use `react-native-image-picker` for photo selection
- Use `FormData` for multipart upload
- Show image preview before upload
- Handle upload progress (optional)

---

## Phase 4: Attendance & Timesheet (Week 4)

### Step 4.1: Attendance List Screen
**Screen**: `AttendanceListScreen.js`

**Features**:
- List of attendance entries
- Filters:
  - Date range picker
  - Month selector
- Pull-to-refresh
- Infinite scroll / Pagination
- Search functionality (optional)

**API Call**: `GET /api/v1/employee/attendance`

**Query Parameters**:
- `start_date` (optional)
- `end_date` (optional)
- `month` (optional, format: YYYY-MM)
- `per_page` (default: 30)
- `page` (for pagination)

**Display Format**:
```
┌─────────────────────────────┐
│  [Filters]                   │
├─────────────────────────────┤
│  📅 Jan 12, 2026 (Mon)      │
│  09:00 - 17:00              │
│  Break: 1h                   │
│  Total: 7h 0m                │
│  Contract: 7h 30m            │
│  Difference: -0h 30m        │
├─────────────────────────────┤
│  📅 Jan 11, 2026 (Sun)      │
│  Leave                       │
├─────────────────────────────┤
│  📅 Jan 10, 2026 (Sat)      │
│  Public Holiday              │
│  New Year's Day             │
└─────────────────────────────┘
```

**Card Components**:
- Date and day of week
- Start/Finish times (or Leave/Holiday indicator)
- Break duration
- Total hours
- Contract hours
- Difference (with color coding: green for overtime, red for under)
- Notes (if any)

### Step 4.2: Current Timesheet Screen
**Screen**: `CurrentTimesheetScreen.js` (Optional, can be part of Dashboard)

**Features**:
- Display current active timesheet
- Period information
- Status badge
- Summary statistics
- List of entries (same format as Attendance List)
- Link to full attendance list

**API Call**: `GET /api/v1/employee/attendance/current-timesheet`

**Display**:
- Period code
- Date range
- Status (Draft/Submitted/Approved/Rejected)
- Total hours summary
- Entry list

---

## Phase 5: Leave Management (Week 5)

### Step 5.1: Leave List Screen
**Screen**: `LeaveListScreen.js`

**Features**:
- List of leave requests
- Filters:
  - Status (All/Pending/Approved/Rejected/Cancelled)
  - Date range
- Pull-to-refresh
- Pagination
- "Create Leave Request" button (FAB or header button)

**API Call**: `GET /api/v1/employee/leaves`

**Query Parameters**:
- `status` (optional)
- `start_date` (optional)
- `end_date` (optional)
- `per_page` (default: 15)
- `page`

**Display Format**:
```
┌─────────────────────────────┐
│  [Filters] [+ New Request]  │
├─────────────────────────────┤
│  🟡 Pending                  │
│  Annual Leave               │
│  Jan 12 - Jan 16, 2026      │
│  5 days                     │
│  Comments: Family vacation   │
├─────────────────────────────┤
│  ✅ Approved                 │
│  Sick Leave                 │
│  Dec 20 - Dec 22, 2025      │
│  3 days                     │
└─────────────────────────────┘
```

**Card Components**:
- Status badge (color-coded)
- Policy name
- Date range
- Number of days
- Comments preview
- Tap to view details

### Step 5.2: Leave Detail Screen
**Screen**: `LeaveDetailScreen.js`

**Features**:
- Full leave request details
- Policy information
- Status information
- Approval information (if approved/rejected)
- Comments
- Status change notes
- Created/Updated timestamps

**API Call**: `GET /api/v1/employee/leaves/{id}`

**Display**:
- All leave request fields
- Read-only view
- Back button

### Step 5.3: Create Leave Request Screen
**Screen**: `CreateLeaveScreen.js`

**Form Fields**:
- Time Off Policy (dropdown/picker)
  - Show policy name and remaining days
  - Filter by available policies from login response
- Start Date (date picker)
- End Date (date picker)
  - Auto-calculate days
  - Validate end date >= start date
- Comments (multiline text input, optional)

**API Call**: `POST /api/v1/employee/leaves`

**Features**:
- Form validation
- Days calculation (auto-update)
- Policy selection with remaining days display
- Date validation (start date >= today)
- Overlap checking (show warning if exists)
- Balance checking (show error if insufficient)
- Loading state
- Success navigation
- Error handling

**Validation**:
- Policy required
- Start date required, >= today
- End date required, >= start date
- Check for overlapping requests
- Check leave balance

**Flow**:
1. User selects policy
2. User selects start date
3. User selects end date
4. System calculates days
5. System checks balance (show warning if low)
6. User adds comments (optional)
7. Submit request
8. Show success message
9. Navigate back to Leave List

### Step 5.4: Leave Balances Screen
**Screen**: `LeaveBalancesScreen.js`

**Features**:
- Display all leave policies with balances
- Show total, used, and remaining days
- Visual progress indicators
- Current year display
- Pull-to-refresh

**API Call**: `GET /api/v1/employee/leaves/balances`

**Display Format**:
```
┌─────────────────────────────┐
│  Leave Balances (2026)       │
├─────────────────────────────┤
│  Annual Leave               │
│  ████████████░░░░ 28/28     │
│  Total: 28 days             │
│  Used: 0 days               │
│  Remaining: 28 days          │
├─────────────────────────────┤
│  Sick Leave                 │
│  ███████░░░░░░░░░ 7/7       │
│  Total: 7 days              │
│  Used: 0 days               │
│  Remaining: 7 days          │
└─────────────────────────────┘
```

**Components**:
- Policy name
- Progress bar (visual representation)
- Total/Used/Remaining days
- Color coding (green for available, red for low)

---

## Phase 6: UI/UX Enhancements (Week 6)

### Step 6.1: Theme & Styling
- Define color palette
- Create theme constants
- Setup dark mode support (optional)
- Consistent spacing and typography
- Component styling library

### Step 6.2: Loading States
- Skeleton loaders for lists
- Loading spinners
- Pull-to-refresh indicators
- Button loading states

### Step 6.3: Error Handling
- Global error boundary
- Network error handling
- Validation error display
- Retry mechanisms
- Offline detection (optional)

### Step 6.4: Animations
- Screen transitions
- List item animations
- Button press feedback
- Loading animations

### Step 6.5: Accessibility
- Screen reader support
- Touch target sizes
- Color contrast
- Text scaling support

---

## Phase 7: Advanced Features (Week 7)

### Step 7.1: Push Notifications (Future)
- Setup Firebase Cloud Messaging
- Notification handling
- Background notifications
- Notification preferences

### Step 7.2: Offline Support (Optional)
- Cache API responses
- Offline data display
- Sync when online
- Queue actions for later

### Step 7.3: Biometric Authentication (Optional)
- Fingerprint/Face ID login
- Secure token storage
- Biometric prompt

### Step 7.4: Deep Linking
- Handle app links
- Navigation from notifications
- Share links

---

## Phase 8: Testing & Optimization (Week 8)

### Step 8.1: Unit Testing
- Component tests
- Hook tests
- Utility function tests
- API client tests

### Step 8.2: Integration Testing
- Authentication flow
- API integration
- Navigation flow

### Step 8.3: Performance Optimization
- Image optimization
- List virtualization
- Code splitting
- Bundle size optimization

### Step 8.4: Bug Fixes & Polish
- Fix reported bugs
- UI/UX improvements
- Performance tuning
- Final testing

---

## Implementation Details

### API Client Setup

```javascript
// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/employee';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refresh_token: refreshToken }
        );

        const { access_token } = response.data.data;
        await AsyncStorage.setItem('access_token', access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        // Navigate to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### React Query Setup

```javascript
// App.js
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}

export default App;
```

### Custom Hooks Example

```javascript
// src/hooks/useAuth.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      // Store tokens
      AsyncStorage.setItem('access_token', data.data.access_token);
      AsyncStorage.setItem('refresh_token', data.data.refresh_token);
      
      // Update auth store
      setAuth({
        user: data.data.employee,
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token,
      });

      // Cache initial data
      queryClient.setQueryData(['leaveStatistics'], data.data.leave_statistics);
      queryClient.setQueryData(['latestTimesheet'], data.data.latest_timesheet);
      queryClient.setQueryData(['publicHolidays'], data.data.public_holidays);
    },
  });
};
```

---

## Key Considerations

### Security
- Store tokens securely (consider using Keychain/Keystore)
- Never log sensitive data
- Validate all inputs
- Use HTTPS in production
- Implement certificate pinning (optional)

### Performance
- Optimize images (resize before upload)
- Implement pagination for long lists
- Use FlatList for efficient rendering
- Cache API responses appropriately
- Lazy load screens

### User Experience
- Provide clear error messages
- Show loading states
- Implement pull-to-refresh
- Add empty states
- Provide helpful validation messages

### Error Handling
- Network errors
- API errors (400, 401, 403, 404, 500)
- Validation errors
- Timeout errors
- Offline errors

---

## Testing Checklist

### Authentication
- [ ] Email verification flow
- [ ] Code verification (valid/invalid/expired)
- [ ] Password setup
- [ ] Login (success/error)
- [ ] Forgot password flow
- [ ] Token refresh
- [ ] Logout

### Profile
- [ ] View profile
- [ ] Edit profile
- [ ] Photo upload
- [ ] Form validation

### Attendance
- [ ] View attendance list
- [ ] Filter by date range
- [ ] Filter by month
- [ ] Pagination
- [ ] Current timesheet view

### Leave Management
- [ ] View leave list
- [ ] Filter by status
- [ ] View leave details
- [ ] Create leave request
- [ ] View leave balances
- [ ] Validation (overlap, balance)

### General
- [ ] Navigation flow
- [ ] Pull-to-refresh
- [ ] Error handling
- [ ] Loading states
- [ ] Offline handling (if implemented)

---

## Deployment Checklist

### Pre-deployment
- [ ] Update API base URL to production
- [ ] Test on both iOS and Android
- [ ] Optimize app bundle size
- [ ] Update app version
- [ ] Generate app icons and splash screens
- [ ] Configure app permissions

### iOS
- [ ] Setup App Store Connect
- [ ] Generate certificates and provisioning profiles
- [ ] Archive and upload to App Store
- [ ] Submit for review

### Android
- [ ] Generate signed APK/AAB
- [ ] Setup Google Play Console
- [ ] Upload to Play Store
- [ ] Submit for review

---

## Timeline Summary

- **Week 1**: Project setup, API client, navigation
- **Week 2**: Authentication flow (email, code, password, login)
- **Week 3**: Dashboard and profile management
- **Week 4**: Attendance and timesheet viewing
- **Week 5**: Leave management (list, create, balances)
- **Week 6**: UI/UX enhancements, theming
- **Week 7**: Advanced features (optional)
- **Week 8**: Testing, optimization, bug fixes

**Total Estimated Time**: 8 weeks (with one developer)

---

## Next Steps

1. Review and approve this plan
2. Setup development environment
3. Initialize React Native project
4. Begin Phase 1 implementation
5. Regular progress reviews and adjustments

---

## Notes

- This plan assumes a single developer working full-time
- Adjust timeline based on team size and experience
- Prioritize core features first (auth, profile, leave)
- Add advanced features incrementally
- Regular testing and feedback loops are essential

