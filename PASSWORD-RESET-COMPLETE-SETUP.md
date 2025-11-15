
# Password Reset Setup Guide for Pelo Loco Club

## Overview
The password reset functionality has been fully implemented with deep linking support. This guide explains the setup and configuration.

## Configuration

### 1. Supabase Configuration
The password reset redirect URL is configured in the app to use the custom URL scheme:
```
pelolococlub://reset-password
```

### 2. Supabase Dashboard Setup
You need to configure the redirect URL in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following to **Redirect URLs**:
   ```
   pelolococlub://reset-password
   ```
4. Save the changes

### 3. App Configuration
The app.json file is already configured with the custom URL scheme:
```json
{
  "scheme": "pelolococlub",
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "pelolococlub"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

### 4. Supabase Client Configuration
The supabase client in `lib/supabase.ts` is configured with:
```typescript
{
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Important for password reset
  }
}
```

## How It Works

### User Flow:
1. User clicks "Forgot Password" on login screen
2. User enters their email address
3. App calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'pelolococlub://reset-password' })`
4. Supabase sends an email with a reset link
5. User clicks the link in their email
6. The link opens the app at the reset-password screen
7. User enters their new password
8. Password is updated via `supabase.auth.updateUser({ password })`
9. User is redirected to login screen

### Technical Details:
- The reset link contains a session token that is automatically detected by the Supabase client
- The `detectSessionInUrl: true` option enables automatic session detection
- The reset-password screen validates the session before allowing password update
- If the session is invalid or expired, the user is redirected to request a new reset link

## Testing

### Test the Password Reset Flow:
1. Run the app: `npm run dev`
2. Navigate to the login screen
3. Click "Forgot Password"
4. Enter a valid user email
5. Check the email inbox for the reset link
6. Click the reset link (it should open the app)
7. Enter a new password
8. Confirm the password update
9. Login with the new password

## Troubleshooting

### Issue: Reset link opens in browser instead of app
**Solution**: Make sure the app is installed on the device and the URL scheme is properly configured in app.json

### Issue: "Link expired or invalid" error
**Solution**: Reset links expire after 24 hours. Request a new reset link.

### Issue: Email not received
**Solution**: 
- Check spam folder
- Verify the email address is correct
- Check Supabase email settings in the dashboard
- Ensure email templates are properly configured

### Issue: Deep link not working on Android
**Solution**: 
- Rebuild the app after changing app.json
- Verify the intent filters are properly configured
- Test with `adb shell am start -a android.intent.action.VIEW -d "pelolococlub://reset-password"`

## Security Notes

- Reset links expire after 24 hours
- Each reset link can only be used once
- The session is validated before allowing password update
- Passwords must be at least 6 characters long
- All password reset attempts are logged in Supabase

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo Deep Linking Guide](https://docs.expo.dev/guides/deep-linking/)
- [React Native Linking API](https://reactnative.dev/docs/linking)
