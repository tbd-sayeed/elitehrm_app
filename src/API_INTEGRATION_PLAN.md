# API Integration Plan - Step by Step

## Current Status ✅
- ✅ API Client configured with interceptors
- ✅ Auth API service with all endpoints
- ✅ Storage utilities (tokens, user data)
- ✅ Auth store (Zustand) for state management
- ✅ All dependencies installed

## Integration Steps

### Step 1: Authentication Flow
1. **Email Verification Screen** - Connect API
2. **Code Verification Screen** - Connect API
3. **Set Password Screen** - Connect API
4. **Login Screen** - Connect API & Navigation
5. **Splash Screen** - Check auth state & auto-login

### Step 2: Profile Management
1. **Profile Screen** - Fetch & display profile data
2. **Edit Profile Screen** - Update profile with API

### Step 3: Attendance/Timesheet
1. **Attendance List Screen** - Fetch & display attendance
2. **Timesheet Detail Screen** - Fetch & display timesheet details
3. **Dashboard** - Fetch current timesheet & stats

### Step 4: Leave Management
1. **Leave List Screen** - Fetch & display leave requests
2. **Create Leave Screen** - Submit leave request
3. **Leave Detail Screen** - Fetch & display leave details
4. **Leave Balances Screen** - Fetch & display balances
5. **Dashboard** - Update leave statistics

---

## Implementation Order

We'll implement one screen at a time, test it, then move to the next.

**Starting with: Step 1.1 - Email Verification Screen**

