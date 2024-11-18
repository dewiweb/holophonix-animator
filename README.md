# Holophonix Track Motion Animator 🎵

A cross-platform desktop application for creating and managing motion behaviors for Holophonix spatial audio tracks via OSC. Create complex spatial movements using absolute or relative coordinate changes in both AED (Azimuth, Elevation, Distance) and XYZ coordinate systems.

## Features 🚀

### Motion Behaviors
- **1D Behaviors**
  - Linear oscillation with configurable frequency and amplitude
  - Sine wave with phase control
  - Random walk (planned)
  - Relative drift (planned)

- **2D Behaviors**
  - Circle motion with radius and plane control
  - Figure-8 (planned)
  - Random walk 2D (planned)
  - Spiral (planned)
  - Custom paths (planned)

- **3D Behaviors**
  - Spherical orbit (planned)
  - 3D spiral (planned)
  - Random walk 3D (planned)
  - Composite movements (planned)

### Parameter Control 🎛
- **Interactive Controls**
  - Direct numeric input
  - Slider-based adjustment
  - Double-click reset
  - Real-time validation
  - Unit-aware inputs (Hz, meters)

- **Parameter Types**
  - Frequency control
  - Amplitude/Range
  - Position offsets
  - Phase adjustments
  - Plane selection
  - Axis selection

### Track Management 👥
- **Track Groups**
  ```
  # Range Groups
  [1-4]     # Tracks 1, 2, 3, 4
  [2-10]    # Tracks 2 through 10

  # Enumeration Groups
  {1,3,5}   # Tracks 1, 3, and 5
  {1,5,10}  # Tracks 1, 5, and 10
  ```
  - Group-wide behavior control
  - Synchronized movement
  - Batch parameter updates
  - Enable/disable groups

### Coordinate Systems 🌐
- **AED (Spherical)**
  - Azimuth: -180° to 180°
  - Elevation: -90° to 90°
  - Distance: 0 to room size

- **XYZ (Cartesian)**
  - X: Left/Right
  - Y: Front/Back
  - Z: Up/Down
  - Automatic conversion

## Technical Details 🛠

### Architecture
- **Frontend**: React + TypeScript
- **Backend**: Electron
- **Communication**: OSC over UDP
- **UI Framework**: Material-UI
- **State Management**: React Context

### Key Components
- **Behavior System**
  - Base behavior class
  - Parameter validation
  - Position calculation
  - Coordinate conversion

- **Parameter System**
  - Real-time validation
  - Unit conversion
  - Error handling
  - Default values

### Project Structure
```
src/
├── behaviors/           # Motion behavior implementations
│   ├── base.ts         # Base behavior class
│   ├── registry.ts     # Behavior registration
│   └── implementations/
│       ├── linear.ts   # Linear oscillation
│       ├── sine.ts     # Sine wave motion
│       └── circle.ts   # Circular motion
├── components/         # React components
│   ├── Fader.tsx      # Parameter control
│   └── ParameterEditor.tsx
├── types/             # TypeScript definitions
└── utils/             # Helper functions
```

## Getting Started 🏁

### Prerequisites
- Node.js (>= 14.0.0)
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/dewiweb/holophonix-animator.git

# Install dependencies
cd holophonix-animator
npm install   # or yarn install

# Start development server
npm run dev   # or yarn dev
```

### Configuration
- **OSC Settings**
  ```typescript
  {
    "host": "127.0.0.1",  // Holophonix IP
    "port": 8000,         // OSC port
    "prefix": "/source"   // Message prefix
  }
  ```

- **Default Values**
  ```typescript
  {
    "coordinateSystem": "aed",  // aed/xyz
    "distanceUnit": "meters",   // meters/feet
    "updateRate": 60           // Updates per second
  }
  ```

## Documentation 📚

- [Development Documentation](docs/DEVELOPMENT.md)
- [OSC Protocol Documentation](docs/HOLOPHONIX_OSC.md)
- [Component Documentation](docs/components/)

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Workflow
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [Holophonix](https://holophonix.xyz/) for their spatial audio processor
- [Electron](https://www.electronjs.org/) for the desktop application framework
- [React](https://reactjs.org/) for the UI framework
- [Material-UI](https://mui.com/) for the component library
