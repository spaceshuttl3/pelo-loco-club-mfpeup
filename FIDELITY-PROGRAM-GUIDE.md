
# 🌟 Fidelity Program Implementation Guide

## Overview

The Fidelity Program has completely replaced the old coupon system. This loyalty program rewards customers with credits for completed paid haircuts, which they can redeem for rewards.

---

## 📋 Database Setup

**IMPORTANT:** Before using the fidelity program, you MUST run the SQL migration in your Supabase SQL Editor.

### Steps:
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `database-fidelity-setup.sql` in this project
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the migration

This will create:
- `fidelity_rewards` table
- `fidelity_redemptions` table
- `fidelity_transactions` table
- Add `fidelity_credits` column to `users` table
- Add fidelity columns to `appointments` table
- Set up Row Level Security (RLS) policies
- Insert default rewards

---

## 🎯 How It Works

### For Customers:

#### 1. **Earning Credits**
- Customers earn **1 credit** for each completed paid haircut
- Credits are added **only after** the barber confirms the appointment as "completed"
- Credits are automatically added to the customer's account
- Users **cannot** manually add credits

#### 2. **Viewing Credits**
- Credits are displayed on the customer homepage in a prominent card
- Tap the card to view the full fidelity program screen
- See available rewards, pending redemptions, and transaction history

#### 3. **Redeeming Rewards**
- Browse available rewards in the fidelity screen
- Rewards show:
  - **Greyed out** if insufficient credits (e.g., "5 / 10 credits")
  - **Active and tappable** with "Redeem" button if enough credits
- When tapping "Redeem":
  - Credits are deducted immediately
  - Reward is marked as "pending redemption"
  - Reward can only be used once
  - Customer must show this to the barber at checkout

#### 4. **Using Rewards**
- At the appointment, show the pending redemption to the barber
- Barber confirms the redemption at checkout
- Once confirmed, reward status becomes "used"
- Cannot be reused or reversed

---

### For Barbers (Admin):

#### 1. **Viewing Appointments**
- In the appointments list, you'll see:
  - Customer's current credit count
  - If a fidelity reward has been redeemed for that appointment
  - Reward details (name, description, status)

#### 2. **Completing Appointments**
- When you tap "Completa" on a paid appointment:
  - Appointment is marked as completed
  - **1 credit is automatically added** to the customer's account
  - A transaction is recorded in the system
  - If the appointment has a pending fidelity redemption, it's marked as "used"

#### 3. **Cancelling Appointments**
- If you cancel an appointment with a pending redemption:
  - Credits are automatically refunded to the customer
  - Redemption is marked as "cancelled"
  - Customer is notified

#### 4. **Managing Rewards**
- Go to **Admin Dashboard** → **Ricompense**
- Create, edit, or delete rewards
- Set credit requirements for each reward
- Activate/deactivate rewards

#### 5. **Managing User Credits**
- Go to **Admin Dashboard** → **Crediti Utenti**
- View all customers and their credit balances
- Tap on a user to see:
  - Current credit balance
  - All redemptions (pending, confirmed, used, cancelled)
  - Complete transaction history
- Manually adjust credits if needed (with reason)

---

## 🔒 Rules & Safety

1. **Rewards are non-transferable** - Each reward is tied to a specific user
2. **One reward per appointment** - Customers can only redeem one reward per booking
3. **Credits cannot go negative** - System prevents negative credit balances
4. **Offline mode support** - Changes sync when connection is restored
5. **Audit trail** - All credit changes are logged in `fidelity_transactions`

---

## 📱 UI Changes

### Customer App:
- **Homepage**: "Coupon" button replaced with "Fedeltà" (Fidelity) button
- **New Fidelity Screen**: Shows credits, available rewards, pending redemptions, and history
- **Credits Card**: Prominent display of current credits on homepage

### Admin App:
- **Dashboard**: "Coupons" replaced with "Ricompense" and "Crediti Utenti"
- **Appointments**: Shows fidelity redemptions and customer credit counts
- **Reward Management**: Create and manage redeemable rewards
- **User Credit Management**: View and adjust user credits with full history

---

## 🎨 Default Rewards

The system comes with 3 default rewards:

1. **Taglio Gratuito** (Free Haircut)
   - Cost: 10 credits
   - Description: Un taglio di capelli completamente gratuito

2. **Barba Gratuita** (Free Beard Trim)
   - Cost: 5 credits
   - Description: Una rasatura della barba gratuita

3. **Sconto 50%** (50% Discount)
   - Cost: 7 credits
   - Description: Sconto del 50% sul prossimo servizio

You can edit or delete these and create your own custom rewards.

---

## 🔄 Redemption Flow

```
1. Customer has enough credits
   ↓
2. Customer taps "Redeem" on a reward
   ↓
3. Credits deducted immediately
   ↓
4. Reward marked as "pending"
   ↓
5. Customer books appointment (or uses existing booking)
   ↓
6. Customer shows pending redemption to barber
   ↓
7. Barber completes appointment
   ↓
8. Reward automatically marked as "used"
   ↓
9. Cannot be reused
```

---

## 📊 Transaction Types

The system tracks 4 types of credit transactions:

1. **earned** - Credits earned from completed appointments
2. **redeemed** - Credits spent on rewards
3. **adjusted** - Manual adjustments by admin (with reason)
4. **expired** - Credits that have expired (if you implement expiration)

---

## 🚀 Getting Started

### For Customers:
1. Complete paid haircuts to earn credits
2. Check your credits on the homepage
3. Browse rewards in the Fidelity screen
4. Redeem rewards when you have enough credits
5. Show pending redemptions to the barber at your appointment

### For Admins:
1. Run the database migration (see Database Setup above)
2. Configure rewards in the admin panel
3. When completing appointments, credits are automatically awarded
4. View user credits and history in "Crediti Utenti"
5. Manually adjust credits if needed

---

## 🐛 Troubleshooting

### Credits not being awarded:
- Ensure the appointment is marked as "completed"
- Ensure the appointment payment_status is "paid"
- Check the fidelity_transactions table for the transaction record

### Redemption not showing in appointments:
- Ensure the redemption status is "pending"
- Check that the appointment has the fidelity_redemption_id set

### RLS Policy Errors:
- Ensure you ran the complete database migration
- Check that RLS is enabled on all fidelity tables
- Verify policies are created correctly

---

## 📝 Notes

- The old coupon system has been completely removed
- All coupon-related files have been deleted
- The spin-the-wheel feature has been removed
- Focus is now on the simple, effective fidelity program
- All changes are backwards compatible with existing appointments

---

## 🎉 Benefits

### For Customers:
- Clear, simple reward system
- Transparent credit tracking
- Immediate feedback on redemptions
- Easy to understand and use

### For Barbers:
- Automatic credit management
- No manual tracking needed
- Encourages repeat business
- Builds customer loyalty

### For Business:
- Increases customer retention
- Encourages regular visits
- Simple to manage
- Scalable reward system

---

**Enjoy your new Fidelity Program! 🌟**
