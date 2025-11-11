
# Expo Connection Troubleshooting Guide

## ngrok Error 3200 on iOS - Solutions

If you're experiencing **ngrok error 3200** when trying to open your app on iOS, here are several solutions:

---

## ✅ Solution 1: Use LAN Mode (Recommended)

**This is the most reliable method for local development.**

### Requirements:
- Your computer and iOS device must be on the **same WiFi network**
- Your firewall must allow connections on the Expo port (usually 8081)

### Steps:
1. Stop the current Expo server (Ctrl+C)
2. Run: `npm run dev:lan` or `npx expo start --lan`
3. Scan the QR code with your iPhone camera
4. Open in Expo Go app

### Advantages:
- ✅ Fast and stable connection
- ✅ No external dependencies
- ✅ Works on corporate networks
- ✅ No connection limits

---

## 🔧 Solution 2: Use Localhost Mode (iOS Simulator Only)

If you're using the iOS Simulator on your Mac:

### Steps:
1. Run: `npm run dev:localhost` or `npx expo start --localhost`
2. Press `i` to open in iOS Simulator

### Note:
- Only works with iOS Simulator, not physical devices
- Fastest option for simulator testing

---

## 🌐 Solution 3: Fix Tunnel Mode (If You Must Use It)

If you need tunnel mode (e.g., testing on different networks):

### Common Issues & Fixes:

#### Issue 1: ngrok Connection Limits
**Solution:** Create a free ngrok account and authenticate:
```bash
# Install ngrok globally
npm install -g ngrok

# Sign up at https://ngrok.com and get your auth token
ngrok authtoken YOUR_AUTH_TOKEN
```

#### Issue 2: Firewall Blocking ngrok
**Solution:** 
- Check your firewall settings
- Temporarily disable VPN
- Try a different network (mobile hotspot)

#### Issue 3: iOS Network Restrictions
**Solution:**
- Go to iPhone Settings → WiFi → Your Network
- Tap "Configure DNS" → Select "Manual"
- Add Google DNS: 8.8.8.8 and 8.8.4.4
- Restart Expo and try again

---

## 🚀 Solution 4: Use Expo Dev Client (Production-Ready)

For the best development experience, use Expo Dev Client:

### Steps:
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Build dev client: `eas build --profile development --platform ios`
4. Install the custom dev client on your device
5. Run: `npm run dev` (any connection mode will work)

### Advantages:
- ✅ Works with any connection type
- ✅ Native modules support
- ✅ Better debugging
- ✅ Production-like environment

---

## 📱 Quick Start Commands

```bash
# Default mode (tries LAN first, falls back to tunnel)
npm run dev

# LAN mode (recommended for local development)
npm run dev:lan

# Tunnel mode (for remote testing)
npm run dev:tunnel

# Localhost mode (simulator only)
npm run dev:localhost

# iOS simulator
npm run ios

# Android emulator
npm run android
```

---

## 🔍 Debugging Connection Issues

### Check Your Network:
```bash
# Find your local IP address
# macOS/Linux:
ifconfig | grep "inet "

# Windows:
ipconfig
```

### Test Expo Connection:
1. Open Expo Go on your device
2. Manually enter the URL: `exp://YOUR_IP_ADDRESS:8081`
3. If it works, the issue is with QR code scanning

### Check Firewall:
```bash
# macOS - Allow Expo through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

---

## 🆘 Still Having Issues?

### Common Error Messages:

**"Unable to resolve host"**
- Solution: Use LAN mode and ensure both devices are on same network

**"Network request failed"**
- Solution: Check firewall settings, try mobile hotspot

**"Tunnel connection failed"**
- Solution: Switch to LAN mode or authenticate ngrok

**"Connection timeout"**
- Solution: Restart Expo server, restart device, check WiFi

---

## 📝 Best Practices

1. **For daily development:** Use LAN mode (`npm run dev:lan`)
2. **For simulator testing:** Use localhost mode (`npm run dev:localhost`)
3. **For remote testing:** Use tunnel mode (`npm run dev:tunnel`) with ngrok auth
4. **For production testing:** Use Expo Dev Client with EAS Build

---

## 🔗 Useful Links

- [Expo Connection Types](https://docs.expo.dev/guides/how-expo-works/#connection-types)
- [ngrok Documentation](https://ngrok.com/docs)
- [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/)
- [Troubleshooting Guide](https://docs.expo.dev/troubleshooting/overview/)
