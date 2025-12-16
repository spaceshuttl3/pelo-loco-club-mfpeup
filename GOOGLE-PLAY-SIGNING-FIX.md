
# Google Play Store Signing Key Fix

## Problem
Your Android App Bundle is signed with the wrong key. Google Play expects:
- **Expected SHA1**: `BD:22:D0:A9:68:F3:1D:A1:A5:C0:88:F4:D3:68:E4:10:98:C9:DE:70`
- **Current SHA1**: `7B:56:B1:F8:CD:12:74:E2:46:B6:7B:DD:33:BB:91:81:92:00:C7:8F`

## Solution Options

### Option 1: Reset Upload Key in Google Play Console (RECOMMENDED)
Since you're using Google Play App Signing, you can reset the upload key:

1. **Go to Google Play Console**
   - Navigate to your app
   - Go to "Setup" → "App signing"

2. **Request Upload Key Reset**
   - Click "Request upload key reset"
   - Follow the instructions to verify your identity
   - Google will send you instructions via email

3. **Generate New Upload Key**
   After Google approves your request, generate a new upload key:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

4. **Export Certificate**
   ```bash
   keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_certificate.pem
   ```

5. **Upload to Google Play Console**
   - Upload the `upload_certificate.pem` file to Google Play Console
   - Wait for Google to process it (usually takes a few minutes)

6. **Configure EAS Build**
   Create a `credentials.json` file:
   ```json
   {
     "android": {
       "keystore": {
         "keystorePath": "./upload-keystore.jks",
         "keystorePassword": "YOUR_KEYSTORE_PASSWORD",
         "keyAlias": "upload",
         "keyPassword": "YOUR_KEY_PASSWORD"
       }
     }
   }
   ```

7. **Build New AAB**
   ```bash
   eas build --platform android --profile production-aab
   ```

### Option 2: Use the Original Keystore
If you have access to the original keystore that matches the expected SHA1:

1. **Locate the Original Keystore**
   Find the keystore file that was used for the first upload

2. **Configure EAS Build**
   ```bash
   eas credentials
   ```
   - Select Android
   - Select "Set up a new keystore"
   - Provide the path to your original keystore
   - Enter the keystore password and key alias

3. **Build New AAB**
   ```bash
   eas build --platform android --profile production-aab
   ```

## Important Notes

- **DO NOT** lose your new upload key once generated
- Store the keystore file and passwords securely (use a password manager)
- The app signing key (managed by Google) is different from the upload key
- Google Play App Signing protects you from losing access to your app if you lose your upload key

## Verification

After building with the correct key, verify the SHA1 fingerprint:

```bash
keytool -list -v -keystore upload-keystore.jks -alias upload
```

The SHA1 should match: `BD:22:D0:A9:68:F3:1D:A1:A5:C0:88:F4:D3:68:E4:10:98:C9:DE:70`

## Next Steps

1. Follow Option 1 (recommended) to reset your upload key
2. Once you have the new keystore configured, build a new AAB
3. Upload the new AAB to Google Play Console
4. The upload should succeed with the correct signing key

## Support

If you encounter issues:
- Check Google Play Console help center for upload key reset
- Ensure you're using the latest version of EAS CLI: `npm install -g eas-cli`
- Contact Google Play support if the key reset request is denied
