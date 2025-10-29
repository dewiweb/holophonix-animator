# Troubleshooting Guide

This guide helps you solve common issues with Holophonix Animator v2. Find quick solutions to get back to creating spatial audio animations.

## 🎯 Quick Diagnostics

### Before You Start
1. **Check the Basics**: Power, network, connections
2. **Look for Error Messages**: Note any error text
3. **Try a Simple Test**: Basic circular animation
4. **Check Recent Changes**: What changed before the issue?

### Common Issue Categories
- 🎮 **Application Issues**: Crashes, freezes, UI problems
- 🎨 **Animation Issues**: No movement, wrong timing, jerky motion
- 🔌 **OSC Issues**: Connection problems, no hardware response
- 🎵 **Track Issues**: Missing tracks, wrong positions, import problems
- 💾 **Project Issues**: Save/load problems, corrupted files

---

## 🎮 Application Issues

### Application Won't Start

**❌ Symptoms:**
- Nothing happens when launching
- Error message on startup
- Application closes immediately

**✅ Solutions:**

**Check System Requirements:**
- Windows 10/11 required
- 4GB RAM minimum (8GB recommended)
- 500MB disk space available

**Reinstall Application:**
1. Uninstall Holophonix Animator
2. Download latest version
3. Install as administrator
4. Restart computer

**Check Antivirus:**
- Add Holophonix Animator to antivirus exceptions
- Disable antivirus temporarily to test
- Check quarantine folder for false positives

### Application Freezes or Crashes

**❌ Symptoms:**
- UI becomes unresponsive
- Application closes unexpectedly
- "Not responding" error

**✅ Solutions:**

**Check System Resources:**
- Close other applications
- Check available RAM (Task Manager)
- Restart computer if memory is low

**Update Graphics Drivers:**
- Update to latest graphics drivers
- Try integrated graphics if dedicated fails
- Disable hardware acceleration in settings

**Reset Application Settings:**
1. Close application
2. Delete settings folder: `%APPDATA%/holophonix-animator`
3. Restart application
4. Reconfigure settings

### UI Display Issues

**❌ Symptoms:**
- Buttons not clickable
- 3D preview not showing
- Layout problems

**✅ Solutions:**

**Reset Window Layout:**
1. Press `Ctrl + R` to reset layout
2. Restart application
3. Check display scaling (100% recommended)

**Update Display Drivers:**
- Install latest display drivers
- Try different resolution
- Disable display scaling

---

## 🎨 Animation Issues

### No Movement in 3D Preview

**❌ Symptoms:**
- Animation plays but tracks don't move
- 3D preview is static
- Position values don't change

**✅ Solutions:**

**Check Animation Settings:**
- Ensure duration is set (> 0 seconds)
- Verify animation parameters are reasonable
- Check that tracks are selected

**Verify Track Selection:**
1. Select at least one track
2. Check track is enabled (checkbox)
3. Ensure track has valid position

**Reset Animation Engine:**
1. Stop all animations
2. Create new simple animation
3. Test with circular, 5-second duration
4. Check console for error messages

### Incorrect Timing or Speed

**❌ Symptoms:**
- Animation too fast or too slow
- Duration doesn't match time
- Inconsistent playback speed

**✅ Solutions:**

**Check Duration Settings:**
- Verify animation duration is correct
- Check loop/ping-pong settings
- Ensure time format is seconds, not milliseconds

**System Performance:**
- Close other applications
- Check CPU usage in Task Manager
- Reduce track count for testing

**Reset Timing:**
1. Create new animation with 10-second duration
2. Test with stopwatch
3. Adjust if system clock is inaccurate

### Jerky or Unsmooth Movement

**❌ Symptoms:**
- Movement is stuttering or jumping
- Inconsistent motion
- Frame drops in preview

**✅ Solutions:**

**Reduce Complexity:**
- Decrease number of animated tracks
- Use simpler animation types
- Reduce animation parameter ranges

**Performance Settings:**
- Increase OSC message throttle rate
- Lower 3D preview quality
- Close background applications

**Check Animation Parameters:**
- Ensure position changes are gradual
- Avoid extreme parameter values
- Use appropriate update frequencies

---

## 🔌 OSC Connection Issues

### Cannot Connect to Hardware

**❌ Symptoms:**
- "Connection Failed" error
- Red connection status
- No hardware response

**✅ Solutions:**

**Network Diagnostics:**
```bash
# Test network connectivity
ping [processor-ip-address]

# Check if port is open
telnet [processor-ip-address] 8000
```

**Check OSC Settings:**
1. Verify IP address is correct
2. Ensure port is 8000 (or processor's port)
3. Check firewall allows port 8000
4. Test with different network cable

**Processor Configuration:**
- Ensure processor is in OSC mode
- Check processor network settings
- Verify processor is powered on
- Restart processor if needed

### Connected But No Hardware Response

**❌ Symptoms:**
- Green connection status
- Animation plays in software
- No movement on hardware

**✅ Solutions:**

**Track Mapping:**
1. Check track numbers are assigned (1-64)
2. Verify correct hardware track numbers
3. Test with track 1 (most common)
4. Check processor track status

**OSC Message Format:**
- Ensure processor expects XYZ coordinates
- Check if AED format is required
- Verify message address format
- Test with simple position messages

**Processor Settings:**
- Check processor is in OSC input mode
- Verify OSC input is enabled
- Check processor's OSC address settings
- Test processor's OSC test utility

### Intermittent Connection

**❌ Symptoms:**
- Connection drops randomly
- Status changes between connected/disconnected
- Inconsistent hardware response

**✅ Solutions:**

**Network Stability:**
- Use wired Ethernet connection
- Avoid WiFi for critical applications
- Check network cable quality
- Replace faulty network equipment

**Network Configuration:**
- Set static IP addresses
- Configure DHCP reservations
- Check network switch quality
- Avoid network congestion

**Application Settings:**
- Increase connection timeout
- Enable connection retry
- Reduce message frequency
- Monitor network traffic

---

## 🎵 Track Issues

### Tracks Not Showing

**❌ Symptoms:**
- Empty track list
- Cannot add new tracks
- Imported tracks missing

**✅ Solutions:**

**Check Track Creation:**
1. Click "Add Track" button
2. Enter track name
3. Set initial position
4. Click "Save Track"

**Import Issues:**
- Ensure OSC connection is active
- Check bidirectional communication is enabled
- Verify processor has tracks configured
- Try manual track creation

**Filter Settings:**
- Check track list filters
- Ensure no search filters active
- Verify track visibility settings
- Reset track view

### Wrong Track Positions

**❌ Symptoms:**
- Tracks in wrong locations
- Position values incorrect
- 3D preview doesn't match settings

**✅ Solutions:**

**Reset Track Positions:**
1. Select track with wrong position
2. Enter correct X, Y, Z values
3. Click "Update Position"
4. Verify in 3D preview

**Coordinate System:**
- Check if using meters or feet
- Verify coordinate format (XYZ vs AED)
- Ensure positive/negative values are correct
- Check processor coordinate system

**Import from Hardware:**
1. Connect to Holophonix processor
2. Click "Import from Holophonix"
3. Select tracks to import
4. Verify imported positions

### Track Import Problems

**❌ Symptoms:**
- "Import from Holophonix" not working
- No tracks found during import
- Import errors or timeouts

**✅ Solutions:**

**Connection Requirements:**
- Ensure OSC connection is established
- Enable bidirectional communication
- Check processor supports OSC queries
- Verify processor track configuration

**Import Process:**
1. Test connection first
2. Click "Import from Holophonix"
3. Wait for discovery to complete
4. Select tracks and import

**Troubleshooting:**
- Check processor OSC query support
- Verify track numbers (1-64)
- Try importing fewer tracks
- Check console for error messages

---

## 💾 Project Issues

### Cannot Save Projects

**❌ Symptoms:**
- Save button not working
- "Save failed" error
- Projects not appearing in list

**✅ Solutions:**

**Check File Permissions:**
1. Run application as administrator
2. Check disk space availability
3. Verify write permissions to project folder
4. Try saving to different location

**Project Validation:**
- Ensure project has at least one track
- Check all tracks have valid names
- Verify animations are properly configured
- Remove any corrupted tracks

**Reset Project Folder:**
1. Close application
2. Backup existing projects
3. Delete project folder contents
4. Restart application
5. Create new test project

### Cannot Load Projects

**❌ Symptoms:**
- "Load failed" error
- Projects appear empty
- Missing tracks or animations

**✅ Solutions:**

**File Integrity:**
- Check project file isn't corrupted
- Verify file extension is .holophonix
- Try loading backup copy
- Check file size (shouldn't be 0KB)

**Version Compatibility:**
- Ensure project format is compatible
- Check application version
- Try importing to new project
- Contact support for file conversion

**Load Process:**
1. Select project from list
2. Click "Load Project"
3. Wait for loading to complete
4. Verify all tracks loaded correctly

### Project Corruption

**❌ Symptoms:**
- Strange behavior in project
- Missing data or settings
- Application crashes with specific project

**✅ Solutions:**

**Project Recovery:**
1. Create new blank project
2. Import tracks from corrupted project
3. Recreate animations manually
4. Save as new project

**Prevention:**
- Save projects frequently
- Keep backup copies
- Use version control for important projects
- Save before major changes

---

## 🛠️ Advanced Troubleshooting

### Console Error Messages

**How to Access Console:**
1. Press `F12` to open developer tools
2. Click "Console" tab
3. Look for red error messages
4. Note error text and timestamps

**Common Console Errors:**
- `Failed to connect`: OSC connection issue
- `Track not found`: Track ID problem
- `Invalid parameters`: Animation configuration error
- `Network error`: Network connectivity issue

### Performance Monitoring

**Check System Resources:**
1. Open Task Manager (`Ctrl + Shift + Esc`)
2. Monitor CPU usage (should be < 80%)
3. Check memory usage (should be < 90%)
4. Watch network activity

**Application Performance:**
- Monitor frame rate in 3D preview
- Check OSC message rate in settings
- Watch for memory leaks during long sessions
- Note any performance degradation

### Log Files

**Location:**
- Windows: `%APPDATA%/holophonix-animator/logs/`
- Check latest log file for errors
- Look for patterns in error messages
- Include logs when contacting support

---

## 📞 Getting Help

### Self-Service Resources

**📖 Documentation:**
- Complete user guide
- Technical reference manual
- Animation type documentation

**🎥 Video Tutorials:**
- Getting started videos
- Advanced technique tutorials
- Troubleshooting walkthroughs

**🌐 Community Forum:**
- User discussions and solutions
- Tips and best practices
- Peer support and advice

### Professional Support

**When to Contact Support:**
- Issues not resolved by troubleshooting
- Hardware compatibility problems
- Bug reports and feature requests
- Enterprise deployment assistance

**What to Include:**
- Detailed description of the issue
- Steps to reproduce the problem
- Error messages and screenshots
- System information and logs

---

## 🔧 Quick Reference

### Emergency Reset
```
1. Close application
2. Clear settings: %APPDATA%/holophonix-animator
3. Restart application
4. Reconfigure basic settings
```

### Network Test Commands
```bash
# Test connectivity
ping [processor-ip]

# Test port
telnet [processor-ip] 8000

# Check network route
tracert [processor-ip]
```

### Common Default Values
- **OSC Port**: 8000
- **Animation Duration**: 10 seconds
- **Track Count**: Up to 64
- **Message Rate**: 20 Hz (throttle rate 3)

---

**Still having issues?** Our support team is here to help you get back to creating amazing spatial audio experiences!

[← Getting Started](GETTING_STARTED.md) | [← Animation Types](ANIMATION_TYPES.md) | [← OSC Setup](OSC_SETUP.md)
