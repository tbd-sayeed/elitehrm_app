# Navigation Plan & iOS Fixes

## Get Started Button Plan

### Current Implementation
- **"Get Started" Button**: Will navigate to **Email Verification Screen** (for new user registration flow)
- **"Sign In" Button**: Will navigate to **Login Screen** (for existing users)

### Navigation Flow

```
Welcome Screen
    │
    ├─ "Get Started" → Email Verification → Code Verification → Set Password → Login
    │
    └─ "Sign In" → Login Screen → Dashboard (if authenticated)
```

### Detailed Flow for "Get Started"

1. **Welcome Screen** → User taps "Get Started"
2. **Email Verification Screen** → User enters email, receives verification code
3. **Code Verification Screen** → User enters 6-digit code
4. **Set Password Screen** → User sets their password (if not set before)
5. **Login Screen** → User can now login with email and password

### Detailed Flow for "Sign In"

1. **Welcome Screen** → User taps "Sign In"
2. **Login Screen** → User enters email and password
3. **Dashboard** → User is authenticated and sees main app

---

## iOS Layout Fixes Applied

### Issues Fixed

1. **Layout Overflow**: The `illustrationContainer` with `flex: 1` was taking too much space on iOS, causing content to be pushed off-screen or overlapping.

2. **Safe Area Handling**: Improved safe area insets handling for iOS devices with notches.

3. **Scrollable Content**: Added `ScrollView` to make content scrollable on smaller iOS devices.

4. **Fixed Bottom Buttons**: Buttons are now fixed at the bottom with proper shadow/elevation for iOS.

### Changes Made

1. **Added ScrollView**: Wrapped scrollable content in `ScrollView` for better iOS compatibility
2. **Removed flex: 1 from illustration**: Changed to `minHeight` instead of `flex: 1`
3. **Platform-specific styling**: Added iOS-specific padding and shadow styles
4. **Fixed button container**: Made buttons container fixed at bottom with proper styling
5. **Better spacing**: Adjusted padding and margins for iOS devices

### Code Changes

- Added `ScrollView` component
- Changed `illustrationContainer` from `flex: 1` to `minHeight: 220`
- Added `Platform.select()` for iOS-specific styles
- Fixed button container with shadow/elevation
- Improved safe area handling

---

## Next Steps

### To Complete Navigation

1. **Create Email Verification Screen** (`src/screens/auth/EmailVerificationScreen.tsx`)
   - Add to `AuthNavigator.tsx` as `EmailVerification` route
   - Update `handleGetStarted` to navigate: `navigation.navigate('EmailVerification')`

2. **Create Login Screen** (`src/screens/auth/LoginScreen.tsx`)
   - Add to `AuthNavigator.tsx` as `Login` route
   - Update `handleSignIn` to navigate: `navigation.navigate('Login')`

3. **Create Other Auth Screens** (as per plan)
   - Code Verification Screen
   - Set Password Screen
   - Forgot Password Screen

4. **Update AuthNavigator** to include all routes:
   ```typescript
   export type AuthStackParamList = {
     Welcome: undefined;
     EmailVerification: undefined;
     CodeVerification: { email: string };
     SetPassword: { email: string; code: string };
     Login: undefined;
     ForgotPassword: undefined;
   };
   ```

---

## Testing

### iOS
- ✅ Layout now properly displays on iOS devices
- ✅ Content is scrollable if needed
- ✅ Buttons are fixed at bottom
- ✅ Safe areas are properly handled

### Android
- ✅ Layout works correctly (was already working)
- ✅ Elevation shadows work properly
- ✅ Safe areas handled

---

## Notes

- Navigation is prepared but commented out until screens are created
- All navigation will be static (no API calls) until we implement functionality
- TypeScript types are set up for type-safe navigation

