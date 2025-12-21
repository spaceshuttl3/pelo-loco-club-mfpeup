
# Firebase Cloud Messaging Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in your Pelo Loco Club app.

## ✅ What's Already Done

The code has been updated with:
- Firebase dependencies installed (`@react-native-firebase/app` and `@react-native-firebase/messaging`)
- Firebase notification service created
- Integration with existing notification system
- Auto-initialization on user login
- Dashboard layouts fixed to 2 buttons per row with responsive sizing

## 📋 Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select your existing project
3. Enter project name: "Pelo Loco Club" (or your preferred name)
4. Follow the setup wizard

### 2. Add Android App to Firebase

1. In Firebase Console, click the Android icon to add an Android app
2. Enter your Android package name: `com.pelolocobarbershop.app`
3. Download the `google-services.json` file
4. Place it in the **root directory** of your project (same level as `app.json`)

### 3. Add iOS App to Firebase

1. In Firebase Console, click the iOS icon to add an iOS app
2. Enter your iOS bundle ID: `com.pelolocobarbershop.app`
3. Download the `GoogleService-Info.plist` file
4. Place it in the **root directory** of your project (same level as `app.json`)

### 4. Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** → **Cloud Messaging**
2. Note your **Server Key** (you'll need this to send notifications from your backend)
3. For iOS: Upload your APNs certificate or key
   - Go to Apple Developer Portal
   - Create an APNs key or certificate
   - Upload it to Firebase

### 5. Update Database

Run the SQL migration to add the FCM token column:

```sql
-- Run this in your Supabase SQL editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token);
```

Or use the provided file:
```bash
# In Supabase dashboard, go to SQL Editor and run the contents of:
add-fcm-token-column.sql
```

### 6. Build Your App

After adding the Firebase configuration files, rebuild your app:

#### For Android:
```bash
# Development build
npx expo run:android

# Production build with EAS
eas build --platform android
```

#### For iOS:
```bash
# Development build
npx expo run:ios

# Production build with EAS
eas build --platform ios
```

## 🔔 How It Works

### Automatic Setup
When a user logs in, the app automatically:
1. Requests notification permissions (iOS only, Android is automatic)
2. Gets the FCM token from Firebase
3. Saves the token to the user's profile in Supabase
4. Listens for incoming notifications

### Notification Types
The app handles these notification types:
- `spin_wheel` - Opens fidelity/rewards screen
- `appointment` - Opens bookings screen
- `order` - Opens order history
- `product` - Opens products screen

### Sending Notifications

#### From Admin Panel
Use the existing notifications screen at `/(admin)/notifications` to send:
- Broadcast notifications to all users
- Targeted notifications to specific users
- Promotional notifications

#### From Backend/Server
Use the Firebase Admin SDK or HTTP API:

```javascript
// Example using Firebase Admin SDK (Node.js)
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send to a specific user
await admin.messaging().send({
  token: userFcmToken,
  notification: {
    title: 'New Appointment',
    body: 'Your appointment is confirmed!'
  },
  data: {
    type: 'appointment'
  }
});

// Send to all users (topic)
await admin.messaging().send({
  topic: 'all_users',
  notification: {
    title: 'Special Offer',
    body: '20% off all services today!'
  }
});
```

## 🎨 Dashboard Layout Fixed

Both customer and admin dashboards now have:
- **2 buttons per row** layout
- **Responsive sizing** that adapts to screen width
- **Smaller fonts and padding** to prevent overflow
- **Consistent spacing** across all Android devices

The layout uses:
```javascript
const cardWidth = (width - 32 - cardPadding * 2) / 2;
```

This ensures cards fit perfectly on any screen size.

## 🧪 Testing Notifications

### Test on Physical Device
1. Install the app on a physical device (notifications don't work on simulators)
2. Log in to the app
3. Check the console logs for the FCM token
4. Use Firebase Console to send a test notification:
   - Go to **Cloud Messaging** → **Send your first message**
   - Enter title and body
   - Select your app
   - Send test message to the FCM token from logs

### Test Different Scenarios
- **Foreground**: App is open and active
- **Background**: App is in background
- **Killed**: App is completely closed
- **Notification tap**: Tap notification to open app

## 📱 Platform-Specific Notes

### Android
- Notifications work automatically (no permission needed)
- Uses notification channels (configured in code)
- Shows notifications in system tray

### iOS
- Requires explicit permission request
- Needs APNs certificate/key in Firebase
- Shows notifications in Notification Center

## 🔧 Troubleshooting

### Notifications Not Received
1. Check if FCM token is saved in database
2. Verify `google-services.json` and `GoogleService-Info.plist` are in root directory
3. Ensure app is rebuilt after adding Firebase files
4. Check Firebase Console for delivery status

### iOS Notifications Not Working
1. Verify APNs certificate/key is uploaded to Firebase
2. Check if notification permissions are granted
3. Test on physical device (not simulator)

### Android Notifications Not Working
1. Verify `google-services.json` is correct
2. Check if app package name matches Firebase
3. Rebuild the app

## 📚 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Expo with Firebase](https://docs.expo.dev/guides/using-firebase/)

## 🎉 You're All Set!

Your app now has:
- ✅ Clean 2-column dashboard layout
- ✅ Firebase Cloud Messaging integration
- ✅ Automatic notification setup on login
- ✅ Support for foreground, background, and killed states
- ✅ Notification routing to appropriate screens

Test thoroughly on both iOS and Android devices!
