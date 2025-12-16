
# iOS Launch Issue Fix

## Problem
The app doesn't open on iPhone via Expo Go even after restarting the server.

## Common Causes & Solutions

### 1. Clear Expo Go Cache
On your iPhone:
1. Open Expo Go app
2. Shake the device to open the developer menu
3. Tap "Reload"
4. If that doesn't work, close Expo Go completely and reopen

### 2. Clear Metro Bundler Cache
On your development machine:
```bash
# Stop the current server
# Then run:
npx expo start --clear
```

### 3. Check Network Connection
Ensure your iPhone and development machine are on the same network:
- Both devices should be on the same WiFi network
- Disable VPN on both devices
- Check firewall settings on your development machine

### 4. Use Tunnel Mode
If local network doesn't work:
```bash
npx expo start --tunnel
```

### 5. Update Expo Go
1. Open App Store on your iPhone
2. Search for "Expo Go"
3. Update to the latest version

### 6. Check iOS Compatibility
Ensure your iOS version is compatible:
- Expo SDK 54 requires iOS 13.4 or higher
- Check your iPhone's iOS version in Settings → General → About

### 7. Reinstall Expo Go
If all else fails:
1. Delete Expo Go from your iPhone
2. Reinstall from the App Store
3. Try connecting again

### 8. Check Console for Errors
Look for errors in the terminal where you ran `expo start`:
- Network errors
- Bundle errors
- Module resolution errors

### 9. Verify app.json Configuration
Ensure your `app.json` has correct iOS configuration:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.pelolocobarbershop.app",
      "supportsTablet": true
    }
  }
}
```

### 10. Try Development Build
If Expo Go continues to have issues, create a development build:
```bash
eas build --profile development --platform ios
```

Then install the development build on your iPhone.

## Recommended Steps (In Order)

1. **Clear cache**: `npx expo start --clear`
2. **Restart Expo Go** on iPhone
3. **Check network**: Ensure same WiFi
4. **Try tunnel mode**: `npx expo start --tunnel`
5. **Update Expo Go** from App Store
6. **Check logs** for specific errors

## Still Not Working?

If the app still doesn't launch:
1. Check the terminal output for specific error messages
2. Try running on iOS Simulator instead
3. Create a development build with EAS
4. Check Expo forums for similar issues

## Testing on iOS Simulator (Alternative)

If you have a Mac:
```bash
# Install iOS Simulator
xcode-select --install

# Run on simulator
npx expo start --ios
```

This is more reliable than Expo Go for development.
