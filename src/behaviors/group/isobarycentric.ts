import { BaseBehavior } from '../base';
import { 
  HolophonixPosition, 
  XYZPosition, 
  createXYZPosition, 
  convertAEDtoXYZ,
  isXYZPosition,
  getXValue,
  getYValue,
  getZValue
} from '../../types/position';
import { ParameterDefinitions } from '../../types/parameters';

interface MemberConfig {
  weight: number;
  radius: number;
  phase: number;
  speed: number;
}

export class IsobarycentricManager {
  private members: Map<number, { behavior: BaseBehavior; config: MemberConfig }>;
  private center: XYZPosition;

  constructor() {
    this.members = new Map();
    this.center = createXYZPosition(0, 0, 0);
  }

  addMember(
    id: number,
    behavior: BaseBehavior,
    config: MemberConfig
  ): void {
    this.members.set(id, { behavior, config });
    this.updateCenter();
  }

  removeMember(id: number): void {
    this.members.delete(id);
    this.updateCenter();
  }

  private updateCenter(): void {
    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    this.members.forEach(({ behavior, config }) => {
      const pos = behavior.update(0);
      const xyzPos = isXYZPosition(pos) ? pos : convertAEDtoXYZ(pos);
      
      sumX += getXValue(xyzPos) * config.weight;
      sumY += getYValue(xyzPos) * config.weight;
      sumZ += getZValue(xyzPos) * config.weight;
      totalWeight += config.weight;
    });

    if (totalWeight > 0) {
      this.center = createXYZPosition(
        sumX / totalWeight,
        sumY / totalWeight,
        sumZ / totalWeight
      );
    }
  }

  private calculateMemberPosition(
    basePos: XYZPosition,
    config: MemberConfig,
    time: number
  ): XYZPosition {
    // Calculate rotation angle based on time, speed, and phase
    const angle = (time * config.speed + config.phase) * (Math.PI / 180);
    
    // Calculate offset from center
    const offsetX = config.radius * Math.cos(angle);
    const offsetZ = config.radius * Math.sin(angle);
    
    return createXYZPosition(
      getXValue(basePos) + offsetX,
      getYValue(basePos),
      getZValue(basePos) + offsetZ
    );
  }

  update(time: number): Map<number, HolophonixPosition> {
    const positions = new Map<number, HolophonixPosition>();
    
    this.members.forEach(({ behavior, config }, id) => {
      const basePos = behavior.update(time);
      const xyzPos = isXYZPosition(basePos) ? basePos : convertAEDtoXYZ(basePos);
      const finalPos = this.calculateMemberPosition(xyzPos, config, time);
      positions.set(id, finalPos);
    });
    
    return positions;
  }

  reset(): void {
    this.members.forEach(({ behavior }) => behavior.reset());
    this.center = createXYZPosition(0, 0, 0);
  }
}

// Common parameters for isobarycentric behaviors
export const ISOBARYCENTRIC_PARAMETERS: ParameterDefinitions = {
  weight: {
    min: 0,
    max: 10,
    default: 1,
    step: 0.1,
    unit: 'normalized',
    description: 'Weight of member in center calculation'
  },
  radius: {
    min: 0,
    max: 100,
    default: 10,
    step: 1,
    unit: 'meters',
    description: 'Radius of rotation around center'
  },
  phase: {
    min: 0,
    max: 360,
    default: 0,
    step: 1,
    unit: 'degrees',
    description: 'Phase offset of rotation'
  },
  speed: {
    min: -10,
    max: 10,
    default: 1,
    step: 0.1,
    unit: 'degrees/second',
    description: 'Angular speed of rotation'
  }
};
