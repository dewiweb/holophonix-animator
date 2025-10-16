// Core domain types for Holophonix Animator v2

// ========================================
// 3D COORDINATE SYSTEMS
// ========================================

export interface Color {
  r: number;  // Red (0-1)
  g: number;  // Green (0-1)  
  b: number;  // Blue (0-1)
  a: number;  // Alpha (0-1)
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface CoordinateSystem {
  type: 'xyz' | 'aed';
  bounds?: {
    x?: { min: number; max: number };
    y?: { min: number; max: number };
    z?: { min: number; max: number };
    azimuth?: { min: number; max: number };
    elevation?: { min: number; max: number };
    distance?: { min: number; max: number };
  };
}

// ========================================
// ANIMATION SYSTEM
// ========================================

export type AnimationType =
  // Existing animations
  | 'linear'
  | 'circular'
  | 'elliptical'
  | 'spiral'
  | 'random'
  | 'custom'
  // Physics-based animations
  | 'pendulum'
  | 'bounce'
  | 'spring'
  // Wave-based animations
  | 'wave'
  | 'lissajous'
  | 'helix'
  // Curve & path-based
  | 'bezier'
  | 'catmull-rom'
  | 'zigzag'
  // Advanced procedural
  | 'perlin-noise'
  | 'rose-curve'
  | 'epicycloid'
  // Multi-object & interactive
  | 'orbit'
  | 'formation'
  | 'attract-repel'
  // Specialized spatial audio
  | 'doppler'
  | 'circular-scan'
  | 'zoom';

export type InterpolationType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier';

export interface Keyframe {
  id: string;
  time: number;        // Time in seconds
  position: Position;
  interpolation?: InterpolationType;
  easing?: [number, number, number, number]; // Cubic bezier parameters
}

export interface ControlPoint {
  id: string;
  position: Position;
  type: 'start' | 'control' | 'end' | 'keyframe';
  animationType: AnimationType;
  time?: number;
  index?: number;
}

export interface AnimationParameters {
  // Linear animation
  startPosition?: Position;
  endPosition?: Position;

  // Circular animation
  center?: Position;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  plane?: 'xy' | 'xz' | 'yz';

  // Elliptical animation
  centerX?: number;
  centerY?: number;
  centerZ?: number;
  radiusX?: number;
  radiusY?: number;
  radiusZ?: number;
  rotation?: number;

  // Spiral animation
  startRadius?: number;
  endRadius?: number;
  pitch?: number;      // Vertical movement per rotation
  rotations?: number;  // Number of rotations
  direction?: 'clockwise' | 'counterclockwise';

  // Random animation
  bounds?: { x: number; y: number; z: number };
  speed?: number;
  smoothness?: number;
  updateFrequency?: number;
  randomWaypoints?: Position[];  // Pre-generated waypoints for reproducible random paths

  // Custom animation (advanced)
  expression?: string;
  interpolation?: 'linear' | 'bezier' | 'step';
  keyframes?: Keyframe[];
  initialPosition?: Position;

  // ========================================
  // PHYSICS-BASED ANIMATIONS
  // ========================================

  // Pendulum animation
  anchorPoint?: Position;      // Pivot point
  pendulumLength?: number;     // Length of pendulum
  initialAngle?: number;       // Starting angle in degrees
  damping?: number;            // Energy loss per cycle (0-1)
  gravity?: number;            // Gravity strength
  // plane is reused from circular animation above

  // Bounce animation
  startHeight?: number;
  groundLevel?: number;
  bounciness?: number;         // Restitution coefficient (0-1)
  dampingPerBounce?: number;   // Energy loss per bounce

  // Spring animation
  restPosition?: Position;     // Equilibrium position
  springStiffness?: number;    // Spring constant
  dampingCoefficient?: number; // Damping factor
  initialDisplacement?: Position;
  mass?: number;               // Mass of object

  // ========================================
  // WAVE-BASED ANIMATIONS
  // ========================================

  // Wave animation
  amplitude?: Position;        // Wave amplitude per axis
  frequency?: number;          // Wave frequency in Hz
  phaseOffset?: number;        // Phase offset in radians
  axisDirection?: Position;    // Direction of wave propagation
  waveType?: 'sine' | 'square' | 'triangle' | 'sawtooth';

  // Lissajous curves
  frequencyRatioA?: number;    // Frequency ratio numerator
  frequencyRatioB?: number;    // Frequency ratio denominator
  phaseDifference?: number;    // Phase difference in degrees
  amplitudeX?: number;
  amplitudeY?: number;
  amplitudeZ?: number;

  // Helix animation
  axisStart?: Position;        // Start point of helix axis
  axisEnd?: Position;          // End point of helix axis
  helixRadius?: number;        // Radius of helix
  helixPitch?: number;         // Height per rotation
  helixRotations?: number;     // Number of rotations

  // ========================================
  // CURVE & PATH-BASED ANIMATIONS
  // ========================================

  // Bézier curve
  bezierStart?: Position;
  bezierControl1?: Position;
  bezierControl2?: Position;
  bezierEnd?: Position;
  easingFunction?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

  // Catmull-Rom spline
  controlPoints?: Position[];  // Array of control points
  tension?: number;            // Tension parameter (0-1)
  closedLoop?: boolean;        // Whether path is closed

  // Zigzag animation
  zigzagStart?: Position;
  zigzagEnd?: Position;
  zigzagCount?: number;        // Number of zigs
  zigzagAmplitude?: number;    // Perpendicular amplitude
  zigzagPlane?: 'xy' | 'xz' | 'yz';

  // ========================================
  // ADVANCED PROCEDURAL ANIMATIONS
  // ========================================

  // Perlin/Simplex noise
  noiseFrequency?: number;     // Detail level
  noiseOctaves?: number;       // Layers of detail
  noisePersistence?: number;   // Amplitude decay per octave
  noiseScale?: number;         // Overall scale multiplier
  noiseSeed?: number;          // Random seed for reproducibility

  // Rose curve (Rhodonea)
  roseRadius?: number;
  petalCount?: number;         // k value (n/d for n petals)
  roseRotation?: number;       // Rotation in degrees

  // Epicycloid / Hypocycloid
  fixedCircleRadius?: number;  // Radius of fixed circle
  rollingCircleRadius?: number;// Radius of rolling circle
  rollingSpeed?: number;       // Speed of rolling
  rollingType?: 'epicycloid' | 'hypocycloid'; // Inside or outside

  // ========================================
  // MULTI-OBJECT & INTERACTIVE ANIMATIONS
  // ========================================

  // Orbit (multiple bodies)
  orbitalRadius?: number;      // Distance from center
  orbitalSpeed?: number;       // Speed of orbit
  orbitalPhase?: number;       // Phase offset in degrees
  inclination?: number;        // Orbital plane tilt

  // Formation / Flock
  leaderTrackId?: string;      // ID of leader track
  formationShape?: 'line' | 'v-shape' | 'circle' | 'grid';
  formationSpacing?: number;   // Distance between objects
  followStiffness?: number;    // How tightly to follow (0-1)

  // Attract / Repel
  targetPosition?: Position;   // Target to attract to
  attractionStrength?: number; // Force strength
  repulsionRadius?: number;    // Distance for repulsion
  maxSpeed?: number;           // Maximum velocity

  // ========================================
  // SPECIALIZED SPATIAL AUDIO ANIMATIONS
  // ========================================

  // Doppler path
  pathStart?: Position;
  pathEnd?: Position;
  passBySpeed?: number;        // Speed of pass-by
  closestApproach?: Position;  // Point of closest approach
  listenerPosition?: Position; // Listener location

  // Circular scan
  scanRadius?: number;
  scanHeight?: number;
  scanSpeed?: number;          // Revolutions per duration
  startAngleOffset?: number;
  sweepCount?: number;         // Number of complete sweeps

  // Zoom in/out
  zoomCenter?: Position;       // Center point
  startDistance?: number;      // Starting distance
  endDistance?: number;        // Ending distance
  accelerationCurve?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface Animation {
  id: string;
  name: string;
  type: AnimationType;
  duration: number;      // Duration in seconds
  loop: boolean;
  pingPong?: boolean;    // When true, animation plays forward then backward (requires loop)
  parameters: AnimationParameters;
  keyframes?: Keyframe[];
  coordinateSystem: CoordinateSystem;
}

export interface AnimationPreset {
  id: string;
  name: string;
  description?: string;
  category: 'physics' | 'wave' | 'curve' | 'procedural' | 'interactive' | 'spatial' | 'basic' | 'user';
  animation: Omit<Animation, 'id'>;
  thumbnail?: string;
  tags: string[];
  author?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface PresetLibrary {
  presets: AnimationPreset[];
  categories: string[];
}

export interface AnimationState {
  animation: Animation | null;
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  loop: boolean;
}

// ========================================
// TRACK MANAGEMENT
// ========================================

export type TrackType = 'sound-source' | 'group' | 'aux' | 'master';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  holophonixIndex?: number; // Numeric index for Holophonix OSC messages (1-based)
  position: Position;
  initialPosition?: Position; // Position before animation started (for return on stop)
  animationState: AnimationState | null;
  isMuted: boolean;
  isSolo: boolean;
  isSelected: boolean;
  volume: number;        // 0-1
  color?: Color;         // RGBA color from Holophonix device
  groupId?: string;      // For hierarchical grouping
  metadata?: Record<string, any>;
}

export interface Group {
  id: string;
  name: string;
  tracks: string[];     // Track IDs in this group
  animationState: AnimationState | null;
  isExpanded: boolean;
  isMuted: boolean;
  isSolo: boolean;
  relation: GroupRelation;
}

export type GroupRelation =
  | 'independent'      // Each track moves independently
  | 'leader-follower'  // One track leads, others follow
  | 'isobarycentric'   // All tracks move around a common center
  | 'formation';       // Maintain relative positions

export interface GroupPattern {
  type: 'range' | 'set' | 'union' | 'intersection';
  parameters: {
    start?: number;
    end?: number;
    trackIds?: string[];
    groupIds?: string[];
  };
}

// ========================================
// OSC COMMUNICATION
// ========================================

export interface OSCMessage {
  address: string;
  args: (number | string | boolean)[];
  timestamp?: number;
}

export interface OSCConnection {
  id: string;
  host: string;
  port: number;
  isConnected: boolean;
  lastMessage?: OSCMessage;
  messageCount: number;
  errorCount: number;
}

export interface OSCConfiguration {
  defaultPort: number;
  retryAttempts: number;
  messageTimeout: number;
  bufferSize: number;
  maxRetries: number;
}

// ========================================
// TIMELINE SYSTEM
// ========================================

export interface TimelineEvent {
  id: string;
  time: number;        // Time in seconds
  type: 'animation-start' | 'animation-end' | 'parameter-change' | 'marker';
  trackId?: string;
  groupId?: string;
  data?: Record<string, any>;
}

export interface Timeline {
  id: string;
  name: string;
  duration: number;    // Total duration in seconds
  events: TimelineEvent[];
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
}

// ========================================
// PRESET SYSTEM
// ========================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  groups: Group[];
  animations: Animation[];
  timelines: Timeline[];
  presets: AnimationPreset[];
  coordinateSystem: CoordinateSystem;
  oscConnections: OSCConnection[];
  metadata: {
    created: Date;
    modified: Date;
    version: string;
    author?: string;
  };
}

// ========================================
// RENDERING & VISUALIZATION
// ========================================

export interface RenderSettings {
  showGrid: boolean;
  showAxes: boolean;
  showTrails: boolean;
  trailLength: number;
  pointSize: number;
  animationSpeed: number;
  coordinateSystem: 'xyz' | 'aed';
}

export interface Viewport {
  camera: {
    position: Position;
    target: Position;
    fov: number;
    near: number;
    far: number;
  };
  controls: {
    enablePan: boolean;
    enableZoom: boolean;
    enableRotate: boolean;
  };
}

// ========================================
// REAL-TIME ENGINE
// ========================================

export interface EngineState {
  isRunning: boolean;
  frameRate: number;
  lastFrameTime: number;
  frameCount: number;
  averageFrameTime: number;
  memoryUsage: number;
}

export interface PerformanceMetrics {
  frameTime: number;
  renderTime: number;
  animationTime: number;
  oscTime: number;
  memoryUsage: number;
  droppedFrames: number;
}

// ========================================
// ELECTRON API TYPES
// ========================================

export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>

  // File operations
  showSaveDialog: () => Promise<any>
  showMessageBox: (options: any) => Promise<any>

  // Menu actions
  onMenuAction: (callback: (action: string, ...args: any[]) => void) => () => void

  // OSC communication
  oscConnect: (host: string, port: number) => Promise<{ success: boolean; message?: string; error?: string }>
  oscDisconnect: () => Promise<{ success: boolean; message?: string; error?: string }>
  oscSendMessage: (host: string, port: number, address: string, args: any[]) => Promise<{ success: boolean; message?: string; error?: string }>
  oscStartServer: (port: number) => Promise<{ success: boolean; message?: string; error?: string }>

  // Listen for incoming OSC messages
  onOSCMessageReceived: (callback: (message: OSCMessage) => void) => () => void

  // Project data operations
  saveProject: (projectData: any) => void
  loadProject: (filePath: string) => void
}

// Extend window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
