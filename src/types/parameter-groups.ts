import { ParameterDefinitions, ParameterUnit, ParameterMetadata } from './parameters';

export interface ParameterGroup {
  id: string;
  name: string;
  description: string;
  parameters: ParameterDefinitions;
  order?: string[]; // Optional parameter display order
}

export interface ParameterPreset {
  id: string;
  name: string;
  description: string;
  groupId: string;
  values: Record<string, number | string | boolean>;
}

export type ParameterGroups = Record<string, ParameterGroup>;
export type ParameterPresets = Record<string, ParameterPreset>;

// Common parameter groups
export const MOTION_PARAMETERS: ParameterGroup = {
  id: 'motion',
  name: 'Motion Parameters',
  description: 'Basic motion control parameters',
  parameters: {
    speed: {
      name: 'Speed',
      type: 'numeric',
      description: 'Movement speed',
      required: true,
      unit: ParameterUnit.METERS_PER_SECOND,
      defaultValue: 1,
      min: 0,
      max: 10,
      step: 0.1
    },
    direction: {
      name: 'Direction',
      type: 'enum',
      description: 'Movement direction',
      required: true,
      unit: ParameterUnit.NONE,
      defaultValue: 'forward',
      options: ['forward', 'backward', 'bidirectional']
    },
    loop: {
      name: 'Loop',
      type: 'boolean',
      description: 'Loop the motion',
      required: false,
      unit: ParameterUnit.NONE,
      defaultValue: true
    }
  },
  order: ['speed', 'direction', 'loop']
};

export const POSITION_PARAMETERS: ParameterGroup = {
  id: 'position',
  name: 'Position Parameters',
  description: 'Position and orientation parameters',
  parameters: {
    x: {
      name: 'X Position',
      type: 'numeric',
      description: 'Position on X axis',
      required: true,
      unit: ParameterUnit.METERS,
      defaultValue: 0,
      min: -10,
      max: 10,
      step: 0.1
    },
    y: {
      name: 'Y Position',
      type: 'numeric',
      description: 'Position on Y axis',
      required: true,
      unit: ParameterUnit.METERS,
      defaultValue: 0,
      min: -10,
      max: 10,
      step: 0.1
    },
    z: {
      name: 'Z Position',
      type: 'numeric',
      description: 'Position on Z axis',
      required: true,
      unit: ParameterUnit.METERS,
      defaultValue: 0,
      min: -10,
      max: 10,
      step: 0.1
    },
    orientation: {
      name: 'Orientation',
      type: 'numeric',
      description: 'Rotation around Y axis',
      required: false,
      unit: ParameterUnit.DEGREES,
      defaultValue: 0,
      min: -180,
      max: 180,
      step: 1
    }
  },
  order: ['x', 'y', 'z', 'orientation']
};

// Example presets
export const MOTION_PRESETS: Record<string, ParameterPreset> = {
  'slow-forward': {
    id: 'slow-forward',
    name: 'Slow Forward',
    description: 'Slow forward motion',
    groupId: 'motion',
    values: {
      speed: 0.5,
      direction: 'forward',
      loop: true
    }
  },
  'fast-bidirectional': {
    id: 'fast-bidirectional',
    name: 'Fast Bidirectional',
    description: 'Fast back-and-forth motion',
    groupId: 'motion',
    values: {
      speed: 2.0,
      direction: 'bidirectional',
      loop: true
    }
  }
};
