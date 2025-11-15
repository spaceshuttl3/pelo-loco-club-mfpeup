
# Supabase Redirect URL Configuration

## ⚠️ IMPORTANT: Required Configuration

For the password reset feature to work correctly, you **MUST** configure the redirect URLs in your Supabase dashboard.

## Step-by-Step Instructions

### 1. Access Your Supabase Dashboard

Go to: https://supabase.com/dashboard/project/tvccqnqsdlzazpcnqqqx/auth/url-configuration

Or manually navigate:
1. Go to https://supabase.com/dashboard
2. Select your project: "Pelo Loco Club" (ID: tvccqnqsdlzazpcnqqqx)
3. Click on "Authentication" in the left sidebar
4. Click on "URL Configuration"

### 2. Add Redirect URLs

In the "Redirect URLs" section, add the following URLs (one per line):

```
https://natively.dev/email-confirmed
pelolococlub://reset-password
```

**Screenshot Guide**:
- Look for the section labeled "Redirect URLs"
- There should be a text area where you can add multiple URLs
- Add each URL on a new line
- Make sure there are no extra spaces or typos

### 3. Save Configuration

Click the "Save" button at the bottom of the page.

### 4. Verify Configuration

After saving, you should see both URLs listed in the "Redirect URLs" section.

## Why This Is Needed

When a user requests a password reset:
1. Supabase sends an email with a reset link
2. The link includes the `redirectTo` parameter we specified in the code
3. Supabase checks if this URL is in the allowed list
4. If it's not allowed, the link won't work properly
5. If it is allowed, the user is redirected to that URL with authentication tokens

## What Each URL Does

### `https://natively.dev/email-confirmed`
- This is Natively's infrastructure URL
- It handles the authentication tokens from Supabase
- It then redirects to your app using the deep link scheme

### `pelolococlub://reset-password`
- This is your app's deep link scheme
- It allows direct deep linking into your app
- The app's deep link handler (in `app/_layout.tsx`) catches this and sets the session

## Testing After Configuration

1. **Test Password Reset**:
   ```
   1. Open the app
   2. Go to login screen
   3. Tap "Forgot Password?"
   4. Enter: emanuelederosa95@gmail.com
   5. Check email for reset link
   6. Click the link
   7. Should open the app's reset password screen
   8. Enter new password: "test123456"
   9. Confirm password: "test123456"
   10. Should redirect to login screen
   11. Try logging in with new password
   ```

2. **If It Doesn't Work**:
   - Check that the URLs are exactly as shown above (no typos)
   - Check that you clicked "Save" in the Supabase dashboard
   - Check the app logs for any error messages
   - Try clearing the app cache and restarting

## Additional Configuration (Optional)

### Email Template Customization

You can customize the password reset email:
1. Go to Authentication > Email Templates
2. Select "Reset Password"
3. Customize the subject and body
4. Make sure to keep the `{{ .ConfirmationURL }}` variable in the template
5. Save changes

### Site URL Configuration

Make sure your Site URL is set correctly:
1. In the same URL Configuration page
2. Look for "Site URL"
3. It should be set to your app's URL or `pelolococlub://`

## Troubleshooting

### Problem: "Invalid redirect URL" error
**Solution**: Make sure the URLs are added exactly as shown, with no extra spaces

### Problem: Email link doesn't open the app
**Solution**: 
- Check that the deep link scheme is configured in `app.json` (already done)
- Make sure the app is installed on the device
- Try clicking the link from the device's email app (not desktop)

### Problem: Reset password screen shows "Link Non Valido"
**Solution**: 
- The link may have expired (links expire after 1 hour by default)
- Request a new password reset link
- You can change the expiration time in Supabase settings

## Support

If you continue to have issues after following these steps:
1. Check the console logs in the app for error messages
2. Check the Supabase logs in the dashboard
3. Verify that the email was sent (check spam folder)
4. Make sure you're using the latest version of the app

## Summary Checklist

- [ ] Accessed Supabase dashboard URL configuration
- [ ] Added `https://natively.dev/email-confirmed` to Redirect URLs
- [ ] Added `pelolococlub://reset-password` to Redirect URLs
- [ ] Clicked "Save"
- [ ] Verified both URLs appear in the list
- [ ] Tested password reset flow
- [ ] Password reset works successfully

Once all items are checked, the password reset feature should be fully functional! ✅
