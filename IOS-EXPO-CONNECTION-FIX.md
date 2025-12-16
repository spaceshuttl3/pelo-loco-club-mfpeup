
# iOS Expo Connection Issues - Complete Fix Guide

## Common Issues and Solutions

### Issue 1: App Not Opening on iPhone

#### Solution A: Network Configuration

1. **Ensure Same Network**
   - Both your computer and iPhone must be on the same WiFi network
   - Disable VPN on both devices
   - Disable any firewall that might block connections

2. **Use Tunnel Mode**
   ```bash
   npx expo start --tunnel
   ```
   This uses ngrok to create a tunnel, bypassing network restrictions

3. **Check Expo Go App**
   - Make sure Expo Go is installed and updated on your iPhone
   - Download from App Store: https://apps.apple.com/app/expo-go/id982107779

#### Solution B: Clear Cache and Restart

1. **Clear Metro Bundler Cache**
   ```bash
   npx expo start --clear
   ```

2. **Clear Expo Cache**
   ```bash
   rm -rf node_modules
   rm -rf .expo
   npm install
   ```

3. **Restart Everything**
   - Close Expo Go on iPhone
   - Stop the development server (Ctrl+C)
   - Restart your computer's WiFi
   - Restart iPhone
   - Start fresh:
     ```bash
     npx expo start --clear
     ```

#### Solution C: Use LAN Mode

```bash
npx expo start --lan
```

This explicitly uses your local network IP address.

#### Solution D: Manual Connection

1. **Get Your Computer's IP Address**
   - macOS: System Preferences → Network
   - Windows: `ipconfig` in Command Prompt
   - Linux: `ifconfig` or `ip addr`

2. **In Expo Go on iPhone**
   - Tap "Enter URL manually"
   - Enter: `exp://YOUR_IP_ADDRESS:8081`
   - Example: `exp://192.168.1.100:8081`

### Issue 2: Icons Not Showing on Physical Device

This is already fixed in the code updates above. The issue was:
- iOS uses SF Symbols (via `expo-symbols`)
- Android uses Material Icons
- The platform-specific files weren't properly configured

The fix ensures:
- Proper fallback to Material Icons when SF Symbols aren't available
- Correct icon mapping for both platforms
- Error handling for missing icons

### Issue 3: App Crashes on Launch

#### Solution A: Check Logs

1. **View Expo Logs**
   ```bash
   npx expo start
   ```
   Watch the terminal for errors

2. **View Device Logs**
   - iOS: Xcode → Window → Devices and Simulators → Select device → View logs
   - Or use Console app on macOS

#### Solution B: Rebuild Native Code

If you've added new native dependencies:

```bash
npx expo prebuild --clean
npx expo run:ios
```

### Issue 4: "Unable to Connect to Development Server"

#### Solution A: Check Firewall

1. **macOS**
   - System Preferences → Security & Privacy → Firewall
   - Click "Firewall Options"
   - Ensure "Block all incoming connections" is OFF
   - Add Node.js to allowed apps

2. **Windows**
   - Windows Defender Firewall → Allow an app
   - Add Node.js and Expo

#### Solution B: Use Different Port

```bash
npx expo start --port 8082
```

Then connect manually using the new port.

### Issue 5: QR Code Not Scanning

#### Solution A: Manual Entry

Instead of scanning QR code:
1. Open Expo Go
2. Tap "Enter URL manually"
3. Type the URL shown in terminal

#### Solution B: Use Development Build

For production-ready testing:

```bash
# Build development client
eas build --profile development --platform ios

# Install on device
# Then run:
npx expo start --dev-client
```

## Network Troubleshooting Checklist

- [ ] Computer and iPhone on same WiFi network
- [ ] VPN disabled on both devices
- [ ] Firewall allows Node.js connections
- [ ] Expo Go app is updated
- [ ] Metro bundler is running without errors
- [ ] No other apps using port 8081
- [ ] WiFi router allows device-to-device communication

## Testing Connection

1. **Ping Test**
   ```bash
   # On computer, get IP address
   # On iPhone, use a network utility app to ping that IP
   ```

2. **Port Test**
   ```bash
   # On computer
   nc -l 8081
   
   # On iPhone, try to connect to http://YOUR_IP:8081
   ```

## Alternative Development Methods

### Method 1: iOS Simulator (macOS only)

```bash
npx expo start --ios
```

This opens the iOS Simulator automatically.

### Method 2: Development Build

More stable than Expo Go:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build development client
eas build --profile development --platform ios

# Install on device via TestFlight or direct install
```

### Method 3: Local Development Build

```bash
# Requires macOS and Xcode
npx expo prebuild
npx expo run:ios
```

## Common Error Messages

### "Network response timed out"
- **Solution**: Use tunnel mode or check firewall

### "Unable to resolve module"
- **Solution**: Clear cache and reinstall dependencies
  ```bash
  rm -rf node_modules
  npm install
  npx expo start --clear
  ```

### "Invariant Violation: Module AppRegistry is not a registered callable module"
- **Solution**: Restart Metro bundler
  ```bash
  npx expo start --clear
  ```

### "Error: listen EADDRINUSE: address already in use :::8081"
- **Solution**: Kill process using port 8081
  ```bash
  # macOS/Linux
  lsof -ti:8081 | xargs kill -9
  
  # Windows
  netstat -ano | findstr :8081
  taskkill /PID <PID> /F
  ```

## Best Practices for Development

1. **Use Tunnel Mode for Reliability**
   ```bash
   npx expo start --tunnel
   ```

2. **Keep Expo Go Updated**
   - Check App Store regularly
   - Update when prompted

3. **Use Development Builds for Production Testing**
   - More stable than Expo Go
   - Closer to production environment

4. **Monitor Console Logs**
   - Keep terminal visible
   - Watch for warnings and errors

5. **Test on Multiple Devices**
   - Different iOS versions
   - Different screen sizes

## Quick Command Reference

```bash
# Start with tunnel (most reliable)
npx expo start --tunnel

# Start with LAN
npx expo start --lan

# Start with localhost
npx expo start --localhost

# Clear cache and start
npx expo start --clear

# Start on specific port
npx expo start --port 8082

# Start iOS simulator (macOS only)
npx expo start --ios

# Build development client
eas build --profile development --platform ios

# Run on physical device (requires macOS)
npx expo run:ios --device
```

## Still Having Issues?

1. **Check Expo Status**
   - https://status.expo.dev/

2. **Expo Forums**
   - https://forums.expo.dev/

3. **Expo Discord**
   - https://chat.expo.dev/

4. **GitHub Issues**
   - https://github.com/expo/expo/issues

## Summary

Most iOS connection issues are related to:
1. Network configuration (same WiFi, no VPN)
2. Firewall blocking connections
3. Outdated Expo Go app
4. Cache issues

The most reliable solution is to use **tunnel mode**:
```bash
npx expo start --tunnel
```

This bypasses most network issues and works in almost all scenarios.
