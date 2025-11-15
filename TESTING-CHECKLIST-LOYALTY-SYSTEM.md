
# Testing Checklist - Loyalty & Rewards System

## Pre-Testing Setup
- [ ] Supabase database migrations applied
- [ ] Database triggers active
- [ ] RLS policies configured
- [ ] Sample rewards created
- [ ] Sample badge rules created
- [ ] Test customer account created
- [ ] Test admin account created

## 1. Loyalty Points System

### Automatic Point Award
- [ ] Create new appointment as customer
- [ ] Admin marks appointment as "completed"
- [ ] Verify 1 point added to customer account
- [ ] Check transaction logged in loyalty_transactions table
- [ ] Verify points display in customer profile
- [ ] Verify points display in rewards page

### Point Display
- [ ] Customer profile shows correct point count
- [ ] Rewards page shows correct point count
- [ ] Point count updates in real-time after earning
- [ ] Large point icon visible and attractive

### Transaction History
- [ ] Recent transactions visible in rewards page
- [ ] Transaction shows correct description
- [ ] Transaction shows correct date/time
- [ ] Positive points shown in green
- [ ] Negative points (redeemed) shown in red

## 2. Rewards System

### Admin - Create Reward
- [ ] Navigate to Premi & Traguardi (admin)
- [ ] Click + to create new reward
- [ ] Enter points required (e.g., 5)
- [ ] Select reward type (discount_percentage)
- [ ] Enter reward value (e.g., 10)
- [ ] Enter description
- [ ] Save successfully
- [ ] Reward appears in list

### Admin - Edit Reward
- [ ] Click "Modifica" on existing reward
- [ ] Change points required
- [ ] Change reward value
- [ ] Change description
- [ ] Save successfully
- [ ] Changes reflected in list

### Admin - Delete Reward
- [ ] Click "Elimina" on reward
- [ ] Confirm deletion
- [ ] Reward removed from list
- [ ] Reward no longer visible to customers

### Customer - View Rewards
- [ ] Navigate to Premi & Traguardi
- [ ] See list of available rewards
- [ ] Rewards sorted by points required
- [ ] Can see which rewards are redeemable
- [ ] Can see which rewards need more points

### Customer - Redeem Reward
- [ ] Have enough points for a reward
- [ ] Click "Riscatta" on reward
- [ ] Confirm redemption
- [ ] Points deducted correctly
- [ ] Transaction logged
- [ ] Success message shown
- [ ] Reward confirmation visible

### Customer - Insufficient Points
- [ ] Try to redeem reward without enough points
- [ ] See "Punti Insufficienti" message
- [ ] Points not deducted
- [ ] No transaction logged

### Progress to Next Reward
- [ ] Progress bar visible
- [ ] Shows current points / required points
- [ ] Progress percentage correct
- [ ] Next reward description shown
- [ ] "Ancora X punti" message correct

## 3. Badge System

### Admin - Create Badge Rule
- [ ] Navigate to Premi & Traguardi (admin)
- [ ] Scroll to Traguardi section
- [ ] Click + to create new badge
- [ ] Enter badge name
- [ ] Enter description
- [ ] Choose icon
- [ ] Select rule type (visits_count)
- [ ] Enter required visits (e.g., 3)
- [ ] Save successfully
- [ ] Badge rule appears in list

### Admin - Edit Badge Rule
- [ ] Click "Modifica" on badge rule
- [ ] Change badge name
- [ ] Change description
- [ ] Change icon
- [ ] Change rule parameters
- [ ] Save successfully
- [ ] Changes reflected in list

### Admin - Delete Badge Rule
- [ ] Click "Elimina" on badge rule
- [ ] Confirm deletion
- [ ] Badge rule removed from list
- [ ] Existing badges not removed from users

### Badge Award - Visits Count
- [ ] Create badge rule: 3 visits
- [ ] Complete 1 appointment (no badge)
- [ ] Complete 2 appointments (no badge)
- [ ] Complete 3 appointments (badge awarded!)
- [ ] Badge appears in customer rewards page
- [ ] Badge shows correct icon
- [ ] Badge shows earned date

### Badge Award - Visits in Timeframe
- [ ] Create badge rule: 3 visits in 60 days
- [ ] Complete 3 appointments within 60 days
- [ ] Badge awarded automatically
- [ ] Badge visible in customer profile

### Badge Award - Total Spent
- [ ] Create badge rule: €100 spent
- [ ] Complete appointments totaling €100+
- [ ] Badge awarded automatically
- [ ] Badge visible in customer profile

### Customer - View Badges
- [ ] Navigate to Premi & Traguardi
- [ ] Scroll to Traguardi Raggiunti
- [ ] See earned badges in grid
- [ ] Each badge shows icon
- [ ] Each badge shows name
- [ ] Each badge shows description
- [ ] Each badge shows earned date

### Customer - No Badges Yet
- [ ] New customer with no badges
- [ ] See "Nessun traguardo raggiunto ancora" message
- [ ] Encouraging message to continue booking

## 4. Birthday Notifications

### Admin - View Birthdays
- [ ] Navigate to Compleanni
- [ ] See list of upcoming birthdays (30 days)
- [ ] Birthdays sorted by days until
- [ ] "Oggi" badge for today's birthdays
- [ ] "Presto" badge for birthdays within 7 days
- [ ] Customer details visible (name, email, phone)

### Admin - Send Custom Notification
- [ ] Click "Invia Notifica Personalizzata"
- [ ] See pre-filled birthday message
- [ ] Customize title
- [ ] Customize message
- [ ] Click "Invia Notifica"
- [ ] Success message shown
- [ ] Notification logged in database

### Admin - No Coupons Created
- [ ] Send birthday notification
- [ ] Verify NO coupon created in coupons table
- [ ] Only notification created

### Customer - Receive Birthday Notification
- [ ] Check custom_notifications table
- [ ] Notification exists for customer
- [ ] Notification has correct title
- [ ] Notification has correct message
- [ ] Notification type is "birthday"

## 5. Appointment Booking UI

### Time Slot Filtering
- [ ] Book appointment for today
- [ ] Current time is 10:00 AM
- [ ] Verify 9:00 AM slot NOT visible
- [ ] Verify 9:30 AM slot NOT visible
- [ ] Verify 10:00 AM slot NOT visible (if past)
- [ ] Verify 10:30 AM slot visible (if future)
- [ ] Verify 11:00 AM slot visible
- [ ] All future slots visible

### Time Slot Design
- [ ] Time slots in 4-column grid
- [ ] Compact spacing
- [ ] Liquid glass effect visible
- [ ] Selected slot highlighted
- [ ] Unavailable slots grayed out
- [ ] "Occupato" label on unavailable slots
- [ ] Touch feedback on tap

### Date Selection
- [ ] Date picker modal opens
- [ ] Spinner-style date picker
- [ ] Can select future dates
- [ ] Cannot select past dates
- [ ] "Conferma" button works
- [ ] Selected date displayed correctly

### Today Indicator
- [ ] Booking for today shows special indicator
- [ ] "⭐ Prenotazioni per oggi disponibili!" message
- [ ] Indicator has glass effect
- [ ] Indicator stands out visually

## 6. Password Reset

### Request Reset
- [ ] Navigate to login screen
- [ ] Click "Forgot Password"
- [ ] Enter email address
- [ ] Click "Invia Link di Reset"
- [ ] Success message shown
- [ ] Email received

### Reset Email
- [ ] Email contains reset link
- [ ] Link format: pelolococlub://reset-password?...
- [ ] Link expires in 24 hours
- [ ] Email template looks professional

### Deep Link
- [ ] Click reset link in email
- [ ] App opens automatically
- [ ] Navigates to reset-password screen
- [ ] Session detected correctly

### Reset Password
- [ ] Enter new password (6+ characters)
- [ ] Enter confirmation password
- [ ] Passwords match
- [ ] Click "Aggiorna Password"
- [ ] Success message shown
- [ ] Redirected to login

### Login with New Password
- [ ] Enter email
- [ ] Enter new password
- [ ] Login successful
- [ ] Redirected to appropriate dashboard

### Error Cases
- [ ] Passwords don't match → Error shown
- [ ] Password too short → Error shown
- [ ] Expired link → Error shown, redirect to forgot-password
- [ ] Invalid link → Error shown, redirect to forgot-password

## 7. Key Prop Warnings

### Check Console
- [ ] Open React Native debugger
- [ ] Navigate through all screens
- [ ] No "key prop" warnings in console
- [ ] No "unique key" warnings in console

### Specific Screens to Check
- [ ] Customer home screen
- [ ] Book appointment screen (services list)
- [ ] Book appointment screen (barbers list)
- [ ] Book appointment screen (time slots)
- [ ] Bookings screen (appointments list)
- [ ] Rewards screen (rewards list)
- [ ] Rewards screen (badges grid)
- [ ] Rewards screen (transactions list)
- [ ] Admin appointments screen
- [ ] Admin orders screen
- [ ] Admin birthdays screen
- [ ] Admin rewards config (rewards list)
- [ ] Admin rewards config (badges list)

## 8. Integration Tests

### Complete User Journey
- [ ] New customer signs up
- [ ] Customer books first appointment
- [ ] Admin marks appointment as completed
- [ ] Customer earns 1 point
- [ ] Customer earns "First Visit" badge
- [ ] Customer books 4 more appointments
- [ ] Customer earns 5 total points
- [ ] Customer earns "Cliente Fedele" badge
- [ ] Customer redeems 5-point reward
- [ ] Customer has 0 points remaining
- [ ] Customer books more appointments
- [ ] Cycle continues

### Admin Workflow
- [ ] Admin logs in
- [ ] Views dashboard stats
- [ ] Navigates to appointments
- [ ] Marks appointment as completed
- [ ] Navigates to rewards config
- [ ] Creates new reward
- [ ] Creates new badge rule
- [ ] Navigates to birthdays
- [ ] Sends birthday notification
- [ ] Navigates to reports
- [ ] Views revenue stats

## 9. Performance Tests

### Load Testing
- [ ] Create 50+ appointments
- [ ] Create 20+ rewards
- [ ] Create 10+ badge rules
- [ ] App remains responsive
- [ ] Lists scroll smoothly
- [ ] No lag when loading data

### Database Performance
- [ ] Point award trigger executes quickly (<100ms)
- [ ] Badge check trigger executes quickly (<500ms)
- [ ] Queries return results quickly (<1s)
- [ ] No timeout errors

## 10. Edge Cases

### Concurrent Point Awards
- [ ] Mark multiple appointments as completed simultaneously
- [ ] All points awarded correctly
- [ ] No duplicate transactions
- [ ] Final point count correct

### Badge Already Earned
- [ ] Customer earns badge
- [ ] Complete more appointments
- [ ] Badge not duplicated
- [ ] Only one instance in badges array

### Negative Points
- [ ] Customer has 5 points
- [ ] Redeems 5-point reward
- [ ] Points = 0 (not negative)
- [ ] Cannot redeem more rewards

### Expired Rewards
- [ ] Create reward with expiration (if implemented)
- [ ] Reward expires
- [ ] Cannot redeem expired reward
- [ ] Expired reward not shown

### Deleted Badge Rule
- [ ] Customer earns badge
- [ ] Admin deletes badge rule
- [ ] Customer keeps earned badge
- [ ] New customers cannot earn deleted badge

## 11. UI/UX Tests

### Responsive Design
- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone 14 Pro Max (large screen)
- [ ] Test on iPad (tablet)
- [ ] Test on Android phone
- [ ] All elements visible
- [ ] No text cutoff
- [ ] Buttons reachable

### Dark Mode
- [ ] Switch to dark mode
- [ ] All screens readable
- [ ] Contrast sufficient
- [ ] Colors appropriate
- [ ] Glass effects visible

### Accessibility
- [ ] Text size readable
- [ ] Touch targets large enough (44x44pt minimum)
- [ ] Color contrast meets WCAG AA
- [ ] Icons have meaning
- [ ] Error messages clear

### Loading States
- [ ] Loading indicators shown
- [ ] Skeleton screens (if implemented)
- [ ] No blank screens
- [ ] Smooth transitions

### Error States
- [ ] Network errors handled gracefully
- [ ] Database errors shown to user
- [ ] Retry options available
- [ ] Error messages helpful

## 12. Security Tests

### RLS Policies
- [ ] Customer cannot view other customers' points
- [ ] Customer cannot modify other customers' points
- [ ] Customer cannot create rewards
- [ ] Customer cannot create badge rules
- [ ] Admin can view all data
- [ ] Admin can modify all data

### Authentication
- [ ] Unauthenticated users redirected to login
- [ ] Session expires after timeout
- [ ] Refresh token works
- [ ] Logout clears session

### Data Validation
- [ ] Cannot create reward with negative points
- [ ] Cannot create reward with 0 points
- [ ] Cannot redeem reward without enough points
- [ ] Cannot award negative points
- [ ] Badge rules validated

## Test Results

### Summary
- Total Tests: ___
- Passed: ___
- Failed: ___
- Skipped: ___

### Critical Issues
1. 
2. 
3. 

### Minor Issues
1. 
2. 
3. 

### Notes
- 
- 
- 

### Sign-off
- Tester Name: _______________
- Date: _______________
- Version: _______________
- Status: [ ] Approved [ ] Needs Work
