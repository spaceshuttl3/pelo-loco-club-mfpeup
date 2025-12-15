
# 🚀 Getting Started - Pelo Loco Barbershop

## Quick Start Guide for Local Development

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Expo Go app** on your phone:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **Code Editor** (VS Code recommended)

---

## 🔧 Installation

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React Native
- Expo SDK
- Supabase client
- All other dependencies

### 2. Verify Installation

```bash
npm run dev
```

You should see the Expo development server start.

---

## 📱 Running the App

### Option 1: On Your Phone (Recommended)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Scan the QR code:**
   - **iOS**: Open Camera app and scan the QR code
   - **Android**: Open Expo Go app and scan the QR code

3. **Wait for the app to load** (first time may take a minute)

### Option 2: On iOS Simulator (Mac only)

1. **Install Xcode** from Mac App Store

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Press `i`** in the terminal to open iOS simulator

### Option 3: On Android Emulator

1. **Install Android Studio** and set up an emulator

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Press `a`** in the terminal to open Android emulator

---

## 🗄️ Database Setup

The app is already configured to use the Supabase database:

- **Project ID**: tvccqnqsdlzazpcnqqqx
- **URL**: https://tvccqnqsdlzazpcnqqqx.supabase.co
- **Status**: ✅ Configured and ready

### Database Includes:
- ✅ 14 tables with Row Level Security
- ✅ 3 active barbers
- ✅ 4 active services
- ✅ Storage bucket for product images
- ✅ Authentication configured

**No additional setup required!**

---

## 👤 Test Accounts

### Create Your Own Account
1. Open the app
2. Tap "Sign Up"
3. Enter your details
4. Verify your email
5. Start using the app!

### Admin Access
To test admin features, you'll need to:
1. Create an account
2. Update the user role in Supabase:
   - Go to Supabase Dashboard
   - Table Editor → users
   - Find your user
   - Change `role` from `customer` to `admin`
3. Log out and log back in

---

## 🎨 App Structure

```
pelo-loco-barbershop/
├── app/                      # All screens
│   ├── (customer)/          # Customer screens
│   │   ├── index.tsx        # Customer home
│   │   ├── book-appointment.tsx
│   │   ├── bookings.tsx
│   │   ├── products.tsx
│   │   ├── cart.tsx
│   │   ├── order-history.tsx
│   │   ├── rewards.tsx
│   │   ├── spin-wheel.tsx
│   │   └── profile.tsx
│   ├── (admin)/             # Admin screens
│   │   ├── index.tsx        # Admin dashboard
│   │   ├── appointments.tsx
│   │   ├── products.tsx
│   │   ├── services.tsx
│   │   ├── coupons.tsx
│   │   ├── notifications.tsx
│   │   ├── reports.tsx
│   │   ├── birthdays.tsx
│   │   └── rewards-config.tsx
│   ├── auth/                # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   └── index.tsx            # Entry point
├── components/              # Reusable components
├── contexts/                # React contexts
│   ├── AuthContext.tsx      # Authentication
│   └── CartContext.tsx      # Shopping cart
├── lib/                     # Libraries
│   └── supabase.ts          # Supabase client
├── styles/                  # Styles
│   └── commonStyles.ts      # Common styles
├── types/                   # TypeScript types
└── assets/                  # Images, fonts, etc.
```

---

## 🔑 Key Features to Test

### As Customer:
1. **Sign Up / Login**
   - Create account
   - Verify email
   - Login

2. **Book Appointment**
   - Select service
   - Choose barber
   - Pick date and time
   - Select payment method
   - Confirm booking

3. **Browse Products**
   - View product catalog
   - Add to cart
   - Place order

4. **Spin the Wheel**
   - Win coupons
   - View active coupons

5. **Loyalty Rewards**
   - View points
   - View badges
   - Redeem rewards

### As Admin:
1. **Dashboard**
   - View today's appointments
   - See statistics
   - Quick actions

2. **Manage Appointments**
   - View all bookings
   - Approve appointments
   - Cancel with reason

3. **Manage Products**
   - Add new products
   - Upload images
   - Edit/delete products

4. **Send Notifications**
   - Broadcast to all users
   - Send to specific user

5. **View Reports**
   - Revenue statistics
   - Appointment stats
   - Order stats

---

## 🛠️ Development Commands

### Start Development Server
```bash
npm run dev                  # Start with default settings
npm run dev:tunnel           # Use tunnel (for remote testing)
npm run dev:lan              # Use LAN (local network)
npm run dev:localhost        # Use localhost only
```

### Platform-Specific
```bash
npm run ios                  # Open iOS simulator
npm run android              # Open Android emulator
npm run web                  # Open in web browser
```

### Linting
```bash
npm run lint                 # Check for code issues
```

---

## 🐛 Troubleshooting

### Issue: "Unable to resolve module"
**Solution:**
```bash
rm -rf node_modules
npm install
npm run dev
```

### Issue: "Network response timed out"
**Solution:**
```bash
npm run dev:tunnel
```

### Issue: "Expo Go app shows error"
**Solution:**
1. Close Expo Go app completely
2. Restart development server
3. Scan QR code again

### Issue: "Can't connect to Supabase"
**Solution:**
1. Check internet connection
2. Verify Supabase project is not paused
3. Check credentials in `lib/supabase.ts`

### Issue: "Images not loading"
**Solution:**
1. Check Supabase Storage bucket is public
2. Verify image URLs in database
3. Test image URL in browser

---

## 📝 Making Changes

### Modify a Screen
1. Open the file in `app/` folder
2. Make your changes
3. Save the file
4. App will automatically reload

### Add a New Feature
1. Create new component in `components/`
2. Import and use in your screen
3. Test thoroughly

### Update Styles
1. Modify `styles/commonStyles.ts`
2. Changes apply app-wide

### Database Changes
1. Go to Supabase Dashboard
2. Use SQL Editor or Table Editor
3. Make changes
4. Test in app

---

## 🎨 Customization

### Change Colors
Edit `styles/commonStyles.ts`:
```typescript
export const colors = {
  primary: '#9b59b6',      // Purple
  secondary: '#3498db',    // Blue
  background: '#1a1a1a',   // Dark gray
  // ... more colors
};
```

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### Change App Icon
1. Replace `assets/images/02b10c40-cfdb-4f40-9909-b11442c57fab.jpeg`
2. Update path in `app.json`

---

## 📚 Learning Resources

### Expo Documentation
- **Getting Started**: https://docs.expo.dev/get-started/introduction/
- **Expo Router**: https://docs.expo.dev/router/introduction/
- **API Reference**: https://docs.expo.dev/versions/latest/

### React Native
- **Documentation**: https://reactnative.dev/docs/getting-started
- **Components**: https://reactnative.dev/docs/components-and-apis

### Supabase
- **Documentation**: https://supabase.com/docs
- **JavaScript Client**: https://supabase.com/docs/reference/javascript/introduction

### TypeScript
- **Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html

---

## 🆘 Getting Help

### Documentation
- Check the comprehensive guides in the project root
- Read `SUBMISSION-TROUBLESHOOTING.md` for common issues

### Community
- **Expo Forums**: https://forums.expo.dev
- **Expo Discord**: https://chat.expo.dev
- **Stack Overflow**: Tag with `expo`, `react-native`

### Official Support
- **Expo**: support@expo.dev
- **Supabase**: support@supabase.com

---

## ✅ Quick Checklist

Before you start developing:
- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Expo Go app on phone
- [ ] Development server running (`npm run dev`)
- [ ] App loads on phone
- [ ] Can create account
- [ ] Can login
- [ ] Features work as expected

---

## 🎯 Next Steps

### For Development
1. Familiarize yourself with the codebase
2. Test all features
3. Make small changes to understand the flow
4. Read the documentation

### For Production
1. Follow **QUICK-SUBMISSION-GUIDE.md**
2. Build the app with EAS
3. Submit to app stores
4. Launch! 🚀

---

## 💡 Tips

### Development Tips
- Use `console.log()` for debugging
- Test on real devices, not just simulators
- Keep the development server running
- Use hot reload to see changes instantly

### Best Practices
- Test after every change
- Commit code regularly
- Keep dependencies updated
- Follow TypeScript types
- Write clean, readable code

### Performance Tips
- Optimize images before uploading
- Use proper keys in lists
- Avoid unnecessary re-renders
- Test on slower devices

---

## 🎉 You're Ready!

You now have everything you need to:
- ✅ Run the app locally
- ✅ Test all features
- ✅ Make changes
- ✅ Develop new features
- ✅ Prepare for production

**Happy coding!** 💻✂️💈

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**App Version**: 1.0.0  
**Status**: ✅ READY FOR DEVELOPMENT
