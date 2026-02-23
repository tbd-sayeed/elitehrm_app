# Employee Mobile API - Implementation Plan

## Overview
This document outlines the plan for developing a secure, RESTful API for employee mobile app (React Native) integration.

## ⚠️ CRITICAL: API Separation from Web Application

**The API will be completely separate from the web application to ensure zero interference with existing functionality.**

⚠️ **CRITICAL**: The API will be completely separate from the web application to ensure no interference with existing functionality.

### Separation Strategy:
1. **Separate Routes**: API routes in `routes/api.php` (separate from `routes/web.php`)
2. **Separate Controllers**: API controllers in `app/Http/Controllers/Api/V1/Employee/` (separate from HR/Admin controllers)
3. **Separate Middleware**: API-specific middleware (Sanctum auth, not session-based)
4. **Separate Authentication**: Token-based (Sanctum) for API, Session-based for web (unchanged)
5. **No Web Dependencies**: API will not use any web-specific features (sessions, CSRF, etc.)

### Directory Structure:
```
app/Http/Controllers/
├── Admin/              # Web app controllers (unchanged)
├── HR/                 # Web app controllers (unchanged)
├── Auth/               # Web app controllers (unchanged)
└── Api/
    └── V1/
        └── Employee/   # NEW: API controllers only
            ├── AuthController.php
            ├── ProfileController.php
            ├── AttendanceController.php
            └── LeaveController.php

routes/
├── web.php             # Web app routes (unchanged)
└── api.php             # NEW: API routes only
```

### Middleware Separation:
- **Web App**: Uses `auth` middleware (session-based) - **UNCHANGED**
- **API**: Uses `auth:sanctum` middleware (token-based) - **NEW**

### Configuration:
- API routes registered separately in `bootstrap/app.php`
- CORS configured for API only
- Rate limiting configured separately for API endpoints
- **No changes to web application configuration**

---

## Technology Stack
- **Authentication**: Laravel Sanctum (Token-based)
- **API Versioning**: `/api/v1/`
- **Response Format**: JSON
- **Security**: Rate limiting, CORS, Token expiration

---

## Database Schema Additions

### 1. Email Verification Codes Table
```sql
- id
- email (unique)
- code (6-digit)
- expires_at
- verified_at (nullable)
- attempts (default: 0)
- created_at
- updated_at
```

### 2. User Table Updates
- Add `email_verification_code_sent_at` (nullable timestamp)
- Add `password_set_at` (nullable timestamp)
- Add `is_password_set` (boolean, default: false)

### 3. Personal Access Tokens (Sanctum)
- Already handled by Laravel Sanctum migration
- Will store both access tokens and refresh tokens
- Token name will include device identifier for multi-device support

---

## API Endpoints Structure

### Base URL: `/api/v1/employee`

---

## 1. Authentication Flow

### 1.1 Email Verification Request
**Endpoint**: `POST /api/v1/employee/auth/verify-email`

**Request Body**:
```json
{
  "email": "employee@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "data": {
    "email": "employee@example.com",
    "expires_in": 600
  }
}
```

**Validation**:
- Email must exist in employees table (via user relationship)
- Email must not be verified already (if password is set)
- Rate limit: 3 requests per 10 minutes per email

**Logic**:
- Generate 6-digit random code
- Store in `email_verification_codes` table
- Send email with code
- Set expiration (10 minutes)

---

### 1.2 Verify Email Code
**Endpoint**: `POST /api/v1/employee/auth/verify-code`

**Request Body**:
```json
{
  "email": "employee@example.com",
  "code": "123456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email": "employee@example.com",
    "verified": true,
    "requires_password_setup": true
  }
}
```

**Validation**:
- Code must match
- Code must not be expired
- Maximum 5 attempts per code

**Logic**:
- Verify code
- Mark code as verified
- Return flag indicating password setup required

---

### 1.3 Set Password (First Time)
**Endpoint**: `POST /api/v1/employee/auth/set-password`

**Request Body**:
```json
{
  "email": "employee@example.com",
  "code": "123456", // Verification code
  "password": "SecurePassword123!",
  "password_confirmation": "SecurePassword123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password set successfully. Please login.",
  "data": {
    "email": "employee@example.com"
  }
}
```

**Validation**:
- Code must be verified
- Password: min 8 chars, must contain uppercase, lowercase, number
- Password confirmation must match

**Logic**:
- Verify code again
- Hash and store password
- Mark password as set
- Delete verification code

---

### 1.4 Login
**Endpoint**: `POST /api/v1/employee/auth/login`

**Request Body**:
```json
{
  "email": "employee@example.com",
  "password": "SecurePassword123!",
  "device_name": "iPhone 15 Pro" // Optional, for multi-device tracking
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "refresh_token": "2|yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
    "token_type": "Bearer",
    "expires_at": "2025-12-31T23:59:59.000000Z",
    "refresh_expires_at": "2026-01-30T23:59:59.000000Z",
    "employee": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "employee@example.com",
      "photo_url": "https://...",
      "company": {
        "id": 1,
        "name": "Company Name"
      }
    }
  }
}
```

**Validation**:
- Email and password required
- Credentials must match
- User must be employee role
- Password must be set

**Logic**:
- Authenticate user
- Create Sanctum access token (30 days expiration, named with device identifier)
- Create Sanctum refresh token (60 days expiration, named with device identifier)
- Store device information for multi-device tracking
- Return tokens with employee data

---

### 1.8 Refresh Token
**Endpoint**: `POST /api/v1/employee/auth/refresh-token`

**Request Body**:
```json
{
  "refresh_token": "2|yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "3|zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
    "refresh_token": "4|wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
    "token_type": "Bearer",
    "expires_at": "2026-01-30T23:59:59.000000Z",
    "refresh_expires_at": "2026-02-28T23:59:59.000000Z"
  }
}
```

**Validation**:
- Refresh token must be valid
- Refresh token must not be expired
- Refresh token must belong to authenticated user

**Logic**:
- Validate refresh token
- Revoke old tokens
- Create new access and refresh tokens
- Return new tokens

---

### 1.5 Forgot Password
**Endpoint**: `POST /api/v1/employee/auth/forgot-password`

**Request Body**:
```json
{
  "email": "employee@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset code sent to your email",
  "data": {
    "email": "employee@example.com",
    "expires_in": 600
  }
}
```

**Logic**:
- Generate new verification code
- Send email
- Rate limit: 3 per 10 minutes

---

### 1.6 Reset Password
**Endpoint**: `POST /api/v1/employee/auth/reset-password`

**Request Body**:
```json
{
  "email": "employee@example.com",
  "code": "123456",
  "password": "NewSecurePassword123!",
  "password_confirmation": "NewSecurePassword123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset successfully. Please login."
}
```

---

### 1.7 Logout
**Endpoint**: `POST /api/v1/employee/auth/logout`

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Logic**:
- Revoke current access token
- Revoke current refresh token
- Note: Multi-device login is allowed, so only current device tokens are revoked

---

### 1.9 Logout All Devices
**Endpoint**: `POST /api/v1/employee/auth/logout-all`

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

**Logic**:
- Revoke all tokens for the authenticated user
- Useful for security purposes (password change, suspicious activity)

---

## 2. Profile Management

### 2.1 Get Profile
**Endpoint**: `GET /api/v1/employee/profile`

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Mr",
    "first_name": "John",
    "last_name": "Doe",
    "email": "employee@example.com",
    "phone": "+1234567890",
    "mobile_phone": "+1234567890",
    "photo_url": "https://...",
    "date_of_birth": "1990-01-01",
    "address": "123 Street",
    "city": "London",
    "postcode": "SW1A 1AA",
    "country": "UK",
    "company": {
      "id": 1,
      "name": "Company Name"
    }
  }
}
```

---

### 2.2 Update Profile
**Endpoint**: `PUT /api/v1/employee/profile`

**Headers**: `Authorization: Bearer {token}`

**Request Body** (multipart/form-data):
```
first_name: "John"
last_name: "Doe"
phone: "+1234567890"
mobile_phone: "+1234567890"
address: "123 Street"
city: "London"
postcode: "SW1A 1AA"
country: "UK"
photo: [file] // Optional image file
```

**Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Updated profile data
  }
}
```

**Validation**:
- Only allow updating specific fields (not email, company, etc.)
- Photo: multipart/form-data (image file: jpg, png, gif, max 5MB)
- Resize photo if provided (maintain aspect ratio, max 800x800px)

---

## 3. Attendance/Timesheet

### 3.1 Get Attendance (Timesheet Entries)
**Endpoint**: `GET /api/v1/employee/attendance`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `start_date` (optional, format: Y-m-d)
- `end_date` (optional, format: Y-m-d)
- `month` (optional, format: Y-m)
- `page` (optional, default: 1)
- `per_page` (optional, default: 30)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "per_page": 30,
    "total": 100,
    "entries": [
      {
        "id": 1,
        "date": "2025-01-07",
        "day": "Tue",
        "start_time": "10:00",
        "finish_time": "14:00",
        "break_duration": "0.50",
        "total_hours": "3.50",
        "contract_hours": "3.50",
        "difference": "0.00",
        "is_leave": false,
        "is_public_holiday": false,
        "timesheet": {
          "id": 1,
          "period_code": "M01-2025",
          "status": "approved"
        }
      }
    ]
  }
}
```

---

### 3.2 Get Current Timesheet
**Endpoint**: `GET /api/v1/employee/attendance/current-timesheet`

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "timesheet": {
      "id": 1,
      "period_code": "M01-2025",
      "start_date": "2025-01-05",
      "end_date": "2025-02-04",
      "status": "draft",
      "total_hours": "45.50",
      "contract_hours": "45.50",
      "overtime_hours": "0.00"
    },
    "entries": [
      // Array of entries
    ]
  }
}
```

---

## 4. Leave Management

### 4.1 Get Leave Requests
**Endpoint**: `GET /api/v1/employee/leaves`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `status` (optional: pending, approved, rejected, cancelled)
- `start_date` (optional)
- `end_date` (optional)
- `page` (optional)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "per_page": 15,
    "total": 10,
    "leaves": [
      {
        "id": 1,
        "leave_type": "regular",
        "start_date": "2025-01-15",
        "end_date": "2025-01-17",
        "status": "approved",
        "time_off_policy": {
          "id": 1,
          "name": "Annual Leave"
        },
        "approved_by": {
          "name": "HR Manager"
        },
        "comments": "Family vacation",
        "created_at": "2025-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

### 4.2 Create Leave Request
**Endpoint**: `POST /api/v1/employee/leaves`

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "time_off_policy_id": 1,
  "leave_type": "regular",
  "start_date": "2025-02-15",
  "end_date": "2025-02-17",
  "comments": "Family vacation"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "id": 1,
    "leave_type": "regular",
    "start_date": "2025-02-15",
    "end_date": "2025-02-17",
    "status": "pending",
    "created_at": "2025-01-10T10:00:00Z"
  }
}
```

**Validation**:
- Dates must be valid
- End date must be after start date
- No overlapping leave requests
- Sufficient leave balance

---

### 4.3 Get Leave Request Details
**Endpoint**: `GET /api/v1/employee/leaves/{id}`

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "leave_type": "regular",
    "start_date": "2025-02-15",
    "end_date": "2025-02-17",
    "status": "approved",
    "time_off_policy": {
      "id": 1,
      "name": "Annual Leave"
    },
    "comments": "Family vacation",
    "status_change_note": "Approved by HR",
    "approved_by": {
      "name": "HR Manager"
    },
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": "2025-01-12T14:30:00Z"
  }
}
```

---

### 4.4 Get Leave Balances
**Endpoint**: `GET /api/v1/employee/leaves/balances`

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "time_off_policy": {
        "id": 1,
        "name": "Annual Leave"
      },
      "total_days": 25,
      "used_days": 5,
      "remaining_days": 20
    }
  ]
}
```

---

## Security Considerations

### 1. Rate Limiting
- Email verification: 3 requests per 10 minutes per email
- Login attempts: 5 per 15 minutes per IP
- General API: 60 requests per minute per token

### 2. Token Management
- Access token expiration: 30 days (configurable)
- Refresh token expiration: 60 days (configurable)
- Refresh token mechanism: Implemented
- Token revocation on logout (current device only)
- Multi-device login: Allowed (users can login from multiple devices)
- Logout all devices: Available for security purposes

### 3. CORS Configuration
- Allow only mobile app origins
- Configure in `config/cors.php`

### 4. Input Validation
- All inputs validated using Laravel Form Requests
- Sanitize user inputs
- SQL injection prevention (Eloquent ORM)

### 5. Password Security
- Minimum 8 characters
- Must contain uppercase, lowercase, number
- Hashed using bcrypt

### 6. Email Verification
- 6-digit random code
- 10-minute expiration
- Maximum 5 verification attempts
- Codes stored securely

---

## Response Format Standard

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Error message"]
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Invalid/expired token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests (Rate limit)
- `500` - Server Error

---

## Implementation Steps

1. **Setup & Configuration** (No Web App Changes)
   - Install Laravel Sanctum (if not already installed)
   - Configure CORS for API endpoints only
   - Create `routes/api.php` file (separate from web.php)
   - Register API routes in `bootstrap/app.php` (add api.php, keep web.php unchanged)
   - Setup rate limiting for API endpoints only
   - **Verify**: Web application continues to work normally

2. **Database Migrations**
   - Email verification codes table
   - Update users table
   - Run Sanctum migrations

3. **Models & Relationships** (Shared, No Breaking Changes)
   - EmailVerificationCode model (new, doesn't affect web)
   - Update User/Employee models (add relationships only, no breaking changes)
   - **Verify**: Web application models still work

4. **Controllers** (Completely Separate)
   - Create `app/Http/Controllers/Api/V1/Employee/` directory
   - AuthController (API only, separate from web LoginController)
   - ProfileController (API only, separate from web EmployeeController)
   - AttendanceController (API only, separate from web TimesheetController)
   - LeaveController (API only, separate from web LeaveController)
   - **Verify**: Web controllers remain untouched and functional

5. **Services**
   - EmailVerificationService
   - TokenService (handles access and refresh token generation/validation)

6. **Middleware** (API-Specific)
   - Create `EnsureEmployee` middleware for API (separate from web middleware)
   - API rate limiting middleware (separate from web rate limiting)
   - Register API middleware in `bootstrap/app.php` (web middleware unchanged)
   - **Verify**: Web middleware continues to work normally

7. **Form Requests**
   - Validation for all endpoints

8. **Testing**
   - Unit tests
   - Integration tests
   - API documentation

---

## Decisions & Considerations

1. **Photo Upload**: ✅ **Multipart/form-data**
   - Better performance and file handling
   - Supports image validation and resizing server-side
   - Max file size: 5MB
   - Supported formats: JPG, PNG, GIF
   - Auto-resize to max 800x800px maintaining aspect ratio

2. **Token Refresh**: ✅ **Refresh Tokens Implemented**
   - Access tokens: 30 days expiration
   - Refresh tokens: 60 days expiration
   - Separate refresh token endpoint for seamless token renewal
   - Old tokens revoked when refreshing

3. **Push Notifications**: ⏸️ **Add Later**
   - Push notification endpoints will be implemented in a future phase
   - Can be integrated without breaking existing API structure

4. **Offline Sync**: ❌ **Not Required**
   - No offline sync or access needed
   - All operations require active internet connection
   - Mobile app should handle connection errors gracefully

5. **Biometric Authentication**: ℹ️ **Mobile App Level**
   - Biometric authentication handled at mobile app level
   - API stores tokens securely, mobile app can use biometrics to unlock stored tokens
   - No API changes needed

6. **Multi-device Login**: ✅ **Allowed**
   - Users can login from multiple devices simultaneously
   - Each device gets separate access and refresh tokens
   - Option to logout from all devices available for security

---

## Next Steps

1. Review and approve this plan
2. Clarify any questions
3. Start implementation in phases:
   - Phase 1: Authentication (email verification, login, password)
   - Phase 2: Profile management
   - Phase 3: Attendance/Timesheet
   - Phase 4: Leave management

