export { DevOSCServer } from './DevOSCServer'
export * from './trackDiscovery'
export * from './deviceAvailability'
export * from './messageProcessor'
export * from './createInitialPreset'

// OSC utility modules
export { oscBatchManager } from './batchManager'
export type { OSCBatch, OSCMessage as OSCBatchMessage, OSCBatchStats } from './batchManager'
export { oscInputManager } from './inputManager'
export type { OSCInputStats } from './inputManager'
export { oscMessageOptimizer } from './messageOptimizer'
export type { TrackPositionUpdate, OSCOptimizationSettings } from './messageOptimizer'
