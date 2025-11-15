
# Password Reset Deep Link Fix

## Issue
The password reset link was redirecting to `https://natively.dev/email-confirmed?type=recovery` which doesn't load properly in the app.

## Solution
Updated the password reset flow to use the app's custom deep link scheme.

## Changes Made

### 1. Updated `app/auth/forgot-password.tsx`
Changed the redirect URL from:
```typescript
redirectTo: 'https://natively.dev/reset-password'
```

To:
```typescript
redirectTo: 'pelolococlub://reset-password'
```

This uses the app's custom scheme defined in `app.json`.

### 2. Deep Link Handling
The app already has deep link handling in `app/_layout.tsx` that:
- Listens for deep links with the `pelolococlub://` scheme
- Extracts the access_token and refresh_token from the URL
- Sets the Supabase session automatically
- Navigates to the reset-password screen

## Supabase Configuration Required

You need to add the custom scheme to your Supabase project's allowed redirect URLs:

1. Go to your Supabase Dashboard
2. Navigate to Authentication → URL Configuration
3. Add the following to "Redirect URLs":
   ```
   pelolococlub://reset-password
   ```

## How It Works

1. User enters email on forgot-password screen
2. Supabase sends email with link like: `pelolococlub://reset-password?access_token=...&refresh_token=...`
3. User clicks link in email
4. Mobile OS opens the app with the deep link
5. App's deep link handler extracts tokens and sets session
6. User is automatically navigated to reset-password screen
7. User enters new password
8. Password is updated and user is redirected to login

## Testing

To test the password reset flow:

1. Run the app on a physical device or simulator
2. Go to the forgot password screen
3. Enter a valid email address
4. Check your email for the reset link
5. Click the link in the email
6. The app should open automatically to the reset password screen
7. Enter and confirm your new password
8. You should be redirected to the login screen

## Notes

- Deep links work best on physical devices
- On iOS simulator, you may need to manually trigger the deep link using `xcrun simctl openurl booted "pelolococlub://reset-password?access_token=..."`
- On Android emulator, you can use `adb shell am start -W -a android.intent.action.VIEW -d "pelolococlub://reset-password?access_token=..."`
