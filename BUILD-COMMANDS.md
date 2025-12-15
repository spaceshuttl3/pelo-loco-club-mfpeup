
# 🛠️ Pelo Loco Barbershop - Build Commands Reference

Quick reference for all build and deployment commands.

---

## 📦 Installation & Setup

### Initial Setup
```bash
# Install dependencies
npm install

# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure
```

---

## 🏃 Development

### Start Development Server
```bash
# Start with Expo Go
npm run dev

# Start with tunnel (for testing on physical device)
npm run dev:tunnel

# Start on specific platform
npm run ios
npm run android
npm run web
```

### Development Build
```bash
# Create development build for iOS
eas build --profile development --platform ios

# Create development build for Android
eas build --profile development --platform android

# Create development build for both
eas build --profile development --platform all
```

---

## 🏗️ Production Builds

### iOS Production Build
```bash
# Build for App Store
eas build --platform ios --profile production

# Check build status
eas build:list --platform ios

# Download build
eas build:download --platform ios
```

### Android Production Build
```bash
# Build AAB for Google Play (recommended)
eas build --platform android --profile production-aab

# Build APK for direct distribution
eas build --platform android --profile production

# Check build status
eas build:list --platform android

# Download build
eas build:download --platform android
```

### Build Both Platforms
```bash
# Build for both iOS and Android
eas build --platform all --profile production
```

---

## 📤 Submission to App Stores

### Submit to Apple App Store
```bash
# Submit latest iOS build
eas submit --platform ios --profile production

# Submit specific build
eas submit --platform ios --id [BUILD_ID]
```

### Submit to Google Play Store
```bash
# Submit latest Android build
eas submit --platform android --profile production

# Submit specific build
eas submit --platform android --id [BUILD_ID]
```

### Submit to Both Stores
```bash
# Submit to both stores
eas submit --platform all --profile production
```

---

## 🔍 Monitoring & Debugging

### View Build Logs
```bash
# View all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# View build logs
eas build:logs [BUILD_ID]
```

### View Submission Status
```bash
# Check submission status
eas submit:list

# View specific submission
eas submit:view [SUBMISSION_ID]
```

---

## 🔄 Updates & Versioning

### Before Building New Version

1. **Update version in app.json**:
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

2. **Build and submit**:
```bash
# Build new version
eas build --platform all --profile production

# Submit new version
eas submit --platform all --profile production
```

---

## 🧪 Testing

### Preview Builds
```bash
# Create preview build for internal testing
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Install on Device
```bash
# iOS: Use TestFlight or download IPA
# Android: Download APK and install directly
```

---

## 🔐 Credentials Management

### View Credentials
```bash
# View all credentials
eas credentials

# View iOS credentials
eas credentials --platform ios

# View Android credentials
eas credentials --platform android
```

### Reset Credentials
```bash
# Reset iOS credentials
eas credentials --platform ios --clear

# Reset Android credentials
eas credentials --platform android --clear
```

---

## 📊 Project Information

### View Project Info
```bash
# View project configuration
eas project:info

# View build configuration
cat eas.json

# View app configuration
cat app.json
```

---

## 🚨 Troubleshooting

### Clear Cache
```bash
# Clear Expo cache
expo start -c

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Fix Common Issues
```bash
# Update EAS CLI
npm install -g eas-cli@latest

# Update Expo
npx expo install expo@latest

# Check for updates
npx expo-doctor
```

---

## 📱 Platform-Specific Commands

### iOS Specific
```bash
# Generate iOS credentials
eas credentials --platform ios

# Build for simulator
eas build --platform ios --profile development --simulator

# Open in Xcode (after prebuild)
npx expo prebuild -p ios
open ios/*.xcworkspace
```

### Android Specific
```bash
# Generate Android keystore
eas credentials --platform android

# Build APK for testing
eas build --platform android --profile preview

# Open in Android Studio (after prebuild)
npx expo prebuild -p android
open -a "Android Studio" android
```

---

## 🔄 Complete Release Workflow

### Full Release Process
```bash
# 1. Update version in app.json
# 2. Test locally
npm run dev

# 3. Build for production
eas build --platform all --profile production

# 4. Wait for builds to complete (check with)
eas build:list

# 5. Submit to stores
eas submit --platform all --profile production

# 6. Monitor submission status
eas submit:list
```

---

## 📝 Useful Aliases (Optional)

Add these to your `.bashrc` or `.zshrc`:

```bash
# Build aliases
alias build-ios="eas build --platform ios --profile production"
alias build-android="eas build --platform android --profile production-aab"
alias build-all="eas build --platform all --profile production"

# Submit aliases
alias submit-ios="eas submit --platform ios --profile production"
alias submit-android="eas submit --platform android --profile production"
alias submit-all="eas submit --platform all --profile production"

# Development aliases
alias dev="npm run dev"
alias dev-ios="npm run ios"
alias dev-android="npm run android"

# Status aliases
alias builds="eas build:list"
alias submissions="eas submit:list"
```

---

## 🆘 Quick Help

### Get Help
```bash
# General help
eas --help

# Build help
eas build --help

# Submit help
eas submit --help

# Credentials help
eas credentials --help
```

### Documentation Links
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/
- Expo CLI: https://docs.expo.dev/workflow/expo-cli/

---

## ⚡ Quick Start (First Time)

```bash
# 1. Install and setup
npm install
npm install -g eas-cli
eas login

# 2. Configure
eas build:configure

# 3. Build
eas build --platform all --profile production

# 4. Submit
eas submit --platform all --profile production
```

---

## 🎯 Most Common Commands

You'll use these the most:

```bash
# Development
npm run dev

# Production build
eas build --platform all --profile production

# Submit to stores
eas submit --platform all --profile production

# Check status
eas build:list
eas submit:list
```

---

## 📞 Support

If you encounter issues:
1. Check build logs: `eas build:logs [BUILD_ID]`
2. Check Expo status: https://status.expo.dev
3. Search forums: https://forums.expo.dev
4. Contact support: https://expo.dev/support

---

**Remember**: Always test locally before building for production!

Good luck! 🚀
