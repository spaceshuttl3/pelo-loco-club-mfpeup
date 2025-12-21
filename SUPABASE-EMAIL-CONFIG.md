
# Supabase Email Configuration - Quick Reference

## Project Details
- **Project ID:** tvccqnqsdlzazpcnqqqx
- **Project URL:** https://tvccqnqsdlzazpcnqqqx.supabase.co
- **Domain:** pelolocobarbershop.online

## Authentication Settings

### URL Configuration

Navigate to: **Supabase Dashboard → Authentication → URL Configuration**

**Site URL:**
```
pelolocobarbershop://
```

**Redirect URLs:**
```
pelolocobarbershop://reset-password
pelolocobarbershop://confirm
https://natively.dev/email-confirmed
```

### SMTP Settings

Navigate to: **Supabase Dashboard → Project Settings → Auth → SMTP Settings**

```
Enable Custom SMTP: ✅ ON

Host: smtp.resend.com
Port: 587
Username: resend
Password: [Your Resend API Key - get from Resend Dashboard]

Sender email: noreply@pelolocobarbershop.online
Sender name: Pelo Loco Barbershop

Enable TLS: ✅ ON
```

### Email Templates

Navigate to: **Supabase Dashboard → Authentication → Email Templates**

#### Confirm Signup Template

**Subject:** `Conferma il tuo account - Pelo Loco Barbershop`

**Body:**
```html
<h2>Benvenuto in Pelo Loco Barbershop!</h2>
<p>Ciao,</p>
<p>Grazie per esserti registrato. Clicca sul pulsante qui sotto per confermare il tuo indirizzo email:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Conferma Email</a></p>
<p>Se non hai creato un account, puoi ignorare questa email.</p>
<p>Questo link scadrà tra 24 ore.</p>
<br>
<p>Cordiali saluti,<br>Il Team di Pelo Loco Barbershop</p>
<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
<p style="font-size: 12px; color: #666;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>{{ .ConfirmationURL }}</p>
```

#### Reset Password Template

**Subject:** `Reimposta la tua password - Pelo Loco Barbershop`

**Body:**
```html
<h2>Reimposta la tua password</h2>
<p>Ciao,</p>
<p>Hai richiesto di reimpostare la password per il tuo account Pelo Loco Barbershop.</p>
<p>Clicca sul pulsante qui sotto per reimpostare la tua password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Reimposta Password</a></p>
<p>Se non hai richiesto questa modifica, puoi ignorare questa email in sicurezza.</p>
<p>Questo link scadrà tra 1 ora.</p>
<br>
<p>Cordiali saluti,<br>Il Team di Pelo Loco Barbershop</p>
<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
<p style="font-size: 12px; color: #666;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>{{ .ConfirmationURL }}</p>
```

#### Magic Link Template

**Subject:** `Il tuo link di accesso - Pelo Loco Barbershop`

**Body:**
```html
<h2>Accedi al tuo account</h2>
<p>Ciao,</p>
<p>Clicca sul pulsante qui sotto per accedere al tuo account Pelo Loco Barbershop:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Accedi</a></p>
<p>Se non hai richiesto questo link, puoi ignorare questa email.</p>
<p>Questo link scadrà tra 1 ora.</p>
<br>
<p>Cordiali saluti,<br>Il Team di Pelo Loco Barbershop</p>
<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
<p style="font-size: 12px; color: #666;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>{{ .ConfirmationURL }}</p>
```

#### Change Email Template

**Subject:** `Conferma il cambio email - Pelo Loco Barbershop`

**Body:**
```html
<h2>Conferma il cambio email</h2>
<p>Ciao,</p>
<p>Hai richiesto di cambiare l'indirizzo email del tuo account Pelo Loco Barbershop.</p>
<p>Clicca sul pulsante qui sotto per confermare il nuovo indirizzo email:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Conferma Cambio Email</a></p>
<p>Se non hai richiesto questa modifica, contattaci immediatamente.</p>
<p>Questo link scadrà tra 24 ore.</p>
<br>
<p>Cordiali saluti,<br>Il Team di Pelo Loco Barbershop</p>
<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
<p style="font-size: 12px; color: #666;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>{{ .ConfirmationURL }}</p>
```

## DNS Records for pelolocobarbershop.online

Add these records to your domain DNS settings:

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

### DKIM Record
```
Type: TXT
Name: resend._domainkey
Value: [Get this from Resend Dashboard → Domains → pelolocobarbershop.online]
TTL: 3600
```

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@pelolocobarbershop.online
TTL: 3600
```

## Resend Configuration

### API Key
1. Go to Resend Dashboard → API Keys
2. Create a new API key with "Sending access"
3. Copy the key and use it in Supabase SMTP password

### Domain Verification
1. Go to Resend Dashboard → Domains
2. Add domain: `pelolocobarbershop.online`
3. Add the DNS records provided by Resend
4. Wait for verification (usually 1-2 hours)
5. Status should show "Verified" with green checkmark

### Sender Email
Use one of these professional sender emails:
- `noreply@pelolocobarbershop.online` (recommended)
- `info@pelolocobarbershop.online`
- `support@pelolocobarbershop.online`
- `hello@pelolocobarbershop.online`

## Testing Checklist

### 1. Test Password Reset
```bash
1. Open app
2. Tap "Forgot Password"
3. Enter email
4. Check email inbox
5. Click reset link
6. App should open to reset password screen
7. Enter new password
8. Should redirect to login
```

### 2. Test Email Confirmation
```bash
1. Create new account
2. Check email inbox
3. Click confirmation link
4. App should open
5. Should be able to login
```

### 3. Verify DNS Records
```bash
# Check SPF
nslookup -type=TXT pelolocobarbershop.online

# Check DKIM
nslookup -type=TXT resend._domainkey.pelolocobarbershop.online

# Check DMARC
nslookup -type=TXT _dmarc.pelolocobarbershop.online
```

### 4. Test Email Deliverability
Send test emails to:
- [ ] Gmail
- [ ] Yahoo
- [ ] Outlook
- [ ] Apple Mail
- [ ] ProtonMail

Check that emails:
- [ ] Arrive in inbox (not spam)
- [ ] Show correct sender name
- [ ] Have proper formatting
- [ ] Links work correctly

## Troubleshooting

### Emails going to spam
1. Verify all DNS records are added correctly
2. Wait 24-48 hours for DNS propagation
3. Check domain reputation
4. Warm up domain by sending gradually
5. Ask recipients to mark as "Not Spam"

### Password reset link not working
1. Verify redirect URL: `pelolocobarbershop://reset-password`
2. Check app.json scheme: `"scheme": "pelolocobarbershop"`
3. Rebuild app after changes
4. Clear app cache

### App stuck on loading
1. Check console logs
2. Verify session is set
3. Try clicking link again
4. Reinstall app

## Important Notes

⚠️ **After changing any settings:**
1. Save changes in Supabase
2. Wait a few minutes for changes to propagate
3. Test with a real email
4. Check Supabase logs for errors

⚠️ **DNS Changes:**
- Can take up to 48 hours to propagate
- Usually takes 1-2 hours
- Use DNS checker tools to verify

⚠️ **App Changes:**
- Rebuild app after changing app.json
- Clear app cache after updates
- Test on both iOS and Android

---

**Last Updated:** December 2024
