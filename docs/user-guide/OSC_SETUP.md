# OSC Setup and Configuration Guide

This guide helps you connect Holophonix Animator to your Holophonix hardware using OSC (Open Sound Control) protocol.

## 🎯 What You'll Learn

- Understand OSC communication basics
- Configure network settings
- Connect to Holophonix processors
- Troubleshoot connection issues
- Optimize performance

---

## 🔌 Understanding OSC

### What is OSC?
OSC (Open Sound Control) is a protocol for real-time communication between audio devices. Holophonix Animator uses OSC to send position data to your Holophonix processor, which moves speakers in real-time.

### How It Works
```
Holophonix Animator → Network → Holophonix Processor → Speaker Movement
```

**Key Components:**
- **IP Address**: Network location of your Holophonix processor
- **Port**: Communication channel (usually 8000)
- **Track Mapping**: Which animation tracks control which hardware tracks

---

## 🌐 Network Setup

### Step 1: Connect to the Same Network
Your computer and Holophonix processor must be on the same network:

**Options:**
- **Direct Connection**: Ethernet cable from computer to processor
- **Local Network**: Both devices on the same router/switch
- **Studio Network**: Professional audio network setup

### Step 2: Find Your Processor's IP Address

**Method 1: Processor Display**
1. Look at your Holophonix processor's front panel
2. Navigate to **Network Settings**
3. Note the **IP Address** (e.g., 192.168.1.100)

**Method 2: Network Scanner**
1. Use a network scanning tool
2. Look for "Holophonix" devices
3. Note the IP address found

**Method 3: Router Admin Panel**
1. Login to your router's admin panel
2. Check connected devices list
3. Find the Holophonix processor entry

### Step 3: Test Network Connectivity
Open Command Prompt/Terminal and run:
```bash
# Replace with your processor's IP
ping 192.168.1.100
```

**Success**: You should see replies from the processor
**Failure**: Check network cables and settings

---

## ⚙️ Configuring OSC in Holophonix Animator

### Basic Setup
1. Open **Settings → OSC Connection**
2. Enter your processor's **IP Address**
3. Set **Port** to **8000** (Holophonix default)
4. Click **"Test Connection"**

### Advanced Settings

**Message Throttle Rate:**
- Controls how many OSC messages are sent per second
- **1** = Maximum messages (60/second)
- **10** = Minimum messages (6/second)
- **Recommended**: 3-5 for most setups

**Bidirectional Communication:**
- Allows importing tracks from Holophonix
- Requires processor to support OSC queries
- Enable for "Import from Holophonix" feature

### Track Mapping
1. Select a track in the Track List
2. Set the **Holophonix Track Number** (1-64)
3. Repeat for all tracks
4. Use **"Import from Holophonix"** for automatic mapping

---

## 🎯 Connecting to Hardware

### Step-by-Step Connection

1. **Verify Network**: Ensure processor is reachable
2. **Configure Settings**: Enter IP and port in OSC settings
3. **Test Connection**: Click "Test Connection" button
4. **Map Tracks**: Assign animation tracks to hardware tracks
5. **Connect**: Click "Connect" button
6. **Verify Movement**: Play a simple animation to test

### Connection Status Indicators

**🟢 Connected** 
- Green status light
- Ready to send OSC messages
- Hardware should respond to animations

**🟡 Connecting**
- Yellow status light
- Attempting to establish connection
- Wait for completion or timeout

**🔴 Disconnected**
- Red status light
- No connection to processor
- Check network and settings

---

## 🎬 Testing Your Connection

### Simple Test Animation
1. Create a **Circular** animation with 5-second duration
2. Set radius to **2 meters**
3. Map to hardware track **1**
4. Click **Play**
5. **Expected**: Speaker 1 should move in a circle

### Multiple Track Test
1. Create 3 tracks with different positions
2. Map to tracks **1, 2, 3**
3. Use **Identical** multi-track mode
4. Play animation
5. **Expected**: All 3 speakers move together

### Import Test
1. Ensure **Bidirectional Communication** is enabled
2. Click **"Import from Holophonix"**
3. **Expected**: Track names and positions appear from processor

---

## 🔧 Troubleshooting Common Issues

### Connection Issues

**❌ "Connection Failed"**
- **Check IP Address**: Verify processor IP is correct
- **Check Port**: Ensure port 8000 (or your processor's port)
- **Check Network**: Ping the processor IP address
- **Check Firewall**: Allow port 8000 through firewall

**❌ "Connected But No Movement"**
- **Check Track Mapping**: Ensure tracks are assigned to hardware numbers
- **Check Processor Mode**: Verify processor is in OSC mode
- **Check Animation**: Ensure animation is playing and has movement
- **Check Message Rate**: Try lower throttle rate (higher number)

**❌ "Intermittent Connection"**
- **Check Network Cable**: Ensure secure connection
- **Check Network Traffic**: Reduce other network usage
- **Check Wireless**: Use wired connection for reliability

### Performance Issues

**❌ "Jerky Movement"**
- **Reduce Track Count**: Fewer simultaneous tracks
- **Increase Throttle Rate**: Higher number = fewer messages
- **Check Network**: Ensure stable, fast connection
- **Simplify Animations**: Use simpler animation types

**❌ "Delayed Response"**
- **Check Network Latency**: Ping processor to check delay
- **Reduce Message Rate**: Increase throttle rate
- **Check Processor Load**: Ensure processor isn't overloaded
- **Use Wired Connection**: More reliable than wireless

### Hardware Issues

**❌ "Wrong Speaker Movement"**
- **Check Track Mapping**: Verify correct hardware track numbers
- **Check Coordinate System**: XYZ vs AED format
- **Check Processor Settings**: Verify OSC input configuration
- **Check Animation Parameters**: Ensure reasonable movement ranges

---

## 📊 Performance Optimization

### Network Best Practices

**Use Wired Connection:**
- More reliable than wireless
- Lower latency and jitter
- Consistent message delivery

**Dedicated Network:**
- Separate audio network from general traffic
- Use network switches for multiple devices
- Configure QoS if available

**Network Configuration:**
- Static IP addresses for processors
- Reserved DHCP leases
- Proper subnet masking

### OSC Message Optimization

**Message Throttling:**
- Start with throttle rate of 3
- Increase for complex animations
- Decrease for precise movement

**Track Management:**
- Limit active tracks to necessary ones
- Group similar movements
- Use multi-track modes efficiently

**Animation Design:**
- Optimize movement ranges
- Avoid unnecessary position changes
- Use appropriate animation types

---

## 🎯 Advanced Configuration

### Multiple Processors
1. Add multiple OSC connections in settings
2. Assign different track ranges to each processor
3. Use track naming to organize (e.g., "Processor1-Track1")

### Custom Ports
1. Check your processor's OSC port settings
2. Configure custom port in Holophonix Animator
3. Update firewall rules for custom ports

### Network Redundancy
1. Configure multiple network paths
2. Use connection failover settings
3. Monitor connection status

---

## 📋 Quick Reference

### Default Settings
- **IP Address**: Your processor's network IP
- **Port**: 8000 (Holophonix default)
- **Throttle Rate**: 3 (balanced performance)
- **Bidirectional**: Enabled (for track import)

### Common Port Numbers
- **8000**: Holophonix default OSC port
- **9000**: Alternative OSC port
- **8001**: OSC feedback port

### Network Ranges
- **192.168.x.x**: Private network (common)
- **10.x.x.x**: Private network (large)
- **172.16-31.x.x**: Private network (medium)

---

## ❓ Need More Help?

- **📖 Full Documentation**: Complete technical reference
- **🎥 Video Tutorials**: Step-by-step setup guides
- **💬 Technical Support**: Contact our support team
- **🌐 Community Forum**: User discussions and tips

---

**Ready to connect your hardware?** Let's get your spatial audio system running!

[← Getting Started](GETTING_STARTED.md) | [→ Animation Types](ANIMATION_TYPES.md) | [→ Troubleshooting](TROUBLESHOOTING.md)
