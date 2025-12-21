
# Supabase Redirect URL Configuration Guide

## Issue
After editing the Supabase configuration to use custom redirect URLs, password reset and email confirmation are not working.

## Solution

### 1. Supabase Dashboard Configuration

Go to your Supabase project dashboard:
1. Navigate to **Authentication** → **URL Configuration**
2. Set the following URLs:

**Site URL:**
```
pelolocobarbershop://
```

**Redirect URLs (Add both):**
```
pelolocobarbershop://reset-password
pelolocobarbershop://confirm
```

### 2. Important Notes

- The scheme `pelolocobarbershop://` must match the `scheme` field in your `app.json`
- Both iOS and Android will use this custom URL scheme
- The app is configured to handle both password reset and email confirmation through deep linking

### 3. Testing

**Password Reset:**
1. Go to the forgot password screen
2. Enter your email
3. Check your email for the reset link
4. Click the link - it should open the app and navigate to the reset password screen
5. Enter your new password

**Email Confirmation:**
1. Sign up with a new account
2. Check your email for the confirmation link
3. Click the link - it should open the app and confirm your email
4. You can now log in

### 4. Troubleshooting

If deep linking is not working:

**iOS:**
- Make sure the app is installed on your device
- The custom URL scheme is automatically registered when you build the app

**Android:**
- Make sure the app is installed on your device
- The intent filters in `app.json` handle the deep linking

**Both Platforms:**
- Check the console logs for "Deep link received:" messages
- Verify the redirect URLs in Supabase match exactly (including the scheme)
- Make sure you're using the correct scheme: `pelolocobarbershop://` (not `pelolococlub://`)

### 5. Code Changes Made

1. **app.json** - Updated to use consistent `pelolocobarbershop` scheme
2. **app/_layout.tsx** - Enhanced deep link handling for both reset-password and confirm paths
3. **app/auth/forgot-password.tsx** - Uses correct redirect URL
4. **app/auth/reset-password.tsx** - Handles password reset flow

### 6. Verification

After making these changes:
1. Rebuild your app (if testing on physical device)
2. Test password reset flow
3. Test email confirmation flow
4. Check console logs for any errors

The deep linking should now work correctly for both password reset and email confirmation!
