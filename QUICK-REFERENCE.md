
# 🚀 Fidelity Program - Quick Reference

## 📋 Setup Checklist

- [ ] Run `database-fidelity-setup.sql` in Supabase SQL Editor
- [ ] Verify tables created: `fidelity_rewards`, `fidelity_redemptions`, `fidelity_transactions`
- [ ] Verify column added to `users`: `fidelity_credits`
- [ ] Verify columns added to `appointments`: `fidelity_reward_id`, `fidelity_redemption_id`
- [ ] Test credit earning: Complete a paid appointment
- [ ] Test redemption: Redeem a reward with enough credits
- [ ] Configure custom rewards in admin panel

---

## 🎯 Key Concepts

### Credits
- **Earn**: 1 credit per completed paid haircut
- **Spend**: Redeem rewards with credits
- **Track**: View history in Fidelity screen

### Rewards
- **Active**: Enough credits → Colored, tappable, "Redeem" button
- **Inactive**: Not enough credits → Greyed out, "X / Y credits"

### Redemption States
- **Pending**: Credits deducted, waiting for barber confirmation
- **Used**: Barber confirmed, cannot be reused
- **Cancelled**: Appointment cancelled, credits refunded

---

## 👤 Customer Actions

### View Credits
1. Open app
2. See credits card on homepage
3. Tap to view full Fidelity screen

### Redeem Reward
1. Go to Fidelity screen
2. Find reward with enough credits
3. Tap "Redeem"
4. Confirm
5. Show to barber at appointment

### Check History
1. Go to Fidelity screen
2. Scroll to "Cronologia Crediti"
3. View all transactions

---

## 👨‍💼 Admin Actions

### Complete Appointment (Award Credit)
1. Go to Appointments
2. Find appointment
3. Tap "Completa"
4. Credit automatically added if paid

### View Customer Credits
1. Go to Dashboard
2. Tap "Crediti Utenti"
3. See all customers and their credits
4. Tap user for details

### Manage Rewards
1. Go to Dashboard
2. Tap "Ricompense"
3. Create/edit/delete rewards
4. Set credit requirements

### Adjust Credits Manually
1. Go to "Crediti Utenti"
2. Tap user
3. Tap "Aggiusta Crediti"
4. Enter amount (+/-)
5. Enter reason
6. Confirm

---

## 🔢 Default Rewards

| Reward | Credits | Description |
|--------|---------|-------------|
| Taglio Gratuito | 10 | Free haircut |
| Barba Gratuita | 5 | Free beard trim |
| Sconto 50% | 7 | 50% discount |

---

## 📱 UI Locations

### Customer App
- **Homepage**: Credits card + "Fedeltà" button
- **Fidelity Screen**: Credits, rewards, redemptions, history

### Admin App
- **Dashboard**: "Ricompense" + "Crediti Utenti" buttons
- **Appointments**: Credit count + redemption badges
- **Ricompense**: Reward management
- **Crediti Utenti**: User credit management

---

## 🔄 Common Flows

### Earn Credit
```
Complete appointment → Barber marks "completed" → +1 credit
```

### Redeem Reward
```
Tap "Redeem" → Credits deducted → Status: pending → Show to barber
```

### Use Reward
```
Barber completes appointment → Status: used → Cannot reuse
```

### Cancel with Refund
```
Barber cancels → Credits refunded → Status: cancelled
```

---

## 🐛 Quick Fixes

### Credits not awarded?
- Check appointment is "completed"
- Check payment_status is "paid"

### Redemption not showing?
- Refresh appointments list
- Check redemption status is "pending"

### Rewards not visible?
- Check is_active = true
- Refresh rewards list

### RLS errors?
- Re-run database migration
- Check policies exist

---

## 📞 Support

### Documentation
- `FIDELITY-PROGRAM-GUIDE.md` - Full guide
- `FIDELITY-IMPLEMENTATION-SUMMARY.md` - Technical details
- `FIDELITY-SYSTEM-COMPLETE.md` - Overview
- `database-fidelity-setup.sql` - Database setup

### Database Tables
- `fidelity_rewards` - Reward definitions
- `fidelity_redemptions` - Redemption tracking
- `fidelity_transactions` - Audit trail
- `users.fidelity_credits` - User balances
- `appointments.fidelity_*` - Appointment links

---

## ✅ Success Indicators

- [ ] Credits card visible on customer homepage
- [ ] "Fedeltà" button replaces "Coupon" button
- [ ] Credits awarded after completing paid appointment
- [ ] Rewards show "X / Y credits" when insufficient
- [ ] Rewards show "Redeem" when sufficient
- [ ] Redemptions visible in appointments list
- [ ] Admin can view user credits and history
- [ ] Manual credit adjustments work

---

**Quick Start:** Run `database-fidelity-setup.sql` → Test → Configure → Launch! 🚀
