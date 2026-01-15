# Frontend Token Expiration Handling Update

**Date:** December 2024  
**Version:** 1.0  
**Status:** Required Implementation

---

## Overview

The backend has been updated to automatically handle token expiration and clear authentication cookies when tokens expire. The frontend must now detect these expiration events and clear Redux state accordingly.

## What Changed

### Backend Changes

1. **Automatic Cookie Clearing**: When a JWT token expires, the backend now automatically clears both `auth_token` and `refresh_token` cookies.

2. **Specific Error Codes**: The backend now returns specific error codes that the frontend can detect:
   - `TOKEN_EXPIRED`: When the access token expires
   - `REFRESH_TOKEN_EXPIRED`: When the refresh token expires

3. **Consistent Error Format**: All token expiration errors follow a consistent format for easy detection.

## New Error Response Format

### Access Token Expiration

When an access token expires, any protected endpoint will return:

```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

**HTTP Status:** `401 Unauthorized`

**Note:** The backend automatically clears the `auth_token` and `refresh_token` cookies when this error occurs.

### Refresh Token Expiration

When attempting to refresh a token and the refresh token has expired:

```json
{
  "error": "Refresh token expired",
  "code": "REFRESH_TOKEN_EXPIRED"
}
```

**HTTP Status:** `401 Unauthorized`

**Note:** The backend automatically clears both cookies when this error occurs.

## Required Frontend Implementation

### 1. Global Error Handler

Implement a global error handler (e.g., in your API client or axios interceptor) that detects token expiration:

```typescript
// Example: API Client Error Handler
async function handleApiError(response: Response) {
  if (response.status === 401) {
    const error = await response.json();
    
    // Check for token expiration
    if (error.code === "TOKEN_EXPIRED" || 
        error.code === "REFRESH_TOKEN_EXPIRED" ||
        error.error?.includes("expired")) {
      
      // Clear Redux state
      dispatch(clearAuthState());
      
      // Clear any local storage if used
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Redirect to login
      window.location.href = '/login';
      
      // Optionally show a message
      // toast.error('Your session has expired. Please log in again.');
      
      return;
    }
  }
  
  // Handle other errors...
}
```

### 2. Redux Action for Clearing Auth State

Ensure you have a Redux action to clear all authentication-related state:

```typescript
// Example: Redux Action
export const clearAuthState = () => (dispatch: Dispatch) => {
  dispatch({
    type: 'CLEAR_AUTH_STATE'
  });
  
  // Clear all auth-related state
  dispatch({
    type: 'RESET_USER'
  });
  
  dispatch({
    type: 'RESET_PERMISSIONS'
  });
  
  // ... clear any other auth-related state
};
```

### 3. Axios Interceptor Example

If using Axios, implement an interceptor:

```typescript
import axios from 'axios';
import { store } from './store'; // Your Redux store
import { clearAuthState } from './actions/authActions';

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const errorData = error.response.data;
      
      // Check for token expiration
      if (errorData.code === "TOKEN_EXPIRED" || 
          errorData.code === "REFRESH_TOKEN_EXPIRED" ||
          errorData.error?.includes("expired")) {
        
        // Clear Redux state
        store.dispatch(clearAuthState());
        
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = '/login';
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 4. Fetch API Wrapper Example

If using Fetch API:

```typescript
async function apiCall(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important for cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  // Handle token expiration
  if (response.status === 401) {
    const error = await response.json();
    
    if (error.code === "TOKEN_EXPIRED" || 
        error.code === "REFRESH_TOKEN_EXPIRED" ||
        error.error?.includes("expired")) {
      
      // Clear state and redirect
      clearAuthState();
      window.location.href = '/login';
      
      throw new Error('Session expired');
    }
  }
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}
```

## Token Expiration Detection

The frontend should check for token expiration in the following scenarios:

1. **On any API call** that returns `401 Unauthorized`
2. **Check the error code** in the response:
   - `code === "TOKEN_EXPIRED"`
   - `code === "REFRESH_TOKEN_EXPIRED"`
   - `error.includes("expired")` (fallback check)

## Important Notes

1. **Cookies are automatically cleared by the backend** - You don't need to manually clear cookies on the frontend.

2. **No need to check token expiration proactively** - The backend handles this. Just respond to the error codes.

3. **Refresh token flow** - If the access token expires but the refresh token is still valid, the frontend can attempt to refresh. However, if both are expired, the user must log in again.

4. **Consistent error format** - All token expiration errors follow the same format, making detection straightforward.

## Testing

To test token expiration handling:

1. Set token expiration to a short time (e.g., 100 seconds) in your environment variables:
   ```
   SERVER_TOKEN_EXPIRETIME=100
   SERVER_REFRESH_TOKEN_EXPIRETIME=100
   ```

2. Log in and wait for the token to expire.

3. Make any API call after expiration.

4. Verify that:
   - The frontend detects the `TOKEN_EXPIRED` error code
   - Redux state is cleared
   - User is redirected to login page
   - No errors are thrown in the console

## Migration Checklist

- [ ] Implement global error handler for 401 responses
- [ ] Add detection for `TOKEN_EXPIRED` and `REFRESH_TOKEN_EXPIRED` error codes
- [ ] Create/update Redux action to clear auth state
- [ ] Clear all authentication-related state (user, permissions, etc.)
- [ ] Clear local storage/session storage if used
- [ ] Implement redirect to login page
- [ ] Test token expiration flow
- [ ] Update any existing token expiration handling code

## Support

If you encounter any issues implementing this update, please contact the backend team.

---

**Backend Team Contact:** [Your contact information]

