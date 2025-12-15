
# 📱 Pelo Loco Barbershop - Complete App Store Submission Guide

## 🎯 Overview

This guide will walk you through the complete process of submitting your Pelo Loco Barbershop app to both the Apple App Store and Google Play Store.

---

## 📋 Pre-Submission Checklist

### ✅ Account Setup
- [ ] Apple Developer Account ($99/year) - https://developer.apple.com
- [ ] Google Play Developer Account ($25 one-time) - https://play.google.com/console
- [ ] Expo Account (free) - https://expo.dev
- [ ] Supabase Project (configured and running)

### ✅ Legal Requirements
- [ ] Privacy Policy URL (hosted publicly)
- [ ] Terms of Service URL (optional but recommended)
- [ ] Support Email Address
- [ ] App Store Listing Content (descriptions, keywords)

### ✅ App Assets
- [ ] App Icon (1024x1024 PNG)
- [ ] Screenshots for all required device sizes
- [ ] Feature Graphic (Android only, 1024x500)
- [ ] Promotional materials (optional)

---

## 🍎 Apple App Store Submission

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Step 2: Configure Your Project

1. **Update eas.json** with your Apple credentials:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-asc-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

2. **Find your Apple Team ID**:
   - Go to https://developer.apple.com/account
   - Click on "Membership" in the sidebar
   - Your Team ID is listed there

3. **Create App in App Store Connect**:
   - Go to https://appstoreconnect.apple.com
   - Click "My Apps" → "+" → "New App"
   - Fill in:
     - Platform: iOS
     - Name: Pelo Loco Barbershop
     - Primary Language: Italian
     - Bundle ID: com.pelolocobarbershop.app
     - SKU: pelo-loco-barbershop-001
   - Note your ASC App ID (found in App Information)

### Step 3: Build for iOS

```bash
eas build --platform ios --profile production
```

This will:
- Create a production build
- Generate an IPA file
- Upload to EAS servers
- Take approximately 15-30 minutes

### Step 4: Submit to App Store

```bash
eas submit --platform ios --profile production
```

Or manually:
1. Download the IPA from EAS dashboard
2. Use Transporter app (Mac) to upload
3. Go to App Store Connect
4. Select your app → "TestFlight" or "App Store"
5. Select the build you just uploaded

### Step 5: Complete App Store Listing

In App Store Connect:

1. **App Information**:
   - Name: Pelo Loco Barbershop
   - Subtitle: Il tuo barbiere di fiducia
   - Category: Primary: Lifestyle, Secondary: Business
   - Content Rights: Check if you own all rights

2. **Pricing and Availability**:
   - Price: Free
   - Availability: All countries or select specific ones

3. **App Privacy**:
   - Data Types Collected:
     - Contact Info (Name, Email, Phone)
     - User Content (Photos for products)
     - Identifiers (User ID)
   - Privacy Policy URL: [Your hosted privacy policy URL]

4. **Version Information**:
   - Screenshots (required):
     - 6.7" Display (iPhone 14 Pro Max): 1290 x 2796
     - 6.5" Display (iPhone 11 Pro Max): 1242 x 2688
     - Upload at least 3 screenshots per size
   
   - Description:
   ```
   Pelo Loco Barbershop - L'app ufficiale del tuo barbiere di fiducia!

   PRENOTA IL TUO TAGLIO
   • Prenota appuntamenti in modo semplice e veloce
   • Scegli il servizio che preferisci
   • Visualizza gli orari disponibili in tempo reale
   • Gestisci le tue prenotazioni

   ACQUISTA PRODOTTI
   • Sfoglia il nostro catalogo di prodotti premium
   • Acquista direttamente dall'app
   • Ritira in negozio o paga alla consegna

   COUPON ESCLUSIVI
   • Gira la ruota per vincere sconti
   • Ricevi coupon per il tuo compleanno
   • Accumula punti fedeltà

   NOTIFICHE
   • Ricevi promemoria per i tuoi appuntamenti
   • Offerte speciali e promozioni
   • Aggiornamenti dal tuo barbiere

   Pelo Loco Barbershop - Dove lo stile incontra la tradizione.
   ```

   - Keywords: barbershop,barbiere,taglio,capelli,barba,prenotazione,appuntamento,salon,grooming,style

   - Support URL: [Your website or support page]
   - Marketing URL: [Your website] (optional)

5. **App Review Information**:
   - Contact Information: Your email and phone
   - Demo Account (if needed):
     - Username: demo@pelolocobarbershop.com
     - Password: [Create a demo account]
   - Notes: "This app requires a Supabase backend. All features are functional."

6. **Version Release**:
   - Automatically release after approval
   - Or manually release

### Step 6: Submit for Review

1. Click "Add for Review"
2. Answer export compliance questions:
   - Does your app use encryption? → No (or Yes if using HTTPS)
   - ITSAppUsesNonExemptEncryption is set to false in app.json
3. Click "Submit to App Review"

### Step 7: Wait for Review

- Typical review time: 24-48 hours
- You'll receive email updates
- Check status in App Store Connect

---

## 🤖 Google Play Store Submission

### Step 1: Create Service Account

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create a new project or select existing
3. Enable Google Play Android Developer API
4. Create Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - Name: "EAS Submit"
   - Grant role: "Service Account User"
5. Create JSON key:
   - Click on service account
   - Keys → Add Key → Create New Key → JSON
   - Download and save as `google-play-service-account.json`

### Step 2: Link Service Account to Play Console

1. Go to Google Play Console: https://play.google.com/console
2. Setup → API access
3. Link the service account you created
4. Grant permissions: "Admin (all permissions)"

### Step 3: Update eas.json

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Step 4: Build for Android

**For Google Play (AAB - recommended)**:
```bash
eas build --platform android --profile production-aab
```

**For direct distribution (APK)**:
```bash
eas build --platform android --profile production
```

Build time: approximately 10-20 minutes

### Step 5: Create App in Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: Pelo Loco Barbershop
   - Default language: Italian
   - App or game: App
   - Free or paid: Free
4. Accept declarations and create

### Step 6: Complete Store Listing

1. **Main Store Listing**:
   - App name: Pelo Loco Barbershop
   - Short description (80 chars):
   ```
   Prenota il tuo taglio, acquista prodotti e ricevi coupon esclusivi
   ```
   
   - Full description (4000 chars):
   ```
   Pelo Loco Barbershop - L'app ufficiale del tuo barbiere di fiducia!

   🗓️ PRENOTA IL TUO TAGLIO
   Prenota appuntamenti in modo semplice e veloce. Scegli il servizio che preferisci, visualizza gli orari disponibili in tempo reale e gestisci tutte le tue prenotazioni in un unico posto.

   🛍️ ACQUISTA PRODOTTI
   Sfoglia il nostro catalogo di prodotti premium per la cura dei capelli e della barba. Acquista direttamente dall'app e ritira in negozio o paga alla consegna.

   🎁 COUPON ESCLUSIVI
   Gira la ruota della fortuna per vincere sconti esclusivi! Ricevi coupon speciali per il tuo compleanno e accumula punti fedeltà ad ogni visita.

   🔔 NOTIFICHE
   Ricevi promemoria per i tuoi appuntamenti, offerte speciali e promozioni direttamente dal tuo barbiere.

   ✨ CARATTERISTICHE PRINCIPALI
   • Prenotazione appuntamenti online
   • Catalogo prodotti integrato
   • Sistema di coupon e sconti
   • Programma fedeltà
   • Storico appuntamenti e ordini
   • Notifiche personalizzate
   • Interfaccia moderna e intuitiva

   Pelo Loco Barbershop - Dove lo stile incontra la tradizione.

   Per supporto: [your-email@example.com]
   ```

   - App icon: 512 x 512 PNG
   - Feature graphic: 1024 x 500 PNG
   - Phone screenshots: At least 2, up to 8 (1080 x 1920)
   - 7" tablet screenshots: Optional (1200 x 1920)
   - 10" tablet screenshots: Optional (1600 x 2560)

2. **Store Settings**:
   - App category: Lifestyle
   - Tags: Barbershop, Beauty, Booking
   - Contact details:
     - Email: [your-email@example.com]
     - Phone: [optional]
     - Website: [your-website.com]
   - Privacy policy: [Your privacy policy URL]

3. **App Content**:
   - Privacy Policy: [URL]
   - App access: All functionality is available without restrictions
   - Ads: No (unless you add ads)
   - Content rating:
     - Complete questionnaire
     - Should be rated "Everyone"
   - Target audience: 18+
   - News app: No
   - COVID-19 contact tracing: No
   - Data safety:
     - Collects: Name, Email, Phone, Photos
     - Shares: No
     - Security: Data encrypted in transit and at rest

4. **Select Countries**:
   - Available in: All countries or select specific ones
   - Italy should definitely be included

### Step 7: Submit for Review

```bash
eas submit --platform android --profile production
```

Or manually:
1. Download AAB from EAS dashboard
2. Go to Play Console → Production → Create new release
3. Upload AAB file
4. Add release notes:
   ```
   Prima versione di Pelo Loco Barbershop!
   
   • Prenota appuntamenti
   • Acquista prodotti
   • Ricevi coupon esclusivi
   • Programma fedeltà
   ```
5. Review and roll out to production

### Step 8: Wait for Review

- Typical review time: 1-7 days (usually faster than iOS)
- You'll receive email updates
- Check status in Play Console

---

## 📸 Creating Screenshots

### Tools
- **iOS**: Use iOS Simulator + Screenshot tool
- **Android**: Use Android Emulator + Screenshot tool
- **Design**: Figma, Canva, or Screenshot Framer

### Recommended Screens to Capture

1. **Home Screen** (Customer view)
   - Shows welcome message and quick actions

2. **Booking Flow**
   - Service selection
   - Date/time picker
   - Confirmation screen

3. **Product Catalog**
   - Grid of products with images

4. **Spin the Wheel**
   - Coupon wheel interface

5. **Profile/Bookings**
   - User profile with upcoming appointments

6. **Admin Dashboard** (optional)
   - Shows admin capabilities

### Screenshot Tips
- Use real data (not lorem ipsum)
- Show the app in action
- Use consistent device frames
- Add captions/annotations if helpful
- Ensure text is readable
- Show key features

---

## 🔒 Privacy Policy Template

Host this on your website, GitHub Pages, or Notion:

```markdown
# Privacy Policy for Pelo Loco Barbershop

**Last Updated**: [Current Date]

## Introduction
Pelo Loco Barbershop ("we", "our", "us") respects your privacy and is committed to protecting your personal data.

## Information We Collect
- **Personal Information**: Name, email address, phone number
- **Optional Information**: Birthday (for birthday coupons)
- **Usage Data**: Appointment history, order history, coupon usage
- **Photos**: Product images uploaded by admin users

## How We Use Your Information
- To manage and confirm your appointments
- To process your orders
- To send you promotional offers (with your consent)
- To send you birthday coupons
- To improve our services

## Data Storage and Security
- Your data is stored securely using Supabase
- We use industry-standard encryption
- We do not sell your personal information to third parties

## Your Rights
You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Opt-out of promotional communications
- Withdraw consent at any time

## Data Retention
We retain your data for as long as your account is active or as needed to provide services.

## Third-Party Services
We use:
- Supabase for data storage and authentication
- Expo for app infrastructure

## Children's Privacy
Our app is not intended for children under 13.

## Changes to This Policy
We may update this policy from time to time. We will notify you of any changes.

## Contact Us
For privacy-related questions:
- Email: [your-email@example.com]
- Address: [Your business address]

## Consent
By using our app, you consent to this privacy policy.
```

---

## 🚨 Common Rejection Reasons & Solutions

### iOS App Store

1. **Rejection: Incomplete Information**
   - Solution: Ensure all metadata fields are filled
   - Provide demo account if needed

2. **Rejection: Privacy Policy Missing**
   - Solution: Add valid, accessible privacy policy URL

3. **Rejection: Crashes or Bugs**
   - Solution: Test thoroughly before submission
   - Check crash logs in EAS dashboard

4. **Rejection: Misleading Content**
   - Solution: Ensure screenshots match actual app
   - Description should be accurate

5. **Rejection: Requires Login**
   - Solution: Provide demo account credentials
   - Or explain why login is necessary

### Google Play Store

1. **Rejection: Privacy Policy**
   - Solution: Ensure privacy policy is accessible and complete

2. **Rejection: Content Rating**
   - Solution: Complete content rating questionnaire accurately

3. **Rejection: Data Safety**
   - Solution: Accurately declare what data you collect

4. **Rejection: Target Audience**
   - Solution: Declare appropriate age range

---

## 📊 Post-Launch Checklist

After your app is live:

- [ ] Monitor crash reports in EAS dashboard
- [ ] Respond to user reviews (both stores)
- [ ] Track downloads and user engagement
- [ ] Monitor Supabase usage and costs
- [ ] Plan for updates and new features
- [ ] Set up analytics (optional)
- [ ] Create marketing materials
- [ ] Announce launch on social media

---

## 🔄 Releasing Updates

When you need to update your app:

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

2. **Build new version**:
   ```bash
   eas build --platform all --profile production
   ```

3. **Submit update**:
   ```bash
   eas submit --platform all --profile production
   ```

4. **Add release notes** in both stores explaining what's new

---

## 💡 Tips for Success

1. **Test Extensively**: Test on real devices before submitting
2. **Clear Screenshots**: Make sure screenshots are clear and show key features
3. **Accurate Description**: Don't overpromise in your description
4. **Respond Quickly**: If rejected, address issues and resubmit quickly
5. **Monitor Reviews**: Respond to user feedback promptly
6. **Plan Updates**: Regular updates show active development
7. **Backup Data**: Always backup your Supabase database
8. **Monitor Costs**: Keep an eye on Supabase usage

---

## 📞 Support Resources

- **Expo Documentation**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
- **App Store Connect**: https://developer.apple.com/app-store-connect/
- **Google Play Console**: https://support.google.com/googleplay/android-developer
- **Supabase Docs**: https://supabase.com/docs

---

## 🎉 You're Ready!

Your Pelo Loco Barbershop app is production-ready and this guide has everything you need to submit to both app stores.

**Estimated Timeline**:
- Build preparation: 1-2 hours
- Asset creation: 2-4 hours
- Store listing setup: 1-2 hours
- iOS review: 1-3 days
- Android review: 1-7 days

**Total time to launch**: Approximately 1-2 weeks from start to finish.

Good luck with your launch! 🚀✂️💈
