
# Email Spam Fix Guide for Pelo Loco Barbershop

## Issues Identified

1. **Emails going to spam** - Domain authentication not properly configured
2. **Password reset link not working** - Incorrect redirect URL scheme
3. **App stuck on loading** - Deep link navigation issue

## Fixes Applied

### 1. App Configuration Fixed

✅ **app.json** - Removed duplicate scheme definition
- Changed from having both `"scheme": "pelolocobarbershop"` and `"scheme": "Pelo Loco Club"`
- Now only uses: `"scheme": "pelolocobarbershop"`

✅ **Deep Link Handler** - Improved navigation
- Added proper error handling
- Added delay to ensure session is set before navigation
- Added detailed logging for debugging

✅ **Reset Password Screen** - Better session verification
- Added delay before checking session
- Improved error messages
- Signs out user after password reset to force fresh login

## Required Supabase Configuration

### Update Redirect URLs in Supabase

Go to your Supabase Dashboard → Authentication → URL Configuration and set:

**Site URL:**
```
pelolocobarbershop://
```

**Redirect URLs (add both):**
```
pelolocobarbershop://reset-password
pelolocobarbershop://confirm
```

⚠️ **IMPORTANT**: Remove the old incorrect URLs:
- ❌ `pelolococlub://reset-password` (wrong scheme)
- ❌ Any URLs with spaces or incorrect schemes

## Email Spam Prevention

### 1. Configure SPF Record

Add this TXT record to your DNS for `pelolocobarbershop.online`:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

### 2. Configure DKIM Record

Resend should provide you with a DKIM record. It will look like:

```
Type: TXT
Name: resend._domainkey
Value: [Resend will provide this value]
TTL: 3600
```

To get your DKIM record:
1. Go to Resend Dashboard
2. Navigate to Domains
3. Click on `pelolocobarbershop.online`
4. Copy the DKIM record and add it to your DNS

### 3. Configure DMARC Record

Add this TXT record to your DNS:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@pelolocobarbershop.online
TTL: 3600
```

### 4. Verify Domain in Resend

1. Go to Resend Dashboard → Domains
2. Click on `pelolocobarbershop.online`
3. Click "Verify Domain"
4. Wait for DNS propagation (can take up to 48 hours, usually 1-2 hours)

### 5. Update Supabase SMTP Settings

In Supabase Dashboard → Project Settings → Auth → SMTP Settings:

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Your Resend API Key]
Sender email: noreply@pelolocobarbershop.online
Sender name: Pelo Loco Barbershop
```

⚠️ **IMPORTANT**: Use a professional sender email like:
- `noreply@pelolocobarbershop.online`
- `info@pelolocobarbershop.online`
- `support@pelolocobarbershop.online`

Do NOT use personal emails like Gmail or Yahoo.

### 6. Customize Email Templates

In Supabase Dashboard → Authentication → Email Templates:

**Password Reset Email:**
```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>You requested to reset your password for Pelo Loco Barbershop.</p>
<p>Click the button below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link will expire in 1 hour.</p>
<br>
<p>Best regards,<br>Pelo Loco Barbershop Team</p>
```

**Confirmation Email:**
```html
<h2>Confirm Your Email</h2>
<p>Hi {{ .Name }},</p>
<p>Welcome to Pelo Loco Barbershop!</p>
<p>Click the button below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Confirm Email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
<br>
<p>Best regards,<br>Pelo Loco Barbershop Team</p>
```

## Testing the Fixes

### Test Password Reset Flow

1. Open the app
2. Go to "Forgot Password"
3. Enter your email
4. Check your email (including spam folder)
5. Click the reset link
6. The app should open and show the reset password screen
7. Enter new password
8. You should be redirected to login

### Test Email Delivery

1. Send a test password reset email
2. Check these email providers:
   - Gmail
   - Yahoo
   - Outlook
   - Apple Mail

3. Verify the email:
   - ✅ Arrives in inbox (not spam)
   - ✅ Shows correct sender name
   - ✅ Has proper formatting
   - ✅ Link works correctly

### Check DNS Propagation

Use these tools to verify your DNS records:
- https://mxtoolbox.com/spf.aspx
- https://mxtoolbox.com/dkim.aspx
- https://mxtoolbox.com/dmarc.aspx

## Common Issues and Solutions

### Issue: Emails still going to spam

**Solutions:**
1. Wait 24-48 hours for DNS propagation
2. Verify all DNS records are correct
3. Check domain reputation at https://www.senderscore.org/
4. Warm up your domain by sending emails gradually
5. Ask recipients to mark emails as "Not Spam"

### Issue: Password reset link shows "page doesn't exist"

**Solutions:**
1. Verify redirect URLs in Supabase match exactly: `pelolocobarbershop://reset-password`
2. Check app.json has correct scheme: `"scheme": "pelolocobarbershop"`
3. Rebuild the app after changing app.json
4. Clear app cache and reinstall

### Issue: App stuck on loading after clicking link

**Solutions:**
1. Check console logs for errors
2. Verify session is being set correctly
3. Try clicking the link again (the fix now handles this)
4. Clear app data and try again

## Monitoring Email Deliverability

### Resend Dashboard

Monitor your email sending in Resend:
1. Go to Resend Dashboard → Emails
2. Check delivery status
3. Look for bounces or complaints
4. Review open rates

### Supabase Logs

Check Supabase logs for email sending:
1. Go to Supabase Dashboard → Logs
2. Filter by "auth" service
3. Look for email sending events
4. Check for errors

## Best Practices

1. **Always use your custom domain** for sending emails
2. **Keep email content professional** and avoid spam triggers
3. **Include unsubscribe links** for marketing emails
4. **Monitor bounce rates** and remove invalid emails
5. **Gradually increase sending volume** to build reputation
6. **Use consistent sender name and email**
7. **Test emails before sending to all users**

## Support

If issues persist:
1. Check Resend documentation: https://resend.com/docs
2. Check Supabase auth docs: https://supabase.com/docs/guides/auth
3. Contact Resend support with your domain details
4. Check app logs for detailed error messages

## Checklist

- [ ] Updated app.json with correct scheme
- [ ] Updated Supabase redirect URLs
- [ ] Added SPF record to DNS
- [ ] Added DKIM record to DNS
- [ ] Added DMARC record to DNS
- [ ] Verified domain in Resend
- [ ] Updated SMTP settings in Supabase
- [ ] Customized email templates
- [ ] Tested password reset flow
- [ ] Verified emails arrive in inbox
- [ ] Checked DNS propagation
- [ ] Monitored email deliverability

---

**Last Updated:** December 2024
**App Version:** 3.0.2
