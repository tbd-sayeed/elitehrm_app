# API Integration Steps - Step-by-Step Plan

## Current Status

### ✅ Already Integrated:
1. **API Infrastructure**
   - ✅ API Client with interceptors (`src/api/client.ts`)
   - ✅ Auth API service (`src/api/auth.ts`)
   - ✅ API Configuration (`src/config/api.ts`)
   - ✅ Auth Store (Zustand) (`src/store/authStore.ts`)
   - ✅ Storage utilities (`src/utils/storage.ts`)
   - ✅ Auth utilities (`src/utils/auth.ts`)

2. **Authentication Screens**
   - ✅ Email Verification Screen (API integrated)
   - ✅ Code Verification Screen (API integrated)
   - ✅ Login Screen (API integrated)

### ⏳ Pending Integration:

1. **Authentication Flow**
   - ⏳ Set Password Screen (needs API integration)
   - ⏳ Forgot Password Screen (if exists)
   - ⏳ App Navigator (needs auth state check on startup)

2. **Profile Management**
   - ⏳ Profile Screen (needs API to fetch profile)
   - ⏳ Edit Profile Screen (needs API to update profile)

3. **Dashboard**
   - ⏳ Dashboard Screen (needs API to fetch dashboard data)

4. **Attendance**
   - ⏳ Attendance List Screen (needs API to fetch attendance)
   - ⏳ Timesheet Detail Screen (needs API to fetch timesheet)

5. **Leave Management**
   - ⏳ Leave List Screen (needs API to fetch leaves)
   - ⏳ Leave Detail Screen (needs API to fetch leave details)
   - ⏳ Create Leave Screen (needs API to create leave)
   - ⏳ Leave Balances Screen (needs API to fetch balances)

---

## Step-by-Step Integration Plan

### Phase 1: Complete Authentication Flow ✅ (Partially Done)
**Goal**: Ensure all auth screens work with API

1. ✅ Email Verification - DONE
2. ✅ Code Verification - DONE
3. ✅ Login - DONE
4. ⏳ **Set Password Screen** - Needs API integration
5. ⏳ **App Navigator** - Add auth state restoration on startup
6. ⏳ **Logout functionality** - Ensure it clears tokens properly

### Phase 2: Profile Management
**Goal**: Fetch and update user profile

1. ⏳ Create Profile API service (`src/api/profile.ts`)
2. ⏳ Integrate Profile Screen to fetch data
3. ⏳ Integrate Edit Profile Screen to update data
4. ⏳ Handle photo upload (multipart/form-data)

### Phase 3: Dashboard
**Goal**: Display real dashboard data

1. ⏳ Create Dashboard API service (or use existing endpoints)
2. ⏳ Fetch current timesheet data
3. ⏳ Fetch leave statistics
4. ⏳ Display real employee data
5. ⏳ Add loading states and error handling

### Phase 4: Attendance/Timesheet
**Goal**: Display attendance and timesheet data

1. ⏳ Create Attendance API service (`src/api/attendance.ts`)
2. ⏳ Integrate Attendance List Screen
3. ⏳ Integrate Timesheet Detail Screen
4. ⏳ Add filtering and pagination

### Phase 5: Leave Management
**Goal**: Full leave management functionality

1. ⏳ Create Leave API service (`src/api/leave.ts`)
2. ⏳ Integrate Leave List Screen
3. ⏳ Integrate Leave Detail Screen
4. ⏳ Integrate Create Leave Screen
5. ⏳ Integrate Leave Balances Screen
6. ⏳ Add form validation and error handling

---

## Implementation Order

We'll follow this order to ensure dependencies are met:

1. **Step 1**: Complete Authentication (Set Password + Auth State Restoration)
2. **Step 2**: Profile Management
3. **Step 3**: Dashboard
4. **Step 4**: Attendance
5. **Step 5**: Leave Management

---

## Notes

- Each step will be implemented independently
- We'll test each step before moving to the next
- Error handling and loading states will be added for each integration
- We'll use React Query for data fetching (already installed)
