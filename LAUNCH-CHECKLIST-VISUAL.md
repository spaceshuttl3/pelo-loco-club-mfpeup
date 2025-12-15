
# ✅ Pelo Loco Barbershop - Visual Launch Checklist

Print this checklist and check off items as you complete them!

---

## 📋 PRE-LAUNCH PREPARATION

### Developer Accounts
- [ ] Apple Developer Account created ($99/year)
- [ ] Google Play Developer Account created ($25 one-time)
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged into EAS (`eas login`)

### App Store Setup
- [ ] App created in App Store Connect
- [ ] Bundle ID registered (com.pelolocobarbershop.app)
- [ ] ASC App ID noted
- [ ] Apple Team ID noted

### Play Store Setup
- [ ] App created in Play Console
- [ ] Service account created
- [ ] Service account JSON key downloaded
- [ ] Service account linked to Play Console

---

## 🎨 ASSETS PREPARATION

### Screenshots
- [ ] iOS 6.7" screenshots (1290 x 2796) - minimum 3
- [ ] iOS 6.5" screenshots (1242 x 2688) - minimum 3
- [ ] Android phone screenshots (1080 x 1920) - minimum 2

### Graphics
- [ ] App icon 1024x1024 PNG (iOS)
- [ ] App icon 512x512 PNG (Android)
- [ ] Feature graphic 1024x500 PNG (Android)

### Content
- [ ] App description written (Italian)
- [ ] Short description written (Android, 80 chars)
- [ ] Keywords selected (iOS)
- [ ] Privacy policy written
- [ ] Privacy policy hosted online
- [ ] Support email set up

---

## 🔧 TECHNICAL SETUP

### Configuration
- [ ] `eas.json` updated with Apple credentials
- [ ] `eas.json` updated with Android service account path
- [ ] Supabase credentials verified in `lib/supabase.ts`
- [ ] Database tables exist
- [ ] RLS policies configured
- [ ] Storage bucket configured

### Testing
- [ ] App tested on iOS device
- [ ] App tested on Android device
- [ ] All features working
- [ ] No crashes
- [ ] Images loading correctly
- [ ] Authentication working
- [ ] Password reset working
- [ ] Booking flow working
- [ ] Product ordering working
- [ ] Admin dashboard working

---

## 🏗️ BUILD PHASE

### iOS Build
- [ ] Run: `eas build --platform ios --profile production`
- [ ] Build started successfully
- [ ] Build completed (check `eas build:list`)
- [ ] No build errors

### Android Build
- [ ] Run: `eas build --platform android --profile production-aab`
- [ ] Build started successfully
- [ ] Build completed (check `eas build:list`)
- [ ] No build errors

---

## 📱 APP STORE CONNECT (iOS)

### App Information
- [ ] Name: Pelo Loco Barbershop
- [ ] Subtitle: Il tuo barbiere di fiducia
- [ ] Primary Language: Italian
- [ ] Category: Lifestyle
- [ ] Secondary Category: Business

### Pricing & Availability
- [ ] Price: Free
- [ ] Availability: Selected countries

### App Privacy
- [ ] Privacy policy URL added
- [ ] Data types declared
- [ ] Data usage explained

### Version Information
- [ ] Screenshots uploaded (6.7" and 6.5")
- [ ] App description added
- [ ] Keywords added
- [ ] Support URL added
- [ ] Marketing URL added (optional)

### App Review Information
- [ ] Contact information added
- [ ] Demo account credentials provided (if needed)
- [ ] Review notes added

### Build
- [ ] Build selected from TestFlight
- [ ] Export compliance answered

---

## 🤖 GOOGLE PLAY CONSOLE (Android)

### Store Listing
- [ ] App name: Pelo Loco Barbershop
- [ ] Short description added (80 chars)
- [ ] Full description added
- [ ] App icon uploaded (512x512)
- [ ] Feature graphic uploaded (1024x500)
- [ ] Screenshots uploaded (1080x1920)

### Store Settings
- [ ] App category: Lifestyle
- [ ] Contact email added
- [ ] Privacy policy URL added

### App Content
- [ ] Privacy policy confirmed
- [ ] App access: All functionality available
- [ ] Ads: No
- [ ] Content rating completed
- [ ] Target audience: 18+
- [ ] Data safety form completed

### Release
- [ ] Production track selected
- [ ] AAB file uploaded
- [ ] Release notes added
- [ ] Countries selected

---

## 🚀 SUBMISSION

### iOS Submission
- [ ] Run: `eas submit --platform ios --profile production`
- [ ] Submission successful
- [ ] Confirmation email received
- [ ] Status: "Waiting for Review"

### Android Submission
- [ ] Run: `eas submit --platform android --profile production`
- [ ] Submission successful
- [ ] Confirmation email received
- [ ] Status: "Under Review"

---

## ⏳ REVIEW PHASE

### Monitoring
- [ ] Check email daily for updates
- [ ] Monitor App Store Connect status
- [ ] Monitor Play Console status
- [ ] Respond to any questions within 24 hours

### iOS Review
- [ ] Review started
- [ ] Review completed
- [ ] Status: "Ready for Sale" ✅

### Android Review
- [ ] Review started
- [ ] Review completed
- [ ] Status: "Published" ✅

---

## 🎉 POST-LAUNCH

### Day 1
- [ ] Verify app is live on App Store
- [ ] Verify app is live on Google Play
- [ ] Test download and installation
- [ ] Share app links with team
- [ ] Post launch announcement

### Week 1
- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Track download numbers
- [ ] Check Supabase usage
- [ ] Gather user feedback

### Month 1
- [ ] Analyze user behavior
- [ ] Review analytics
- [ ] Plan first update
- [ ] Address any issues
- [ ] Celebrate success! 🎊

---

## 📊 SUCCESS METRICS

### Week 1 Goals
- [ ] 50+ downloads
- [ ] 10+ active users
- [ ] 5+ bookings
- [ ] No critical bugs
- [ ] 4+ star rating

### Month 1 Goals
- [ ] 200+ downloads
- [ ] 50+ active users
- [ ] 25+ bookings
- [ ] 10+ orders
- [ ] 4.5+ star rating

---

## 🆘 EMERGENCY CONTACTS

### Support Resources
- Expo Support: https://expo.dev/support
- Supabase Support: https://supabase.com/support
- Apple Developer Support: https://developer.apple.com/support/
- Google Play Support: https://support.google.com/googleplay/android-developer

### Documentation
- README.md
- APP-STORE-SUBMISSION-GUIDE.md
- BUILD-COMMANDS.md
- FINAL-LAUNCH-CHECKLIST.md

---

## ✅ FINAL VERIFICATION

Before submitting, verify:
- [ ] All features tested and working
- [ ] No crashes or critical bugs
- [ ] All images load correctly
- [ ] Database is clean (no test data)
- [ ] Privacy policy is accessible
- [ ] Support email works
- [ ] Demo account works (if provided)
- [ ] App icon looks good
- [ ] Screenshots are accurate
- [ ] Description is compelling

---

## 🎯 LAUNCH DAY COMMANDS

```bash
# 1. Build
eas build --platform all --profile production

# 2. Check status
eas build:list

# 3. Submit
eas submit --platform all --profile production

# 4. Monitor
eas submit:list
```

---

## 🏆 COMPLETION

### When Everything is Checked
- [ ] All items above are checked ✅
- [ ] App is live on both stores 🎉
- [ ] Customers can download and use the app 📱
- [ ] Business is growing 📈
- [ ] You're celebrating! 🍾

---

<div align="center">

## 🎊 CONGRATULATIONS!

**Your app is live!**

**Pelo Loco Barbershop**

*Where Style Meets Tradition*

✂️💈🚀

</div>

---

**Print this checklist and check off items as you go!**

**Good luck with your launch!** 🍀
