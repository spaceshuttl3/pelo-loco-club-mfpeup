
# Deep Link and Layout Fix Guide

## Issues Fixed

### 1. Password Reset Deep Link Issue
**Problem:** When clicking the password reset link in email, the app opens but shows "pelolocobarbershop://reset-password unmatched route page could not be found"

**Root Cause:** 
- The `app.json` had a duplicate/conflicting scheme definition
- The deep link handler wasn't properly matching the path

**Solution:**
- Removed duplicate scheme definition from `app.json`
- Updated deep link handler in `app/_layout.tsx` to better handle path extraction
- The handler now checks both `url.path` and `url.hostname` to catch the route

### 2. Android Home Screen Layout Issue
**Problem:** On Android, the home screen shows one button per row, and the layout changes based on screen size and text dimensions

**Solution:**
- Fixed card width to always be 50% (2 columns)
- Added fixed font sizes instead of responsive sizing
- Added `minHeight` to cards for consistency
- Added `numberOfLines={2}` and `adjustsFontSizeToFit={false}` to prevent text scaling
- Removed responsive width calculations

## Changes Made

### 1. `app.json`
```json
{
  "scheme": "pelolocobarbershop"
}
```
- Removed duplicate scheme definition
- Kept only one scheme declaration

### 2. `app/_layout.tsx`
```typescript
// Extract path from the URL - handle both path and hostname
const path = url.path || url.hostname || '';
console.log('Extracted path:', path);

// Check if this is a password reset or confirmation link
const isResetPassword = path.includes('reset-password') || path === 'reset-password';
const isConfirm = path.includes('confirm') || path === 'confirm';
```
- Improved path extraction to handle different URL formats
- Added more robust checking for reset-password and confirm routes

### 3. `app/(customer)/index.tsx`
```typescript
// Fixed layout
<TouchableOpacity
  style={{
    width: '50%',  // Always 50% width = 2 columns
    padding: 6,
  }}
>
  <View style={[commonStyles.card, { 
    alignItems: 'center', 
    padding: 20, 
    minHeight: 140  // Fixed minimum height
  }]}>
    <Text 
      style={[commonStyles.text, { 
        textAlign: 'center', 
        fontSize: 14  // Fixed font size
      }]}
      numberOfLines={2}  // Limit to 2 lines
      adjustsFontSizeToFit={false}  // Prevent auto-scaling
    >
      {action.title}
    </Text>
  </View>
</TouchableOpacity>
```
- Fixed card width to 50%
- Added fixed font sizes (24, 28, 14, etc.)
- Added `minHeight: 140` to cards
- Added `numberOfLines={2}` to prevent text overflow
- Added `adjustsFontSizeToFit={false}` to prevent automatic font scaling

## Supabase Configuration

Make sure your Supabase project has the correct redirect URLs configured:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to: `pelolocobarbershop://`
3. Add to **Redirect URLs**:
   ```
   pelolocobarbershop://reset-password
   pelolocobarbershop://confirm
   https://natively.dev/email-confirmed
   ```

## Testing the Password Reset Flow

### On Physical Device (Recommended)
1. Open the app
2. Tap "Forgot Password"
3. Enter your email
4. Check your email inbox (and spam folder)
5. Click the "Reimposta Password" button in the email
6. The app should open automatically to the reset password screen
7. Enter your new password
8. You should be redirected to the login screen

### On iOS Simulator
```bash
# After receiving the email, copy the full URL and run:
xcrun simctl openurl booted "pelolocobarbershop://reset-password?access_token=YOUR_TOKEN&refresh_token=YOUR_TOKEN&type=recovery"
```

### On Android Emulator
```bash
# After receiving the email, copy the full URL and run:
adb shell am start -W -a android.intent.action.VIEW -d "pelolocobarbershop://reset-password?access_token=YOUR_TOKEN&refresh_token=YOUR_TOKEN&type=recovery"
```

## Testing the Layout Fix

### On Android
1. Open the app on different Android devices (or change display size in settings)
2. Go to the home screen
3. Verify that:
   - There are always 2 buttons per row
   - Button sizes remain consistent
   - Text doesn't overflow or scale
   - Layout looks the same regardless of screen size

### On iOS
1. Open the app on different iOS devices
2. Go to Settings → Display & Brightness → Text Size
3. Change the text size
4. Go back to the app
5. Verify that the layout remains consistent

## Troubleshooting

### Deep Link Still Not Working
1. **Rebuild the app** - Changes to `app.json` require a rebuild
   ```bash
   # For iOS
   npx expo run:ios
   
   # For Android
   npx expo run:android
   ```

2. **Check console logs** - Look for these messages:
   ```
   Deep link received: pelolocobarbershop://reset-password?...
   Parsed URL: {...}
   Extracted path: reset-password
   Auth link detected: reset-password
   Token type: recovery
   Has access token: true
   Has refresh token: true
   Setting session from deep link
   Session set successfully
   Navigating to reset password screen
   ```

3. **Verify Supabase redirect URLs** - Make sure they match exactly:
   - `pelolocobarbershop://reset-password` (no trailing slash)

4. **Clear app cache**
   ```bash
   # iOS
   npx expo start -c --ios
   
   # Android
   npx expo start -c --android
   ```

### Layout Still Responsive on Android
1. **Check if changes were applied** - Make sure you saved the file
2. **Restart the dev server**
   ```bash
   npx expo start -c
   ```
3. **Check device display settings**
   - Go to Settings → Display → Display size
   - Try different sizes to verify consistency

### Email Still Going to Spam
This is a separate issue related to email deliverability. See `EMAIL-SPAM-FIX-GUIDE.md` for:
- DNS record configuration (SPF, DKIM, DMARC)
- Domain warming strategies
- Email template best practices

## Important Notes

⚠️ **After making changes to `app.json`:**
- You MUST rebuild the app (not just refresh)
- Changes won't take effect with hot reload
- Use `npx expo run:ios` or `npx expo run:android`

⚠️ **Deep links work differently on different platforms:**
- iOS: Works well on physical devices and simulators
- Android: Works well on physical devices, may need manual triggering on emulators
- Web: Not applicable for this app

⚠️ **Layout consistency:**
- Fixed sizes work better than responsive for consistent UI
- Use `numberOfLines` to prevent text overflow
- Use `adjustsFontSizeToFit={false}` to prevent automatic scaling
- Test on multiple devices with different display settings

---

**Last Updated:** December 2024
