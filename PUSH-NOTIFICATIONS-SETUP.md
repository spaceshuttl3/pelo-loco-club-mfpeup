
# Push Notifications Setup Guide

This guide explains how to set up and use push notifications in the Pelo Loco Club app.

## Overview

The app now supports push notifications using Expo's Push Notification Service. Notifications are sent to users for:

- Custom broadcast messages from admin
- Spin the wheel promotions
- Birthday coupons (automated)
- Appointment reminders (automated)
- Inactivity reminders (automated)

## Database Setup

### 1. Run the Migration

Execute the SQL migration in your Supabase SQL Editor:

```bash
# Run this file in Supabase SQL Editor
add-push-notifications.sql
```

This will:
- Add `push_token` column to the `users` table
- Create `custom_notifications` table for notification history
- Set up Row Level Security (RLS) policies
- Create necessary indexes

### 2. Verify Tables

After running the migration, verify that:
- The `users` table has a `push_token` column
- The `custom_notifications` table exists with proper RLS policies

## App Configuration

### 1. Expo Project ID

Update the project ID in `services/notificationService.ts`:

```typescript
const projectId = 'YOUR_EXPO_PROJECT_ID'; // Replace with your actual project ID
```

You can find your project ID in:
- `app.json` under `extra.eas.projectId`
- Or in your Expo dashboard

### 2. Build Configuration

For production builds, you'll need to configure:

#### iOS
- Apple Push Notification service (APNs) certificate
- Add to your `eas.json` build configuration

#### Android
- Firebase Cloud Messaging (FCM) server key
- Add `google-services.json` to your project root
- Already configured in `app.json`

## How It Works

### 1. User Registration

When a customer logs in:
1. The app requests notification permissions
2. If granted, it gets an Expo Push Token
3. The token is saved to the user's profile in Supabase
4. The user can now receive push notifications

### 2. Sending Notifications (Admin)

Admins can send notifications from the Notifications screen:

1. **Custom Broadcast**: Send a custom message to all users
2. **Spin the Wheel**: Send a promotion to spin the wheel
3. **Quick Templates**: Use pre-made notification templates

### 3. Notification Flow

```
Admin sends notification
    ↓
Saved to custom_notifications table
    ↓
Push tokens retrieved from users table
    ↓
Sent via Expo Push Notification Service
    ↓
Users receive notification on their devices
```

### 4. Notification Handling

When a user taps a notification:
- The app opens to the relevant screen based on notification type
- `spin_wheel` → Fidelity screen
- `appointment` → Bookings screen
- `order` → Order history screen
- `product` → Products screen

## Testing Notifications

### 1. Test on Physical Device

Push notifications only work on physical devices, not simulators/emulators.

### 2. Test Flow

1. Log in as a customer on a physical device
2. Grant notification permissions when prompted
3. Log in as admin on another device or web
4. Go to Notifications screen
5. Send a test notification
6. Check if the customer receives it

### 3. Debugging

Check the console logs for:
- `Expo Push Token: ...` - Token was successfully generated
- `Push token saved successfully` - Token was saved to database
- `Push notification sent: ...` - Notification was sent
- `Notification received: ...` - Notification was received

## Automated Notifications (Future)

To implement automated notifications, you can:

### 1. Birthday Notifications

Create a Supabase Edge Function that runs daily:

```typescript
// Check for birthdays today
// Send notification to users
// Create coupon for birthday users
```

### 2. Inactivity Reminders

Create a Supabase Edge Function that runs daily:

```typescript
// Check users who haven't booked in 30 days
// Send reminder notification with coupon
```

### 3. Appointment Reminders

Create a Supabase Edge Function that runs hourly:

```typescript
// Check appointments in next 24 hours
// Send reminder notification to users
```

## Troubleshooting

### Notifications Not Received

1. **Check permissions**: Ensure user granted notification permissions
2. **Check token**: Verify `push_token` is saved in users table
3. **Check device**: Use a physical device, not simulator
4. **Check logs**: Look for errors in console

### Token Not Saved

1. **Check RLS policies**: Ensure user can update their own profile
2. **Check network**: Ensure device has internet connection
3. **Check logs**: Look for errors in `savePushToken` function

### Notifications Delayed

- Expo Push Notification Service may have delays during high traffic
- Check Expo status page for service issues
- Consider implementing retry logic for critical notifications

## Best Practices

1. **Don't spam**: Limit notifications to important updates only
2. **Personalize**: Use user's name and relevant information
3. **Timing**: Send notifications at appropriate times (not late at night)
4. **Clear CTAs**: Make it clear what action users should take
5. **Test first**: Always test notifications before sending to all users

## Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
