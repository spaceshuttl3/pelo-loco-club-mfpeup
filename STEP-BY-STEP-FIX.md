
# Step-by-Step Fix Instructions

Follow these steps in order to fix the email spam and password reset issues.

## Step 1: Update App Configuration (DONE ✅)

The following files have been updated:
- ✅ `app.json` - Fixed scheme configuration
- ✅ `app/_layout.tsx` - Improved deep link handling
- ✅ `app/auth/reset-password.tsx` - Better session verification

**Action Required:** Rebuild your app to apply these changes.

## Step 2: Update Supabase Redirect URLs

1. Go to https://supabase.com/dashboard
2. Select your project: `tvccqnqsdlzazpcnqqqx`
3. Navigate to **Authentication** → **URL Configuration**
4. Update the following:

**Site URL:**
```
pelolocobarbershop://
```

**Redirect URLs (replace existing ones):**
```
pelolocobarbershop://reset-password
pelolocobarbershop://confirm
https://natively.dev/email-confirmed
```

5. Click **Save**

⚠️ **Remove these incorrect URLs if they exist:**
- `pelolococlub://reset-password`
- Any URLs with spaces or wrong schemes

## Step 3: Configure Resend Domain

### 3.1 Add Domain to Resend

1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter: `pelolocobarbershop.online`
4. Click **Add**

### 3.2 Get DNS Records from Resend

Resend will show you DNS records to add. They will look like:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Record:**
```
Type: TXT
Name: resend._domainkey
Value: [Resend will provide this - copy it exactly]
```

### 3.3 Add DNS Records

Go to your domain registrar (where you bought pelolocobarbershop.online):

1. Find DNS settings / DNS management
2. Add the SPF record:
   - Type: `TXT`
   - Name: `@`
   - Value: `v=spf1 include:_spf.resend.com ~all`
   - TTL: `3600`

3. Add the DKIM record:
   - Type: `TXT`
   - Name: `resend._domainkey`
   - Value: [Copy from Resend]
   - TTL: `3600`

4. Add DMARC record:
   - Type: `TXT`
   - Name: `_dmarc`
   - Value: `v=DMARC1; p=none; rua=mailto:dmarc@pelolocobarbershop.online`
   - TTL: `3600`

5. Save all changes

### 3.4 Verify Domain in Resend

1. Go back to Resend Dashboard → Domains
2. Click on `pelolocobarbershop.online`
3. Click **Verify Domain**
4. Wait for verification (usually 1-2 hours, max 48 hours)
5. Status should show "Verified" ✅

## Step 4: Get Resend API Key

1. Go to https://resend.com/api-keys
2. Click **Create API Key**
3. Name: `Pelo Loco Barbershop - Supabase`
4. Permission: **Sending access**
5. Click **Create**
6. **Copy the API key** (you won't see it again!)

## Step 5: Configure Supabase SMTP

1. Go to Supabase Dashboard
2. Navigate to **Project Settings** → **Auth** → **SMTP Settings**
3. Enable **Custom SMTP**
4. Fill in:

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Paste your Resend API Key from Step 4]

Sender email: noreply@pelolocobarbershop.online
Sender name: Pelo Loco Barbershop

Enable TLS: ✅ ON
```

5. Click **Save**

## Step 6: Update Email Templates

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**

### Update "Confirm signup" template:

**Subject:**
```
Conferma il tuo account - Pelo Loco Barbershop
```

**Body:** (Copy from SUPABASE-EMAIL-CONFIG.md)

### Update "Reset password" template:

**Subject:**
```
Reimposta la tua password - Pelo Loco Barbershop
```

**Body:** (Copy from SUPABASE-EMAIL-CONFIG.md)

3. Click **Save** for each template

## Step 7: Test the Configuration

### Test 1: Password Reset Flow

1. Open your app
2. Tap "Forgot Password"
3. Enter your email
4. Check your email inbox (and spam folder)
5. You should receive an email from "Pelo Loco Barbershop <noreply@pelolocobarbershop.online>"
6. Click the "Reimposta Password" button
7. The app should open and show the reset password screen
8. Enter a new password
9. You should be redirected to login

**Expected Result:** ✅ Email arrives in inbox, link works, password resets successfully

### Test 2: New User Signup

1. Create a new test account
2. Check email for confirmation
3. Click confirmation link
4. Should be able to login

**Expected Result:** ✅ Email arrives in inbox, confirmation works

### Test 3: Check Multiple Email Providers

Send test emails to:
- Gmail account
- Yahoo account
- Outlook account

**Expected Result:** ✅ All emails arrive in inbox (not spam)

## Step 8: Monitor and Verify

### Check DNS Propagation

Use these tools to verify your DNS records are working:

1. **SPF Check:** https://mxtoolbox.com/spf.aspx
   - Enter: `pelolocobarbershop.online`
   - Should show: `v=spf1 include:_spf.resend.com ~all`

2. **DKIM Check:** https://mxtoolbox.com/dkim.aspx
   - Enter: `resend._domainkey.pelolocobarbershop.online`
   - Should show: Your DKIM record

3. **DMARC Check:** https://mxtoolbox.com/dmarc.aspx
   - Enter: `pelolocobarbershop.online`
   - Should show: `v=DMARC1; p=none; rua=mailto:dmarc@pelolocobarbershop.online`

### Check Resend Dashboard

1. Go to Resend Dashboard → Emails
2. You should see your test emails
3. Check delivery status
4. Look for any errors or bounces

### Check Supabase Logs

1. Go to Supabase Dashboard → Logs
2. Filter by "auth" service
3. Look for email sending events
4. Check for any errors

## Troubleshooting

### Issue: DNS records not showing up

**Solution:**
- Wait 1-2 hours for DNS propagation
- Check you added records to the correct domain
- Verify record values are exact (no extra spaces)
- Try using a different DNS checker tool

### Issue: Resend domain not verifying

**Solution:**
- Wait up to 48 hours
- Double-check DNS records match exactly
- Contact Resend support if still not working after 48 hours

### Issue: Emails still going to spam

**Solution:**
- Verify all DNS records are correct and verified
- Wait 24-48 hours for domain reputation to build
- Ask test recipients to mark as "Not Spam"
- Check email content doesn't trigger spam filters
- Gradually increase sending volume

### Issue: Password reset link still not working

**Solution:**
- Verify Supabase redirect URLs are exactly: `pelolocobarbershop://reset-password`
- Rebuild your app after changing app.json
- Clear app cache and reinstall
- Check console logs for errors
- Try clicking the link multiple times (the fix handles this now)

### Issue: App still stuck on loading

**Solution:**
- Check app console logs for errors
- Verify session is being set (check logs)
- Clear app data and reinstall
- Make sure you rebuilt the app with the new code

## Timeline

- **Immediate:** App configuration changes (rebuild required)
- **1-2 hours:** DNS propagation (usually)
- **24-48 hours:** Full DNS propagation (maximum)
- **1-7 days:** Domain reputation builds up

## Success Criteria

You'll know everything is working when:

- ✅ Emails arrive in inbox (not spam)
- ✅ Sender shows as "Pelo Loco Barbershop"
- ✅ Password reset link opens the app
- ✅ Reset password screen appears
- ✅ Password can be changed successfully
- ✅ User is redirected to login
- ✅ Can login with new password

## Need Help?

If you're stuck on any step:

1. Check the console logs in your app
2. Check Supabase logs for errors
3. Check Resend dashboard for delivery issues
4. Verify all DNS records are correct
5. Make sure you rebuilt the app after code changes

## Checklist

Use this checklist to track your progress:

- [ ] Step 1: Rebuild app with new code
- [ ] Step 2: Update Supabase redirect URLs
- [ ] Step 3: Add domain to Resend
- [ ] Step 4: Add DNS records to domain
- [ ] Step 5: Verify domain in Resend
- [ ] Step 6: Get Resend API key
- [ ] Step 7: Configure Supabase SMTP
- [ ] Step 8: Update email templates
- [ ] Step 9: Test password reset flow
- [ ] Step 10: Test new user signup
- [ ] Step 11: Test on multiple email providers
- [ ] Step 12: Verify DNS propagation
- [ ] Step 13: Monitor Resend dashboard
- [ ] Step 14: Check Supabase logs

---

**Good luck! The fixes are in place, now you just need to configure Supabase and Resend following these steps.**
