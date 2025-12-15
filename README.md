
# 🚀 Pelo Loco Barbershop - Production Ready App

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81.4-61DAFB.svg)
![Expo](https://img.shields.io/badge/Expo-54.0.1-000020.svg)

**The complete mobile app for Pelo Loco Barbershop**

[Features](#-features) • [Installation](#-installation) • [Building](#-building-for-production) • [Submission](#-app-store-submission) • [Documentation](#-documentation)

</div>

---

## 📱 Overview

Pelo Loco Barbershop is a full-featured mobile application that allows customers to book appointments, purchase products, and receive exclusive coupons. The app includes a comprehensive admin dashboard for managing all aspects of the barbershop business.

### 🎯 Key Highlights

- ✅ **Production Ready**: Fully tested and ready for app store submission
- ✅ **Responsive Design**: Adapts to all screen sizes
- ✅ **Modern UI**: Dark theme with premium barbershop aesthetic
- ✅ **Supabase Backend**: Secure, scalable database with RLS policies
- ✅ **Escalating Booking UI**: Intuitive step-by-step appointment booking
- ✅ **Image Upload**: Product images stored in Supabase Storage
- ✅ **Password Reset**: Deep linking support for password recovery

---

## ✨ Features

### 👤 Customer Features

- **User Authentication**
  - Email/password registration with verification
  - Secure login and logout
  - Password reset via email

- **Appointment Booking**
  - Escalating UI flow (service → barber → date/time → payment)
  - Real-time availability checking
  - View upcoming and past appointments
  - Barber availability: Tuesday-Saturday, 9:00 AM - 9:00 PM

- **Product Shopping**
  - Browse product catalog with images
  - Add products to cart
  - Place orders (pay in person or online)
  - View order history

- **Rewards & Coupons**
  - Spin the wheel to win coupons
  - Birthday coupons
  - Loyalty rewards system
  - View and manage coupons

- **Profile Management**
  - Update personal information
  - View booking history
  - Manage preferences

### 👨‍💼 Admin Features

- **Dashboard**
  - Today's appointments overview
  - Pending orders count
  - Daily earnings calculation
  - Quick action buttons

- **Appointment Management**
  - View all appointments
  - Approve/reschedule/cancel bookings
  - Provide cancellation reasons to customers
  - Calendar view

- **Product Management**
  - Add/edit/delete products
  - Upload product images
  - Manage inventory and stock
  - Set pricing

- **Service Management**
  - Create and edit services
  - Set duration and pricing
  - Manage service availability

- **Coupon Management**
  - Create custom coupons
  - Set discount values and expiration dates
  - Track coupon usage

- **Customer Management**
  - View customer birthdays
  - Send birthday coupons automatically

- **Notifications**
  - Send broadcast notifications to all users
  - Send targeted notifications to specific users
  - Promotional campaigns

- **Reports & Analytics**
  - Revenue tracking
  - Appointment statistics
  - Order analytics
  - Customer insights

---

## 🛠️ Tech Stack

- **Frontend**: React Native 0.81.4
- **Framework**: Expo 54.0.1
- **Navigation**: Expo Router 6.0.0
- **Backend**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **UI Components**: Custom components with responsive design
- **Icons**: SF Symbols (iOS) / Material Icons (Android)

---

## 📦 Installation

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (will be installed globally)
- iOS Simulator (Mac only) or Android Emulator
- Supabase account and project

### Setup Steps

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install EAS CLI globally**
   ```bash
   npm install -g eas-cli
   ```

4. **Configure Supabase**
   - Update `lib/supabase.ts` with your Supabase credentials
   - Ensure all database tables are created (see `database-setup.sql`)
   - Configure RLS policies
   - Set up storage bucket for product images

5. **Start development server**
   ```bash
   npm run dev
   ```

---

## 🏗️ Building for Production

### iOS Build

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

### Android Build

```bash
# Build AAB for Google Play (recommended)
eas build --platform android --profile production-aab

# Submit to Google Play
eas submit --platform android --profile production
```

### Build Both Platforms

```bash
# Build for both iOS and Android
eas build --platform all --profile production

# Submit to both stores
eas submit --platform all --profile production
```

**See [BUILD-COMMANDS.md](BUILD-COMMANDS.md) for complete build command reference.**

---

## 📱 App Store Submission

### Requirements

#### Apple App Store
- [ ] Apple Developer Account ($99/year)
- [ ] App created in App Store Connect
- [ ] Privacy Policy URL
- [ ] Screenshots (6.7" and 6.5" iPhone)
- [ ] App icon (1024x1024 PNG)
- [ ] App description in Italian

#### Google Play Store
- [ ] Google Play Developer Account ($25 one-time)
- [ ] App created in Play Console
- [ ] Service account JSON key
- [ ] Privacy Policy URL
- [ ] Screenshots (1080 x 1920)
- [ ] Feature graphic (1024 x 500)
- [ ] App icon (512x512 PNG)

**See [APP-STORE-SUBMISSION-GUIDE.md](APP-STORE-SUBMISSION-GUIDE.md) for detailed submission instructions.**

---

## 📚 Documentation

### Complete Guides

- **[PRODUCTION-READY.md](PRODUCTION-READY.md)** - Production readiness checklist and overview
- **[APP-STORE-SUBMISSION-GUIDE.md](APP-STORE-SUBMISSION-GUIDE.md)** - Complete submission guide for both stores
- **[FINAL-LAUNCH-CHECKLIST.md](FINAL-LAUNCH-CHECKLIST.md)** - Pre-launch verification checklist
- **[BUILD-COMMANDS.md](BUILD-COMMANDS.md)** - Quick reference for all build commands

### Additional Documentation

- **[SUPABASE-CONFIGURATION.md](SUPABASE-CONFIGURATION.md)** - Supabase setup instructions
- **[database-setup.sql](database-setup.sql)** - Database schema and setup
- **[TESTING-CHECKLIST.md](TESTING-CHECKLIST.md)** - Testing guidelines

---

## 🎨 App Configuration

### App Information

- **Name**: Pelo Loco Barbershop
- **Version**: 1.0.0
- **Bundle ID (iOS)**: com.pelolocobarbershop.app
- **Package Name (Android)**: com.pelolocobarbershop.app
- **Primary Language**: Italian
- **Category**: Lifestyle / Business
- **Age Rating**: 4+ (iOS) / Everyone (Android)

### Features Implemented

- ✅ User authentication with email verification
- ✅ Escalating appointment booking UI
- ✅ Real-time availability checking
- ✅ Product catalog with image upload
- ✅ Shopping cart and order management
- ✅ Spin the wheel for coupons
- ✅ Loyalty rewards system
- ✅ Admin dashboard with analytics
- ✅ Push notification support (ready for FCM integration)
- ✅ Password reset with deep linking
- ✅ Responsive design for all screen sizes
- ✅ Dark theme throughout
- ✅ Row Level Security (RLS) policies

---

## 🔐 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Database**: Row Level Security (RLS) policies on all tables
- **Storage**: Secure file upload with access policies
- **API Keys**: Environment-based configuration
- **Password Reset**: Secure token-based reset flow
- **Data Encryption**: HTTPS for all API calls

---

## 🚀 Deployment

### Development

```bash
# Start development server
npm run dev

# Start with tunnel (for physical device testing)
npm run dev:tunnel

# Start on specific platform
npm run ios
npm run android
```

### Production

```bash
# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform all --profile production
```

---

## 📊 Post-Launch

### Monitoring

- **Crash Reports**: Check EAS dashboard
- **User Reviews**: Monitor and respond to app store reviews
- **Analytics**: Track user engagement and feature usage
- **Database**: Monitor Supabase usage and performance
- **Costs**: Keep track of Supabase and Expo costs

### Updates

To release an update:

1. Update version in `app.json`
2. Build new version: `eas build --platform all --profile production`
3. Submit update: `eas submit --platform all --profile production`
4. Add release notes in both stores

---

## 💰 Cost Breakdown

### One-Time Costs
- Apple Developer Account: $99/year
- Google Play Developer Account: $25 (one-time)

### Monthly Costs
- Supabase: Free tier or ~$25/month for Pro
- Expo: Free (EAS builds have free tier)
- **Estimated**: $0-50/month depending on usage

---

## 🆘 Support

### Resources

- **Expo Documentation**: https://docs.expo.dev
- **Supabase Documentation**: https://supabase.com/docs
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/

### Common Issues

1. **Build fails**: Check EAS dashboard for logs
2. **Database errors**: Verify RLS policies and table structure
3. **Image upload fails**: Check Supabase storage bucket configuration
4. **Authentication issues**: Verify Supabase credentials in `lib/supabase.ts`

---

## 📝 License

This project is proprietary software for Pelo Loco Barbershop.

---

## 🎉 Ready to Launch!

Your Pelo Loco Barbershop app is **production-ready** and prepared for submission to both the Apple App Store and Google Play Store!

### Next Steps

1. ✅ Review [FINAL-LAUNCH-CHECKLIST.md](FINAL-LAUNCH-CHECKLIST.md)
2. ✅ Prepare app store assets (screenshots, descriptions)
3. ✅ Host your privacy policy
4. ✅ Create Apple Developer and Google Play Developer accounts
5. ✅ Run build commands
6. ✅ Submit to app stores
7. ✅ Wait for review (1-3 days for iOS, 1-7 days for Android)
8. ✅ Launch! 🚀

---

<div align="center">

**Made with ❤️ for Pelo Loco Barbershop**

✂️ Where Style Meets Tradition 💈

</div>
