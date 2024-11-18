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
  - X: Left/Right (-max to +max)
  - Y: Front/Back (-max to +max)
  - Z: Up/Down (-max to +max)
  - Automatic conversion

## Documentation 📚

Comprehensive documentation is available in the `docs` directory:

### Quick Links
- [Development Guide](docs/development/README.md) - Setup and development workflow
- [OSC Protocol Reference](docs/reference/osc.md) - Detailed OSC implementation
- [Behavior System Architecture](docs/architecture/behavior-system.md) - Motion system design
- [Component Documentation](docs/components/) - React component details
  - [Fader Component](docs/components/Fader.md) - Parameter control component

### Documentation Structure
```
docs/
├── api/           # API documentation and specifications
├── architecture/  # System architecture and design documents
├── components/    # React component documentation
├── development/   # Development guides and processes
├── reference/     # Reference guides and documentation
├── guides/        # User guides and tutorials
├── examples/      # Code examples and use cases
└── assets/        # Documentation assets
```

## Technical Stack 🛠

### Core Technologies
- **Frontend**: React + TypeScript
- **Backend**: Electron
- **Communication**: OSC over UDP
- **UI Framework**: Material-UI
- **State Management**: React Context

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
Edit `config.json` to set up your environment:

```json
{
  "network": {
    "host": "127.0.0.1",  # Holophonix IP
    "inputPort": 9000,    # Default input port
    "outputPort": 12000   # Default output port
  },
  "defaults": {
    "coordinateSystem": "aed",  # aed/xyz
    "distanceUnit": "meters",   # meters/feet
    "updateRate": 60           # Updates per second
  }
}
```

## Contributing 🤝

We welcome contributions! Please see our [Development Guide](docs/development/README.md) for details on our development process and how to submit pull requests.

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
