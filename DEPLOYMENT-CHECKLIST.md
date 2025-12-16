
# Deployment Checklist for Pelo Loco Barbershop

## Pre-Deployment Checks

### ✅ Code Quality
- [x] All icons display correctly on both iOS and Android
- [x] Booking flow works correctly (service → barber → date/time → payment)
- [x] All console.log statements are in place for debugging
- [x] No critical errors in the code
- [x] Responsive design works on different screen sizes

### ✅ App Configuration
- [x] App name: "Pelo Loco Barbershop"
- [x] Bundle ID (iOS): com.pelolocobarbershop.app
- [x] Package name (Android): com.pelolocobarbershop.app
- [x] Version updated: 3.0.1
- [x] Build numbers incremented

### ✅ Assets
- [x] App icon configured
- [x] Splash screen configured
- [x] All images optimized

## iOS Deployment

### 1. Test on Physical Device
```bash
# Clear cache and restart
npx expo start --clear

# Or use tunnel mode
npx expo start --tunnel
```

### 2. Build for TestFlight
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios --profile production
```

### 3. Submit to App Store
```bash
eas submit --platform ios
```

### 4. App Store Connect
- Fill in app description
- Add screenshots
- Set pricing (free)
- Submit for review

## Android Deployment

### 1. Fix Signing Key Issue

**IMPORTANT**: You need to reset your upload key in Google Play Console first!

Follow the steps in `GOOGLE-PLAY-SIGNING-FIX.md`:

1. Go to Google Play Console → Setup → App signing
2. Request upload key reset
3. Generate new upload key:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
4. Export certificate:
   ```bash
   keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_certificate.pem
   ```
5. Upload certificate to Google Play Console

### 2. Configure EAS Credentials
```bash
eas credentials
```
- Select Android
- Set up keystore with your new upload key

### 3. Build AAB
```bash
# Build production AAB
eas build --platform android --profile production-aab
```

### 4. Verify Signing
After build completes, verify the SHA1:
```bash
keytool -list -v -keystore upload-keystore.jks -alias upload
```

Should match: `BD:22:D0:A9:68:F3:1D:A1:A5:C0:88:F4:D3:68:E4:10:98:C9:DE:70`

### 5. Upload to Google Play
1. Download the AAB from EAS
2. Go to Google Play Console
3. Create new release in Production track
4. Upload the AAB
5. Fill in release notes
6. Submit for review

## Post-Deployment

### Testing
- [ ] Test booking flow on production app
- [ ] Test product purchases
- [ ] Test admin features
- [ ] Test push notifications
- [ ] Test on multiple devices

### Monitoring
- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Monitor server logs
- [ ] Check Supabase usage

### Marketing
- [ ] Announce launch to customers
- [ ] Share on social media
- [ ] Create promotional materials
- [ ] Set up app store optimization (ASO)

## Troubleshooting

### iOS Issues
- See `IOS-LAUNCH-FIX.md` for common iOS problems
- Check Apple Developer account status
- Verify certificates and provisioning profiles

### Android Issues
- See `GOOGLE-PLAY-SIGNING-FIX.md` for signing key issues
- Check Google Play Console for specific errors
- Verify all required permissions are declared

### Build Issues
```bash
# Clear EAS cache
eas build --clear-cache

# Check build logs
eas build:list
eas build:view [BUILD_ID]
```

## Support Contacts

- **Expo Support**: https://expo.dev/support
- **Apple Developer**: https://developer.apple.com/support/
- **Google Play Support**: https://support.google.com/googleplay/android-developer

## Notes

- Keep your keystore files secure and backed up
- Store passwords in a secure password manager
- Document any custom configurations
- Keep track of version numbers and build numbers
- Test thoroughly before each release
