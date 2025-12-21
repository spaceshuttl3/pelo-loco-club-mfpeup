
# Push Notifications - Quick Start

## 🚀 Quick Setup (3 Steps)

### 1. Run SQL Migration
Go to your Supabase SQL Editor and run:
```bash
setup-push-notifications.sql
```

This creates the `custom_notifications` table and adds `push_token` column to users.

### 2. Test on Physical Device
```bash
# Build for your device
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

**Important**: Push notifications only work on physical devices, not simulators!

### 3. Send Test Notification
1. Login as admin
2. Go to "Notifiche" screen
3. Fill in title and message
4. Click "Invia a Tutti gli Utenti"

## ✅ Features Implemented

### Customer Features:
- ✅ Automatic push token registration on login
- ✅ Notification permission request
- ✅ Receive push notifications
- ✅ Tap notification to open app
- ✅ Navigate to relevant screen based on notification type

### Admin Features:
- ✅ Send custom broadcast notifications
- ✅ Send "Spin the Wheel" notifications
- ✅ Quick notification templates
- ✅ See how many users will receive notification
- ✅ Track notification delivery

## 📱 How to Test

### As Customer:
1. Login to the app on a physical device
2. Accept notification permissions when prompted
3. Keep the app open or in background

### As Admin:
1. Login as admin
2. Navigate to "Notifiche" screen
3. Send a test notification
4. Check customer device for notification

## 🔧 Notification Types

The app supports these notification types:
- `custom` - General notifications
- `spin_wheel` - Spin the wheel promotions
- `appointment` - Appointment reminders
- `order` - Order updates
- `product` - Product promotions

## 📊 Database Schema

### users table:
- Added `push_token` column (TEXT) to store Expo push tokens

### custom_notifications table:
```sql
- id (UUID)
- user_id (UUID) - References users
- title (TEXT)
- message (TEXT)
- notification_type (TEXT)
- is_read (BOOLEAN)
- created_at (TIMESTAMPTZ)
- read_at (TIMESTAMPTZ)
```

## 🎯 Next Steps

1. **Run the SQL migration** - This is required!
2. **Build the app** for a physical device
3. **Test notifications** with a customer account
4. **Customize notification templates** in the admin panel

## 💡 Tips

- Push tokens are automatically saved when customers login
- Notifications are sent to all customers with valid push tokens
- The system gracefully handles missing database tables
- Check console logs for debugging information

## 🐛 Common Issues

**"No users with notifications enabled found"**
- Make sure at least one customer has logged in and accepted notifications

**"Database insert failed"**
- Run the `setup-push-notifications.sql` migration
- Check Supabase logs for RLS policy issues

**"Notifications not received"**
- Only works on physical devices
- Check that user accepted notification permissions
- Verify push token is saved in database

## 📚 Files Modified

- `services/notificationService.ts` - Core notification logic
- `app/(admin)/notifications.tsx` - Admin notification interface
- `contexts/AuthContext.tsx` - Auto-register push tokens
- `components/NotificationListener.tsx` - Handle notification taps
- `app/_layout.tsx` - Initialize notification listener
- `setup-push-notifications.sql` - Database migration

## 🎉 You're Ready!

The push notification system is now fully set up. Just run the SQL migration and start testing!
