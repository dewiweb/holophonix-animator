import { BaseBehavior } from './base';
import { ParameterDefinitions, ParameterUnit } from '../types/parameters';
import { HolophonixPosition, createXYZPosition, createAEDPosition } from '../types/position';
import { ANGLE_RANGE, DISTANCE_RANGE } from '../types/parameters';

const CIRCULAR_PARAMETERS: ParameterDefinitions = {
  radius: {
    type: 'numeric',
    description: 'Radius of the circular path',
    label: 'Radius',
    unit: ParameterUnit.METERS,
    defaultValue: 1,
    min: DISTANCE_RANGE.min,
    max: DISTANCE_RANGE.max,
    step: 0.1
  },
  startAngle: {
    type: 'numeric',
    description: 'Starting angle of the circular motion',
    label: 'Start Angle',
    unit: ParameterUnit.DEGREES,
    defaultValue: 0,
    min: ANGLE_RANGE.min,
    max: ANGLE_RANGE.max,
    step: 1
  },
  speed: {
    type: 'numeric',
    description: 'Angular speed of the circular motion',
    label: 'Speed',
    unit: ParameterUnit.DEGREES_PER_SECOND,
    defaultValue: 90,
    min: -360,
    max: 360,
    step: 1
  },
  elevation: {
    type: 'numeric',
    description: 'Elevation angle of the circular plane',
    label: 'Elevation',
    unit: ParameterUnit.DEGREES,
    defaultValue: 0,
    min: -90,
    max: 90,
    step: 1
  }
};

export class CircularBehavior extends BaseBehavior {
  private currentAngle: number;

  constructor() {
    super(CIRCULAR_PARAMETERS);
    this.currentAngle = this.parameters.startAngle as number;
  }

  protected updatePosition(time: number): HolophonixPosition {
    const radius = this.parameters.radius as number;
    const speed = this.parameters.speed as number;
    const elevation = this.parameters.elevation as number;

    // Update current angle based on speed and time
    this.currentAngle += speed * time;

    // Keep angle within -180 to 180 range
    this.currentAngle = ((this.currentAngle + 180) % 360) - 180;

    if (this.coordinateSystem === 'aed') {
      return createAEDPosition(
        this.currentAngle,
        elevation,
        radius
      );
    } else {
      // Convert to Cartesian coordinates
      const elevationRad = (elevation * Math.PI) / 180;
      const azimuthRad = (this.currentAngle * Math.PI) / 180;
      
      const horizontalRadius = radius * Math.cos(elevationRad);
      
      return createXYZPosition(
        horizontalRadius * Math.cos(azimuthRad),
        horizontalRadius * Math.sin(azimuthRad),
        radius * Math.sin(elevationRad)
      );
    }
  }

  getParameterGroups() {
    return [
      {
        name: 'Path',
        description: 'Parameters defining the circular path',
        parameters: ['radius', 'elevation']
      },
      {
        name: 'Motion',
        description: 'Parameters controlling the motion',
        parameters: ['startAngle', 'speed']
      }
    ];
  }
}
