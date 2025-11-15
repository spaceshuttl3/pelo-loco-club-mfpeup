
# Password Reset and Validation Fixes

## Issues Fixed

### 1. Password Reset Redirect URL Issue
**Problem**: The reset password link was redirecting to `localhost` which doesn't load in the mobile app.

**Solution**: 
- Changed the `redirectTo` parameter in `forgot-password.tsx` to use `https://natively.dev/email-confirmed?type=recovery`
- This URL is handled by Natively's infrastructure and will properly redirect back to the app
- Updated `lib/supabase.ts` to enable `detectSessionInUrl: true` for proper session handling
- The deep link handler in `app/_layout.tsx` already handles the session tokens

**Configuration Required in Supabase Dashboard**:
1. Go to Authentication > URL Configuration
2. Add the following to **Redirect URLs**:
   - `https://natively.dev/email-confirmed`
   - `pelolococlub://reset-password` (for direct deep linking)
3. Save the configuration

### 2. Duplicate Email/Phone Check Not Working
**Problem**: When registering with an existing email or phone number, no error message was shown.

**Solution**:
- The `check_user_duplicates` RPC function already exists in the database
- Enhanced the `checkDuplicates` function in `signup.tsx` with better logging
- Added proper error handling to show specific messages for email vs phone duplicates
- The function now correctly returns `{ duplicate: true, field: 'email' }` or `{ duplicate: true, field: 'phone' }`

**How it works**:
```typescript
// The RPC function returns:
{
  email_exists: boolean,
  phone_exists: boolean
}

// The app checks this and shows appropriate error messages
```

### 3. Birthday Section Not Showing Future Birthdays
**Problem**: The birthdays section was not displaying all future birthdays correctly.

**Solution**:
- Updated the birthday calculation logic to properly handle year transitions
- Changed the filter to show ALL future birthdays (not just those within 30 days)
- Added better logging to debug the birthday calculation
- Improved the UI to show:
  - "OGGI" badge for today's birthdays
  - "PRESTO" badge for birthdays within 7 days
  - Days until birthday for all others

**How it works**:
```typescript
// Calculate days until next birthday
const today = new Date();
const thisYearBirthday = new Date(today.getFullYear(), birthMonth, birthDay);

// If birthday has passed this year, use next year
if (thisYearBirthday < today) {
  thisYearBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
}

const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

// Show all birthdays where daysUntil >= 0
```

## Testing Instructions

### Test Password Reset:
1. Go to the login screen
2. Tap "Forgot Password?"
3. Enter your email address
4. Check your email for the reset link
5. Click the link in the email
6. You should be redirected to the app's reset password screen
7. Enter your new password
8. Confirm the password
9. You should be redirected to the login screen

### Test Duplicate Email/Phone:
1. Try to register with an email that already exists
2. You should see: "Questa email è già registrata. Prova ad accedere o usa un'altra email."
3. Try to register with a phone number that already exists
4. You should see: "Questo numero di telefono è già registrato. Prova ad accedere o usa un altro numero."

### Test Birthday Display:
1. Log in as admin
2. Go to the Birthdays section
3. You should see ALL future birthdays sorted by days until birthday
4. Birthdays today should have a "OGGI" badge
5. Birthdays within 7 days should have a "PRESTO" badge
6. All birthdays should show "Tra X giorni" (In X days)

## Important Notes

1. **Supabase Configuration**: Make sure to add the redirect URLs in the Supabase dashboard as mentioned above.

2. **Email Templates**: You can customize the password reset email template in Supabase:
   - Go to Authentication > Email Templates
   - Select "Reset Password"
   - The template should use `{{ .ConfirmationURL }}` which will include the redirect URL

3. **Deep Linking**: The app uses the scheme `pelolococlub://` for deep linking. This is already configured in `app.json`.

4. **Session Handling**: The app now properly handles session tokens from password reset links through the deep link handler in `app/_layout.tsx`.

## Files Modified

1. `app/auth/forgot-password.tsx` - Updated redirect URL
2. `app/auth/signup.tsx` - Enhanced duplicate checking with better logging
3. `app/(admin)/birthdays.tsx` - Fixed birthday calculation and display
4. `lib/supabase.ts` - Enabled session detection from URL

## Database Functions Used

- `check_user_duplicates(p_email text, p_phone text)` - Returns whether email or phone already exists
  - This is a SECURITY DEFINER function that bypasses RLS
  - Returns: `{ email_exists: boolean, phone_exists: boolean }`
