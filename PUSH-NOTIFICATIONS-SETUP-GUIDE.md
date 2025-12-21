
# Push Notifications Setup Guide

## Overview
This guide will help you set up push notifications for the Pelo Loco Club app using Expo's push notification service.

## Prerequisites
- Expo account
- EAS CLI installed (`npm install -g eas-cli`)
- Physical device for testing (push notifications don't work on simulators)

## Step 1: Database Setup

Run the following SQL in your Supabase SQL Editor to create the necessary tables:

```sql
-- Run the setup-push-notifications.sql file
-- This will:
-- 1. Add push_token column to users table
-- 2. Create custom_notifications table
-- 3. Set up RLS policies
-- 4. Create indexes for performance
```

You can find the complete SQL in the `setup-push-notifications.sql` file.

## Step 2: Configure Expo Project

The app is already configured with the correct Expo project ID in `app.json`:

```json
{
  "extra": {
    "eas": {
      "projectId": "f58c39ed-204a-46e2-bc3d-9a4c486a3a4a"
    }
  }
}
```

## Step 3: Test Push Notifications

### On a Physical Device:

1. **Build and install the app** on a physical device:
   ```bash
   # For Android
   eas build --profile development --platform android
   
   # For iOS
   eas build --profile development --platform ios
   ```

2. **Login as a customer** in the app
   - The app will automatically request notification permissions
   - Accept the notification permission request
   - The push token will be saved to the user's profile

3. **Login as admin** and go to the Notifications screen
   - Send a test notification
   - The notification should appear on the customer's device

## Step 4: How It Works

### Customer Side:
1. When a customer logs in, the app requests notification permissions
2. If granted, an Expo push token is generated
3. The token is saved to the user's profile in Supabase (`users.push_token`)

### Admin Side:
1. Admin can send notifications from the Notifications screen
2. The app fetches all users with push tokens
3. Notifications are sent via Expo's push notification service
4. Notifications are also saved to the database for in-app viewing

### Notification Types:
- **Custom Broadcast**: Send any message to all users
- **Spin Wheel**: Invite users to spin the wheel for prizes
- **Quick Templates**: Pre-made notification templates for common scenarios

## Step 5: Testing Checklist

- [ ] Database tables created (run `setup-push-notifications.sql`)
- [ ] App built and installed on physical device
- [ ] Customer can login and accept notification permissions
- [ ] Push token is saved to database (check `users.push_token` column)
- [ ] Admin can send notifications
- [ ] Customer receives notifications on device
- [ ] Tapping notification opens the app

## Troubleshooting

### Notifications not received:
1. **Check permissions**: Make sure the user accepted notification permissions
2. **Check push token**: Verify the user has a `push_token` in the database
3. **Check device**: Push notifications only work on physical devices, not simulators
4. **Check Expo status**: Visit https://status.expo.dev/ to check if Expo services are operational

### Push token not saved:
1. Check the console logs for errors
2. Verify the `users` table has a `push_token` column
3. Make sure RLS policies allow updating the user's own profile

### Database errors:
1. Run the `setup-push-notifications.sql` file in Supabase SQL Editor
2. Check that all tables and columns exist
3. Verify RLS policies are correctly set up

## Production Deployment

For production, you'll need to:

1. **Build production apps**:
   ```bash
   # Android
   eas build --profile production --platform android
   
   # iOS
   eas build --profile production --platform ios
   ```

2. **Configure FCM (Android)**:
   - Add `google-services.json` to your project
   - Configure in `app.json`

3. **Configure APNs (iOS)**:
   - Set up Apple Push Notification service
   - Configure certificates in Expo

## Additional Features

### Scheduled Notifications:
The app includes functions for scheduling local notifications:
- `scheduleLocalNotification()` - Schedule a notification for later
- `cancelScheduledNotification()` - Cancel a scheduled notification
- `getAllScheduledNotifications()` - Get all scheduled notifications

### Notification Listeners:
The app includes a `NotificationListener` component that:
- Listens for incoming notifications
- Handles notification taps
- Routes users to the appropriate screen based on notification type

## Support

For more information:
- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
