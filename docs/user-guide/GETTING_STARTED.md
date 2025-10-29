# Getting Started with Holophonix Animator v2

Welcome to Holophonix Animator v2! This guide will help you get up and running quickly with creating spatial audio animations.

## 🎯 What You'll Learn

- Set up your first project
- Create and configure tracks
- Design your first animation
- Connect to Holophonix hardware
- Export and save your work

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Your First Track
1. Click the **"Add Track"** button in the Track List panel
2. Give your track a descriptive name (e.g., "Front Left Speaker")
3. Set the initial position using the 3D position controls
4. Click **"Save Track"**

### Step 2: Create a Basic Animation
1. Select your track by clicking on it
2. Choose **"Circular"** from the animation type dropdown
3. Set the duration to **10 seconds**
4. Adjust the radius to **3 meters**
5. Click **"Save Animation"**

### Step 3: Test Your Animation
1. Click the **Play ▶️** button
2. Watch the track move in the 3D preview
3. Click **Stop ⏹️** when done

### Step 4: Connect to Hardware (Optional)
1. Go to **Settings → OSC Connection**
2. Enter your Holophonix processor IP address
3. Set the port to **8000** (default)
4. Click **"Connect"**
5. Play your animation to see real hardware movement

## 📋 Understanding the Interface

### Main Panels

**🎵 Track List (Left)**
- Manage all your audio tracks
- Set positions and colors
- Import tracks from Holophonix

**🎨 Animation Editor (Center)**
- Design animation movements
- Configure timing and parameters
- Preview in 3D

**⚙️ Settings (Right)**
- OSC connection settings
- Application preferences
- Export options

**🎬 3D Preview (Bottom)**
- Visualize animations in real-time
- Check movement paths
- Verify spatial relationships

### Key Controls

- **Play ▶️** - Start animation playback
- **Pause ⏸️** - Pause current animation
- **Stop ⏹️** - Stop and reset animation
- **Loop 🔁** - Repeat animation continuously
- **Ping-Pong ↔️** - Reverse direction at endpoints

## 🎨 Creating Your First Project

### Project Setup
1. **New Project**: Click **File → New Project**
2. **Add Tracks**: Create 2-4 tracks for a basic setup
3. **Position Tracks**: Arrange them in your desired layout
4. **Save Project**: **File → Save Project** to preserve your work

### Best Practices for Beginners

**Start Simple:**
- Begin with 2-3 tracks
- Use basic animation types (Circular, Linear)
- Keep animations under 30 seconds

**Organize Your Work:**
- Use descriptive track names
- Save frequently
- Test animations as you build them

**Learn the Basics:**
- Master circular animations first
- Understand timing and duration
- Practice track positioning

## 🔌 Connecting to Holophonix Hardware

### Required Information
- **IP Address**: Your Holophonix processor's network address
- **Port**: Usually 8000 (check your processor manual)
- **Track Numbers**: Which processor tracks correspond to your animations

### Connection Steps
1. **Network Setup**: Ensure your computer and Holophonix are on the same network
2. **Configure OSC**: Enter IP and port in Settings → OSC Connection
3. **Test Connection**: Click "Connect" - you should see "Connected" status
4. **Map Tracks**: Assign each animation track to a hardware track number
5. **Verify Movement**: Play animation to confirm hardware responds

### Troubleshooting Connection Issues

**❌ "Connection Failed"**
- Check IP address and port
- Verify network connectivity
- Ensure Holophonix processor is running

**❌ "No Movement on Hardware"**
- Verify track mapping is correct
- Check hardware is in OSC mode
- Test with a simple circular animation

## 🎯 Next Steps

Once you're comfortable with the basics:

1. **Try Different Animation Types**
   - Physics-based: Pendulum, Bounce, Spring
   - Wave patterns: Wave, Lissajous, Helix
   - Path-based: Bézier, Zigzag

2. **Explore Multi-Track Modes**
   - **Identical**: All tracks follow same path
   - **Position-Relative**: Each track animates from its position
   - **Formation**: Tracks move as a group

3. **Advanced Features**
   - Animation presets for quick setups
   - Custom parameter editing
   - Project export and sharing

## ❓ Need Help?

- **📖 User Guide**: Browse detailed documentation
- **🔧 Troubleshooting**: Common issues and solutions
- **💬 Support**: Contact our support team

---

**Ready to create amazing spatial audio experiences?** Let's get started!

[→ Animation Types Guide](ANIMATION_TYPES.md) | [→ OSC Setup Guide](OSC_SETUP.md) | [→ Troubleshooting](TROUBLESHOOTING.md)
