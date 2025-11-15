
# 🚀 Quick Start Guide - Loyalty System

## For the Impatient Admin 😄

Want to get started right away? Follow these 5 simple steps:

## Step 1: Configure Supabase Password Reset (2 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Authentication** → **URL Configuration**
4. Add this URL to **Redirect URLs**:
   ```
   pelolococlub://reset-password
   ```
5. Click **Save**

✅ Done! Password reset now works.

## Step 2: Create Your First Rewards (5 minutes)

1. Open the app as admin
2. Navigate to **Premi & Traguardi**
3. Click the **+** button
4. Create these rewards:

### Reward 1: Small Discount
- Points Required: **5**
- Reward Type: **Sconto Percentuale**
- Value: **10**
- Description: **Sconto 10% sul prossimo servizio**

### Reward 2: Free Haircut
- Points Required: **10**
- Reward Type: **Servizio Gratuito**
- Value: **0**
- Description: **Taglio di capelli gratuito**

### Reward 3: Money Off
- Points Required: **15**
- Reward Type: **Sconto in Euro**
- Value: **5**
- Description: **Sconto di €5 su qualsiasi servizio**

✅ Done! You have 3 rewards configured.

## Step 3: Create Your First Badges (5 minutes)

1. Still in **Premi & Traguardi**
2. Scroll to **Traguardi** section
3. Click the **+** button
4. Create these badges:

### Badge 1: First Visit
- Name: **Prima Visita**
- Description: **Hai completato il tuo primo appuntamento**
- Icon: **star.fill**
- Rule Type: **Numero di Visite**
- Required Visits: **1**

### Badge 2: Loyal Customer
- Name: **Cliente Fedele**
- Description: **Hai completato 5 appuntamenti**
- Icon: **star.circle.fill**
- Rule Type: **Numero di Visite**
- Required Visits: **5**

### Badge 3: VIP Customer
- Name: **Cliente VIP**
- Description: **Hai completato 10 appuntamenti**
- Icon: **crown.fill**
- Rule Type: **Numero di Visite**
- Required Visits: **10**

### Badge 4: Active Customer
- Name: **Cliente Attivo**
- Description: **3 visite in 2 mesi**
- Icon: **flame.fill**
- Rule Type: **Visite in Periodo**
- Required Visits: **3**
- Period in Days: **60**

✅ Done! You have 4 badges configured.

## Step 4: Test with a Customer (3 minutes)

1. Log out from admin
2. Log in as a customer (or create new account)
3. Book an appointment
4. Log back in as admin
5. Go to **Appuntamenti**
6. Mark the appointment as **Completato**
7. Log back in as customer
8. Go to **Premi & Traguardi**
9. See your 1 point and "Prima Visita" badge! 🎉

✅ Done! System is working.

## Step 5: Announce to Customers (10 minutes)

Send this message to your customers:

---

**🎉 Nuovo Sistema Premi al Pelo Loco Club!**

Ciao! Abbiamo una grande novità per te:

**Guadagna Punti ad Ogni Visita!**
- 1 punto per ogni appuntamento completato
- Riscatta i punti per premi fantastici
- Sblocca traguardi speciali

**I Tuoi Premi:**
- 5 punti = 10% di sconto
- 10 punti = Taglio gratuito
- 15 punti = €5 di sconto

**Traguardi da Sbloccare:**
- Prima Visita ⭐
- Cliente Fedele ⭐⭐
- Cliente VIP 👑
- Cliente Attivo 🔥

Vai su **Premi & Traguardi** nell'app per vedere i tuoi punti!

A presto! ✂️

---

✅ Done! Customers are informed.

## That's It! 🎊

Your loyalty system is now live and running. Customers will automatically:
- Earn points when you mark appointments as completed
- Earn badges when they hit milestones
- See their progress in the app
- Redeem rewards when they have enough points

## What Happens Automatically

### When You Mark an Appointment as "Completed":
1. ✅ Customer gets 1 loyalty point
2. ✅ System checks if customer earned any badges
3. ✅ Transaction is logged
4. ✅ Customer sees updated points in app

### No Manual Work Required!
- ❌ No coupon codes to create
- ❌ No manual point tracking
- ❌ No badge management
- ✅ Everything is automatic!

## Quick Tips

### For Best Results:
1. **Always mark appointments as "Completato"** when customer pays
2. **Create seasonal rewards** to keep it interesting
3. **Add new badges** every few months
4. **Promote the system** to new customers
5. **Check the reports** to see engagement

### Common Questions:

**Q: How do customers redeem rewards?**
A: They go to "Premi & Traguardi", click "Riscatta" on a reward, and show you the confirmation.

**Q: Can I change rewards later?**
A: Yes! Edit or delete rewards anytime in the admin panel.

**Q: What if I mark an appointment as completed by mistake?**
A: Points are awarded automatically. You can manually adjust points if needed (contact support).

**Q: Do old appointments count?**
A: No, only appointments marked as completed after the system is live.

**Q: Can customers lose points?**
A: Only when they redeem rewards. Points don't expire.

## Need Help?

Check these files:
- `IMPLEMENTATION-COMPLETE.md` - Full overview
- `SUPABASE-LOYALTY-REWARDS-SETUP.md` - Database setup
- `TESTING-CHECKLIST-LOYALTY-SYSTEM.md` - Testing guide
- `PASSWORD-RESET-COMPLETE-SETUP.md` - Password reset help

## Monitor Your Success

Check these stats regularly:

```sql
-- In Supabase SQL Editor:

-- Total points distributed
SELECT SUM(loyalty_points) as total_points 
FROM users 
WHERE role = 'customer';

-- Top customers
SELECT name, loyalty_points 
FROM users 
WHERE role = 'customer' 
ORDER BY loyalty_points DESC 
LIMIT 10;

-- Recent activity
SELECT * FROM loyalty_transactions 
ORDER BY created_at DESC 
LIMIT 20;
```

## You're All Set! 🎉

Your loyalty system is live. Watch your customer engagement grow!

---

**Pro Tip**: Take a screenshot of a customer's rewards page and post it on Instagram to promote the new system! 📸
