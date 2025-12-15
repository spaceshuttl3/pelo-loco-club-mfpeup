
# 🚀 Pelo Loco Barbershop - Launch Day Checklist

Print this page and check off items as you complete them!

---

## 📅 BEFORE LAUNCH DAY

### Week Before Launch

#### Accounts Setup
- [ ] Apple Developer Account created ($99/year)
- [ ] Google Play Developer Account created ($25 one-time)
- [ ] Expo account configured
- [ ] Supabase project verified and accessible

#### Assets Preparation
- [ ] App icon prepared (1024x1024 PNG)
- [ ] iOS screenshots captured (1290x2796, minimum 3)
- [ ] Android screenshots captured (1080x1920, minimum 2)
- [ ] Android feature graphic created (1024x500)
- [ ] All images are high quality and clear

#### Legal Documents
- [ ] Privacy policy written
- [ ] Privacy policy hosted online
- [ ] Privacy policy URL tested and accessible
- [ ] Support email set up and monitored
- [ ] Terms of service (optional)

#### App Testing
- [ ] Tested on iPhone (small screen)
- [ ] Tested on iPhone (large screen)
- [ ] Tested on iPad
- [ ] Tested on Android phone
- [ ] Tested on Android tablet
- [ ] All customer features work
- [ ] All admin features work
- [ ] No crashes
- [ ] No console errors
- [ ] Demo account created and tested

#### Store Listings
- [ ] App descriptions written (Italian)
- [ ] Keywords selected
- [ ] Categories chosen
- [ ] Age ratings determined
- [ ] Contact information ready

---

## 🏗️ BUILD DAY

### Morning - iOS Build

#### Step 1: Prepare Environment
- [ ] Open terminal
- [ ] Navigate to project folder
- [ ] Run `npm install` to ensure dependencies are updated
- [ ] Run `eas login` to authenticate

#### Step 2: Configure eas.json
- [ ] Open `eas.json`
- [ ] Add Apple ID email
- [ ] Add Apple Team ID
- [ ] Add ASC App ID
- [ ] Save file

#### Step 3: Build iOS
- [ ] Run: `eas build --platform ios --profile production`
- [ ] Wait 15-30 minutes
- [ ] Check EAS dashboard for build status
- [ ] Download IPA when complete (optional)
- [ ] Note build ID

**Build Started:** ___:___ AM/PM  
**Build Completed:** ___:___ AM/PM  
**Build ID:** _______________________

### Afternoon - Android Build

#### Step 4: Configure Service Account
- [ ] Create service account in Google Cloud Console
- [ ] Download JSON key
- [ ] Save as `google-play-service-account.json`
- [ ] Update path in `eas.json`

#### Step 5: Build Android
- [ ] Run: `eas build --platform android --profile production-aab`
- [ ] Wait 10-20 minutes
- [ ] Check EAS dashboard for build status
- [ ] Download AAB when complete (optional)
- [ ] Note build ID

**Build Started:** ___:___ AM/PM  
**Build Completed:** ___:___ AM/PM  
**Build ID:** _______________________

---

## 📱 SUBMISSION DAY

### iOS App Store Submission

#### Step 1: Create App in App Store Connect
- [ ] Go to https://appstoreconnect.apple.com
- [ ] Click "My Apps" → "+"
- [ ] Fill in app name: Pelo Loco Barbershop
- [ ] Select bundle ID: com.pelolocobarbershop.app
- [ ] Enter SKU: pelo-loco-barbershop-001
- [ ] Click "Create"

**ASC App ID:** _______________________

#### Step 2: App Information
- [ ] Set primary category: Lifestyle
- [ ] Set secondary category: Business
- [ ] Add privacy policy URL
- [ ] Add support URL
- [ ] Save

#### Step 3: Pricing and Availability
- [ ] Set price: Free
- [ ] Select countries: All or specific
- [ ] Save

#### Step 4: App Privacy
- [ ] Click "Get Started"
- [ ] Select data types: Contact Info, Photos, User Content
- [ ] Add privacy policy URL
- [ ] Complete questionnaire
- [ ] Publish

#### Step 5: Prepare for Submission
- [ ] Go to version 1.0.0
- [ ] Upload screenshots (1290x2796)
- [ ] Add app description
- [ ] Add keywords
- [ ] Add promotional text
- [ ] Add support URL
- [ ] Add marketing URL (optional)

#### Step 6: Build Selection
- [ ] Click "Build" section
- [ ] Select build from TestFlight
- [ ] Add build to version

#### Step 7: App Review Information
- [ ] Add contact email
- [ ] Add contact phone
- [ ] Add demo account:
  - Email: demo@pelolocobarbershop.com
  - Password: Demo123!
- [ ] Add notes for reviewer
- [ ] Answer export compliance questions

#### Step 8: Submit
- [ ] Review all information
- [ ] Click "Add for Review"
- [ ] Click "Submit to App Review"
- [ ] Confirm submission

**Submitted:** ___/___/______ at ___:___ AM/PM

---

### Android Google Play Submission

#### Step 1: Create App in Play Console
- [ ] Go to https://play.google.com/console
- [ ] Click "Create app"
- [ ] Enter name: Pelo Loco Barbershop
- [ ] Select language: Italian
- [ ] Select type: App
- [ ] Select free or paid: Free
- [ ] Accept declarations
- [ ] Click "Create app"

#### Step 2: Store Listing
- [ ] Upload app icon (512x512)
- [ ] Upload screenshots (1080x1920, minimum 2)
- [ ] Upload feature graphic (1024x500)
- [ ] Add short description (80 chars)
- [ ] Add full description
- [ ] Add app category: Lifestyle
- [ ] Add contact email
- [ ] Add privacy policy URL
- [ ] Save

#### Step 3: App Content
- [ ] Privacy policy: Add URL
- [ ] App access: All functionality available
- [ ] Ads: Select "No"
- [ ] Content rating: Complete questionnaire
- [ ] Target audience: 18+
- [ ] News app: No
- [ ] COVID-19: No
- [ ] Data safety: Complete form
  - Collects: Name, Email, Phone, Photos
  - Shares: No
  - Encrypted: Yes
- [ ] Save all

#### Step 4: Store Settings
- [ ] Select app category: Lifestyle
- [ ] Add tags
- [ ] Add contact details
- [ ] Save

#### Step 5: Production Release
- [ ] Go to "Production" → "Create new release"
- [ ] Upload AAB file (from EAS build)
- [ ] Add release name: 1.0.0
- [ ] Add release notes (Italian):
  ```
  Prima versione di Pelo Loco Barbershop!
  
  • Prenota appuntamenti
  • Acquista prodotti
  • Ricevi coupon esclusivi
  • Programma fedeltà
  ```
- [ ] Review release
- [ ] Click "Review release"
- [ ] Click "Start rollout to Production"
- [ ] Confirm rollout

**Submitted:** ___/___/______ at ___:___ AM/PM

---

## 📊 POST-SUBMISSION

### Immediate Actions
- [ ] Save submission confirmation emails
- [ ] Note submission dates and times
- [ ] Set calendar reminders to check status
- [ ] Monitor email for review updates

### Daily Checks (During Review)
- [ ] Check App Store Connect for iOS status
- [ ] Check Google Play Console for Android status
- [ ] Check email for review messages
- [ ] Respond to any questions within 24 hours

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Fix the issue
- [ ] Resubmit immediately
- [ ] Note what was fixed

**iOS Status:**
- [ ] In Review
- [ ] Pending Developer Release
- [ ] Ready for Sale
- [ ] Rejected (reason: ___________________)

**Android Status:**
- [ ] In Review
- [ ] Pending Publication
- [ ] Published
- [ ] Rejected (reason: ___________________)

---

## 🎉 LAUNCH DAY

### When App Goes Live

#### iOS Launch
- [ ] App appears in App Store
- [ ] Download and test on real device
- [ ] Verify all features work
- [ ] Check app listing looks correct
- [ ] Take screenshots of live listing

**iOS Live Date:** ___/___/______

#### Android Launch
- [ ] App appears in Google Play
- [ ] Download and test on real device
- [ ] Verify all features work
- [ ] Check app listing looks correct
- [ ] Take screenshots of live listing

**Android Live Date:** ___/___/______

---

## 📣 MARKETING & ANNOUNCEMENT

### Social Media
- [ ] Prepare launch post
- [ ] Include App Store link
- [ ] Include Google Play link
- [ ] Add screenshots
- [ ] Add hashtags
- [ ] Post on Facebook
- [ ] Post on Instagram
- [ ] Post on Twitter/X
- [ ] Post on LinkedIn

### Customer Communication
- [ ] Send email to existing customers
- [ ] Include download links
- [ ] Explain key features
- [ ] Offer launch promotion (optional)

### In-Store Promotion
- [ ] Print QR codes for App Store
- [ ] Print QR codes for Google Play
- [ ] Display in shop
- [ ] Tell customers about app
- [ ] Offer incentive for downloads

---

## 📈 WEEK 1 MONITORING

### Daily Tasks
- [ ] Check crash reports in EAS dashboard
- [ ] Monitor user reviews (iOS)
- [ ] Monitor user reviews (Android)
- [ ] Respond to reviews within 24 hours
- [ ] Check download numbers
- [ ] Monitor Supabase usage
- [ ] Check for any critical bugs

### Metrics to Track
- **Day 1 Downloads:** _______
- **Day 3 Downloads:** _______
- **Day 7 Downloads:** _______
- **Active Users:** _______
- **Bookings via App:** _______
- **Orders via App:** _______
- **Average Rating (iOS):** _____ stars
- **Average Rating (Android):** _____ stars

---

## 🐛 ISSUE TRACKING

### Critical Issues (Fix Immediately)
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### Minor Issues (Fix in v1.0.1)
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### Feature Requests
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

---

## 🎯 SUCCESS METRICS

### Week 1 Goals
- [ ] 50+ downloads
- [ ] 10+ active users
- [ ] 5+ bookings through app
- [ ] No critical bugs
- [ ] 4+ star rating

### Month 1 Goals
- [ ] 200+ downloads
- [ ] 50+ active users
- [ ] 25+ bookings through app
- [ ] 10+ product orders
- [ ] 4.5+ star rating

---

## 📝 NOTES & OBSERVATIONS

### What Went Well
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

### What Could Be Improved
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

### Lessons Learned
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## 🎊 CELEBRATION!

### When Both Apps Are Live
- [ ] Take team photo
- [ ] Celebrate with team
- [ ] Thank everyone involved
- [ ] Share success story
- [ ] Plan for future updates

**Official Launch Date:** ___/___/______

---

## 📞 EMERGENCY CONTACTS

**Expo Support:** support@expo.dev  
**Apple Developer Support:** https://developer.apple.com/support/  
**Google Play Support:** https://support.google.com/googleplay/android-developer  
**Supabase Support:** https://supabase.com/support

---

## ✅ FINAL VERIFICATION

Before you start, verify:
- [ ] All code is committed and backed up
- [ ] Database is backed up
- [ ] All credentials are saved securely
- [ ] Team is ready
- [ ] Support email is monitored
- [ ] You're ready to respond to reviews

---

# 🚀 YOU'RE READY TO LAUNCH!

**Remember:**
- Stay calm during the review process
- Respond quickly to any questions
- Monitor everything closely in week 1
- Celebrate your success!

**Good luck!** 🎉✂️💈

---

**Checklist Version:** 1.0  
**App Version:** 1.0.0  
**Date Printed:** ___/___/______  
**Printed By:** _______________________
