
# Password Reset Configuration Guide

## Issue
The password reset link was redirecting to `localhost` which doesn't work in the mobile app.

## Solution
We've configured the app to use deep links for password reset. Follow these steps to complete the setup:

## 1. Configure Supabase Redirect URLs

Go to your Supabase Dashboard:
1. Navigate to **Authentication** → **URL Configuration**
2. Add the following redirect URLs:
   - `pelolococlub://reset-password` (for mobile app)
   - `https://natively.dev/reset-password` (for web fallback)

## 2. How It Works

### Password Reset Flow:
1. User enters email in "Forgot Password" screen
2. Supabase sends email with reset link containing `access_token` and `refresh_token`
3. User clicks link in email
4. App opens via deep link: `pelolococlub://reset-password?access_token=...&refresh_token=...`
5. App automatically sets the session using the tokens
6. User is redirected to the reset password screen
7. User enters new password
8. Password is updated via `supabase.auth.updateUser()`

### Deep Link Handling:
- The `app/_layout.tsx` file listens for deep links
- When a reset password link is detected, it extracts the tokens
- The session is set automatically using `supabase.auth.setSession()`
- The user is then shown the reset password screen

## 3. Testing

### Test on iOS:
```bash
xcrun simctl openurl booted "pelolococlub://reset-password?access_token=test&refresh_token=test"
```

### Test on Android:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "pelolococlub://reset-password?access_token=test&refresh_token=test"
```

## 4. Files Modified

- `app/auth/forgot-password.tsx` - Updated redirect URL to use deep link
- `app/auth/reset-password.tsx` - Handles password update
- `app/_layout.tsx` - Added deep link listener and session handling
- `app.json` - Already configured with scheme: "pelolococlub"

## 5. Troubleshooting

### If reset link still goes to localhost:
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Ensure `pelolococlub://reset-password` is in the redirect URLs list
3. Clear app cache and reinstall

### If deep link doesn't open app:
1. Verify `app.json` has `"scheme": "pelolococlub"`
2. Rebuild the app: `expo prebuild --clean`
3. Test with the commands above

### If session is not set:
1. Check console logs for "Deep link received" and "Session set successfully"
2. Verify the URL contains `access_token` and `refresh_token` parameters
3. Check Supabase logs for any authentication errors

## 6. Additional Notes

- The deep link scheme `pelolococlub://` is already configured in `app.json`
- The app will automatically handle the session when the reset link is clicked
- Users must have a valid email in the system to receive reset emails
- Reset tokens expire after a certain time (configured in Supabase)
