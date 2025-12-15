
# 🔧 App Store Submission Troubleshooting Guide

## Common Issues and Solutions for Pelo Loco Barbershop

---

## 🍎 iOS App Store Issues

### Issue 1: Build Fails with "Provisioning Profile Error"

**Symptoms:**
- Build fails during iOS build process
- Error mentions provisioning profile or certificates

**Solution:**
```bash
# Clear credentials and rebuild
eas credentials
# Select "iOS" → "Remove all credentials"
# Then rebuild
eas build --platform ios --profile production --clear-cache
```

**Alternative:**
- Go to https://developer.apple.com/account/resources/certificates
- Revoke old certificates
- Let EAS create new ones automatically

---

### Issue 2: "Missing Compliance" Error

**Symptoms:**
- App stuck in "Missing Compliance" status
- Can't submit for review

**Solution:**
1. Go to App Store Connect
2. Select your app
3. Go to the version
4. Answer export compliance questions:
   - "Does your app use encryption?" → **No**
   - Or if using HTTPS → **Yes, but exempt**
5. Submit

**Prevention:**
Already set in `app.json`:
```json
"ios": {
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```

---

### Issue 3: "App Rejected - 2.1 Performance: App Completeness"

**Symptoms:**
- App rejected with message about incomplete features
- Reviewer couldn't test all features

**Solution:**
1. Provide demo account credentials:
   - Email: demo@pelolocobarbershop.com
   - Password: Demo123!
2. Add detailed notes for reviewer:
   ```
   Demo Account Credentials:
   Email: demo@pelolocobarbershop.com
   Password: Demo123!
   
   This account has:
   - Sample bookings
   - Sample orders
   - Active coupons
   - Loyalty points
   
   Admin features require admin login (not provided for security).
   All customer features are fully functional.
   ```
3. Resubmit

---

### Issue 4: "App Rejected - 5.1.1 Privacy: Data Collection and Storage"

**Symptoms:**
- Rejected for privacy policy issues
- Privacy policy not accessible

**Solution:**
1. Verify privacy policy URL is publicly accessible
2. Test URL in incognito browser
3. Ensure privacy policy covers:
   - What data is collected (name, email, phone, photos)
   - How data is used (appointments, orders, notifications)
   - How data is stored (Supabase, encrypted)
   - User rights (access, delete, opt-out)
4. Update privacy policy URL in App Store Connect
5. Resubmit

---

### Issue 5: "App Rejected - 4.0 Design"

**Symptoms:**
- Rejected for design issues
- Screenshots don't match app
- UI issues

**Solution:**
1. Ensure screenshots are current and accurate
2. Test app on device shown in screenshots
3. Fix any UI bugs:
   - White text on white background
   - Buttons not accessible
   - Broken layouts
4. Retake screenshots if needed
5. Rebuild and resubmit

---

### Issue 6: "Invalid Binary" or "Processing Failed"

**Symptoms:**
- Build uploads but shows "Invalid Binary"
- Processing never completes

**Solution:**
```bash
# Rebuild with clean cache
eas build --platform ios --profile production --clear-cache

# If still fails, check build logs
eas build:list
# Click on build to see logs
```

**Common causes:**
- Incorrect bundle identifier
- Missing entitlements
- Code signing issues

**Fix:**
1. Verify `app.json` has correct bundle ID: `com.pelolocobarbershop.app`
2. Ensure no special characters in app name
3. Rebuild

---

## 🤖 Google Play Store Issues

### Issue 1: "App Rejected - Privacy Policy"

**Symptoms:**
- Rejected for missing or inaccessible privacy policy

**Solution:**
1. Host privacy policy at public URL
2. Test URL in incognito browser
3. Ensure no login required to view
4. Update URL in Play Console:
   - Store presence → Store listing → Privacy policy
5. Resubmit

---

### Issue 2: "App Rejected - Content Rating"

**Symptoms:**
- Rejected for incomplete content rating

**Solution:**
1. Go to Play Console → Policy → App content
2. Complete content rating questionnaire:
   - Violence: None
   - Sexual content: None
   - Drugs: None
   - Gambling: None
   - Language: None
3. Submit questionnaire
4. Wait for rating (usually instant)
5. Resubmit app

---

### Issue 3: "App Rejected - Data Safety"

**Symptoms:**
- Rejected for incomplete data safety section

**Solution:**
1. Go to Play Console → Policy → App content → Data safety
2. Fill out completely:
   - **Data collected:**
     - Personal info: Name, Email, Phone
     - Photos: Product images (admin only)
     - App activity: Appointments, Orders
   - **Data shared:** None
   - **Data security:**
     - Data encrypted in transit: Yes
     - Data encrypted at rest: Yes
     - Users can request deletion: Yes
3. Save and resubmit

---

### Issue 4: "App Rejected - Target Audience"

**Symptoms:**
- Rejected for unclear target audience

**Solution:**
1. Go to Play Console → Policy → App content → Target audience
2. Set target age: 18+
3. Answer questions:
   - Appeals to children: No
   - Contains ads: No
4. Save and resubmit

---

### Issue 5: Build Upload Fails

**Symptoms:**
- Can't upload AAB file
- Upload fails with error

**Solution:**

**Option 1: Use EAS Submit**
```bash
eas submit --platform android --profile production
```

**Option 2: Manual Upload**
1. Download AAB from EAS dashboard
2. Go to Play Console → Production → Create release
3. Drag and drop AAB file
4. Wait for processing
5. Continue with release

**Option 3: Check Service Account**
1. Verify service account has correct permissions
2. Go to Play Console → Setup → API access
3. Ensure service account has "Admin" role
4. Re-download JSON key if needed

---

### Issue 6: "App Rejected - Deceptive Behavior"

**Symptoms:**
- Rejected for misleading content

**Solution:**
1. Ensure app description matches actual features
2. Remove any exaggerated claims
3. Ensure screenshots show actual app
4. Update store listing if needed
5. Resubmit

---

## 🔨 Build Issues

### Issue 1: "Build Failed - Out of Memory"

**Symptoms:**
- Build fails with memory error
- Build times out

**Solution:**
```bash
# Use larger build instance (if available on your plan)
eas build --platform ios --profile production --resource-class large

# Or clear cache and retry
eas build --platform ios --profile production --clear-cache
```

---

### Issue 2: "Build Failed - Dependency Error"

**Symptoms:**
- Build fails during npm install
- Missing dependencies

**Solution:**
```bash
# Locally, clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Commit changes
git add .
git commit -m "Fix dependencies"

# Rebuild
eas build --platform ios --profile production
```

---

### Issue 3: "Build Failed - TypeScript Error"

**Symptoms:**
- Build fails with TypeScript errors
- Type checking fails

**Solution:**
```bash
# Check TypeScript locally
npx tsc --noEmit

# Fix any errors shown
# Then rebuild
eas build --platform ios --profile production
```

---

### Issue 4: "Build Stuck in Queue"

**Symptoms:**
- Build queued for long time
- No progress

**Solution:**
```bash
# Cancel and restart
eas build:cancel

# Wait a few minutes, then rebuild
eas build --platform ios --profile production
```

---

## 🔐 Authentication Issues

### Issue 1: "EAS Login Failed"

**Symptoms:**
- Can't login to EAS
- Authentication error

**Solution:**
```bash
# Logout and login again
eas logout
eas login

# If still fails, clear credentials
rm -rf ~/.expo
eas login
```

---

### Issue 2: "Apple ID Authentication Failed"

**Symptoms:**
- Can't authenticate with Apple ID during submit
- Two-factor authentication issues

**Solution:**
1. Generate app-specific password:
   - Go to https://appleid.apple.com
   - Sign in
   - Security → App-Specific Passwords
   - Generate new password
2. Use app-specific password instead of regular password
3. Retry submit

---

## 📱 Testing Issues

### Issue 1: "App Crashes on Launch"

**Symptoms:**
- Production build crashes immediately
- Works in development

**Solution:**
1. Check EAS dashboard for crash logs
2. Common causes:
   - Missing environment variables
   - Incorrect Supabase credentials
   - Missing assets
3. Fix and rebuild

**Check Supabase credentials in `lib/supabase.ts`:**
```typescript
const SUPABASE_URL = 'https://tvccqnqsdlzazpcnqqqx.supabase.co';
const SUPABASE_ANON_KEY = 'your-actual-key';
```

---

### Issue 2: "Images Not Loading"

**Symptoms:**
- Product images don't show
- Blank image placeholders

**Solution:**
1. Verify Supabase Storage bucket is public:
   - Go to Supabase Dashboard
   - Storage → product-images
   - Make bucket public
2. Check image URLs in database
3. Test image URL in browser

---

### Issue 3: "Can't Login After Build"

**Symptoms:**
- Login works in development
- Fails in production build

**Solution:**
1. Check Supabase project is not paused
2. Verify Supabase URL and key are correct
3. Check network connectivity
4. Look for errors in console

---

## 🗄️ Database Issues

### Issue 1: "RLS Policy Blocking Access"

**Symptoms:**
- Can't read/write data
- "Row level security policy violation" error

**Solution:**
```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';

-- Example fix for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);
```

---

### Issue 2: "Supabase Connection Timeout"

**Symptoms:**
- App can't connect to Supabase
- Timeout errors

**Solution:**
1. Check Supabase project status
2. Verify project is not paused
3. Check internet connectivity
4. Verify Supabase URL is correct

---

## 📧 Email Issues

### Issue 1: "Email Verification Not Sending"

**Symptoms:**
- Users don't receive verification emails
- Stuck on "verify email" screen

**Solution:**
1. Check Supabase email settings:
   - Go to Supabase Dashboard
   - Authentication → Email Templates
   - Verify "Confirm signup" template is enabled
2. Check spam folder
3. Verify email redirect URL:
   ```typescript
   options: {
     emailRedirectTo: 'https://natively.dev/email-confirmed'
   }
   ```

---

### Issue 2: "Password Reset Not Working"

**Symptoms:**
- Password reset emails not received
- Reset link doesn't work

**Solution:**
1. Check Supabase email templates
2. Verify deep linking is configured in `app.json`:
   ```json
   "scheme": "pelolocobarbershop"
   ```
3. Test reset flow in production build

---

## 🔔 Notification Issues

### Issue 1: "Push Notifications Not Working"

**Symptoms:**
- Notifications not received
- No errors shown

**Solution:**
**Note:** Push notifications require additional setup with Firebase Cloud Messaging (FCM). This is not fully implemented in v1.0.0.

**For future implementation:**
1. Set up Firebase project
2. Add FCM credentials to Expo
3. Implement push notification handling
4. Test on real devices

**Current workaround:**
- Use in-app notifications (already implemented)
- Plan FCM integration for v1.1.0

---

## 💳 Payment Issues

### Issue 1: "Payment Processing Not Working"

**Symptoms:**
- Can't process payments
- Payment buttons don't work

**Solution:**
**Note:** Payment processing (Stripe/Apple Pay) is not fully implemented in v1.0.0.

**Current functionality:**
- Users can select "Pay in person" or "Online"
- Actual payment processing needs to be implemented

**For future implementation:**
1. Integrate Stripe SDK
2. Set up Apple Pay
3. Set up Google Pay
4. Test payment flow

**Current workaround:**
- Use "Pay in person" option
- Process payments manually at shop
- Plan payment integration for v1.1.0

---

## 🆘 Emergency Procedures

### Critical Bug in Production

**If you discover a critical bug after launch:**

1. **Immediate Actions:**
   - Document the bug
   - Determine severity
   - Check how many users affected

2. **Quick Fix:**
   ```bash
   # Fix the bug in code
   # Update version in app.json
   "version": "1.0.1"
   
   # Build new version
   eas build --platform all --profile production
   
   # Submit update
   eas submit --platform all --profile production
   ```

3. **Communication:**
   - Respond to affected users
   - Post update in app store description
   - Send notification when fixed

4. **Prevention:**
   - Add to testing checklist
   - Document the issue
   - Implement better error handling

---

### App Store Removal Request

**If you need to remove app from stores:**

**iOS:**
1. Go to App Store Connect
2. Select app
3. Pricing and Availability
4. Remove from sale
5. Or delete app entirely

**Android:**
1. Go to Play Console
2. Select app
3. Production → Manage
4. Unpublish app
5. Or delete app entirely

---

## 📞 Getting Help

### When to Contact Support

**Contact Expo Support if:**
- Build fails repeatedly
- Can't login to EAS
- Billing issues
- Technical EAS issues

**Contact Apple Support if:**
- App stuck in review > 7 days
- Rejection reason unclear
- Account issues
- Payment issues

**Contact Google Support if:**
- App stuck in review > 14 days
- Rejection reason unclear
- Account suspended
- Policy questions

### Support Channels

**Expo:**
- Forums: https://forums.expo.dev
- Discord: https://chat.expo.dev
- Email: support@expo.dev

**Apple:**
- Developer Support: https://developer.apple.com/support/
- Phone: 1-800-633-2152 (US)

**Google:**
- Play Console Help: https://support.google.com/googleplay/android-developer
- Community: https://www.reddit.com/r/androiddev

**Supabase:**
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase/discussions
- Email: support@supabase.com

---

## ✅ Prevention Checklist

### Before Every Build
- [ ] All code committed and pushed
- [ ] Dependencies updated
- [ ] TypeScript compiles without errors
- [ ] No console errors in development
- [ ] Tested on real devices
- [ ] Version number updated

### Before Every Submission
- [ ] All features tested
- [ ] Demo account works
- [ ] Privacy policy accessible
- [ ] Screenshots current
- [ ] Store listing complete
- [ ] Contact information correct

---

## 📝 Issue Log Template

When you encounter an issue, document it:

**Issue:** _______________________________________  
**Date:** ___/___/______  
**Platform:** iOS / Android / Both  
**Severity:** Critical / High / Medium / Low  
**Description:** _________________________________  
**Steps to Reproduce:** _________________________  
**Solution:** ____________________________________  
**Prevention:** __________________________________  
**Status:** Open / In Progress / Resolved

---

## 🎓 Learning Resources

### Expo Documentation
- Build: https://docs.expo.dev/build/introduction/
- Submit: https://docs.expo.dev/submit/introduction/
- Troubleshooting: https://docs.expo.dev/build-reference/troubleshooting/

### App Store Guidelines
- iOS: https://developer.apple.com/app-store/review/guidelines/
- Android: https://play.google.com/about/developer-content-policy/

### Community Resources
- Expo Forums: https://forums.expo.dev
- Stack Overflow: Tag with `expo`, `react-native`
- Reddit: r/reactnative, r/expo

---

## 🎉 Success Tips

1. **Stay Calm**: Most issues have simple solutions
2. **Read Carefully**: Rejection reasons usually explain the fix
3. **Test Thoroughly**: Test before every submission
4. **Document Everything**: Keep notes on issues and solutions
5. **Ask for Help**: Community is friendly and helpful
6. **Be Patient**: Review process takes time
7. **Learn from Rejections**: Each rejection makes you better

---

**Remember:** Almost every app gets rejected at least once. It's part of the process. Don't get discouraged!

**Good luck!** 🚀✂️💈
