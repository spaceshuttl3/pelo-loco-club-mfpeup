
# Pelo Loco Club - Setup Guide

Welcome to **Pelo Loco Club**, a premium barbershop booking and management app!

## 🚀 Quick Start

### 1. Enable Supabase Backend

**IMPORTANT:** This app requires Supabase to function. Follow these steps:

1. **Press the Supabase button** in the Natively interface
2. **Connect to a Supabase project** (create one at https://supabase.com if needed)
3. **Get your credentials:**
   - Go to your Supabase project
   - Navigate to Settings > API
   - Copy your Project URL and anon/public key

4. **Update credentials in `lib/supabase.ts`:**
   ```typescript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

### 2. Set Up Database

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Run the SQL commands to create all tables and policies

### 3. Create Admin Account

1. Launch the app
2. Sign up with your admin email (e.g., admin@pelolococlub.com)
3. Go to Supabase SQL Editor and run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
   ```
4. Sign out and sign back in to access the admin dashboard

## 📱 App Features

### Customer Features
- **Account Creation & Login** - Secure authentication
- **Book Appointments** - Select service, date, and time
- **Payment Options** - Pay in person or online (Stripe/Apple Pay coming soon)
- **Appointment History** - View upcoming and past appointments
- **Product Shop** - Browse and purchase grooming products
- **Spin The Wheel** - Win random coupons and discounts
- **Coupon Management** - Store and use coupons at checkout

### Admin Features (Barber Dashboard)
- **Dashboard Overview** - Today's appointments and pending orders
- **Appointment Management** - Approve, complete, or cancel bookings
- **Product Inventory** - Add, edit, and remove products
- **Push Notifications** - Send promotions to all users or specific customers
- **Marketing Automation** - Automatic reminders for inactive customers

## 🎨 Design

The app features a modern, premium dark theme:
- **Background:** #121212 (Dark Gray)
- **Text:** #FFFFFF (White)
- **Primary:** #BB86FC (Purple)
- **Secondary:** #03DAC5 (Teal)
- **Accent:** #FF4081 (Pink)

## 🔐 User Roles

### Customer Role
- Book appointments
- Browse products
- Spin the wheel for coupons
- View booking history

### Admin Role (Barber)
- Manage all appointments
- Manage product inventory
- Send push notifications
- View dashboard analytics

## 📊 Database Structure

### Tables Created:
1. **users** - User profiles with role-based access
2. **appointments** - Booking records with payment tracking
3. **products** - Product inventory with stock management
4. **orders** - Purchase history
5. **coupons** - Discount coupons and promotions

## 🔔 Push Notifications (Coming Soon)

To enable push notifications:
1. Set up Firebase Cloud Messaging
2. Add Firebase configuration to the app
3. Update notification handlers in the admin panel

## 🛠️ Tech Stack

- **Frontend:** React Native + Expo 54
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** AsyncStorage for local data
- **Navigation:** Expo Router (file-based routing)
- **UI:** Custom components with dark theme

## 📝 Sample Services

The app comes with these default services:
- Haircut - $25 (30 min)
- Beard Trim - $15 (20 min)
- Haircut + Beard - $35 (45 min)
- Hot Towel Shave - $30 (30 min)
- Kids Haircut - $20 (20 min)

## 🎯 Next Steps

1. ✅ Set up Supabase and update credentials
2. ✅ Run database setup SQL
3. ✅ Create admin account
4. ✅ Add products to inventory
5. ✅ Test customer booking flow
6. 🔜 Set up Firebase for push notifications
7. 🔜 Configure Stripe for online payments
8. 🔜 Add custom branding and logo

## 💡 Tips

- **Test with multiple accounts** to see both customer and admin views
- **Use the Spin The Wheel** feature to engage customers
- **Set up automated reminders** for customers who haven't booked in 30 days
- **Add product photos** using Supabase Storage for better product presentation

## 🆘 Troubleshooting

### "No storage option exists" warning
- This is normal and can be ignored if you're not using server-side auth

### Can't sign in
- Check that Supabase credentials are correct in `lib/supabase.ts`
- Verify email confirmation is disabled in Supabase Auth settings

### Admin features not showing
- Make sure your user role is set to 'admin' in the database
- Sign out and sign back in after changing the role

## 📞 Support

For issues or questions:
1. Check the Supabase logs for errors
2. Review the console logs in the app
3. Verify all database tables and policies are created correctly

---

**Pelo Loco Club** - Premium Barbershop Experience 💈
