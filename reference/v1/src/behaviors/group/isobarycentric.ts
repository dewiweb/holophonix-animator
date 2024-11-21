import { BaseBehavior } from '../base';
import { GroupBehaviorBase, GroupMemberConfig } from './base';
import {
  HolophonixPosition,
  XYZPosition,
  createXYZPosition,
  getXValue,
  getYValue,
  getZValue
} from '../../types/position';
import { NumericParameterMetadata } from '../../types/parameters';

interface IsobarycentricConfig extends GroupMemberConfig {
  parameters: {
    weight: number;
    radius: number;
    phase: number;
    speed: number;
  };
}

const ISOBARYCENTRIC_PARAMETERS: Record<string, NumericParameterMetadata> = {
  weight: {
    type: 'number',
    min: 0,
    max: 10,
    defaultValue: 1,
    step: 0.1,
    unit: 'ratio',
    description: 'Weight of member in center calculation',
    label: 'Weight'
  },
  radius: {
    type: 'number',
    min: 0,
    max: 100,
    defaultValue: 10,
    step: 1,
    unit: 'meters',
    description: 'Radius of rotation around center',
    label: 'Radius'
  },
  phase: {
    type: 'number',
    min: 0,
    max: 360,
    defaultValue: 0,
    step: 1,
    unit: 'degrees',
    description: 'Phase offset of rotation',
    label: 'Phase'
  },
  speed: {
    type: 'number',
    min: -10,
    max: 10,
    defaultValue: 1,
    step: 0.1,
    unit: 'degrees_per_second',
    description: 'Angular velocity',
    label: 'Speed'
  }
};

export class IsobarycentricManager extends GroupBehaviorBase {
  private positionHistory: Map<number, XYZPosition[]> = new Map();

  constructor() {
    super(ISOBARYCENTRIC_PARAMETERS);
  }

  protected validateConfig(config: GroupMemberConfig): void {
    super.validateConfig(config);
    const isoConfig = config as IsobarycentricConfig;
    const { weight, radius, phase, speed } = isoConfig.parameters;

    if (typeof weight !== 'number' || weight < ISOBARYCENTRIC_PARAMETERS.weight.min || weight > ISOBARYCENTRIC_PARAMETERS.weight.max) {
      throw new Error(`Weight must be between ${ISOBARYCENTRIC_PARAMETERS.weight.min} and ${ISOBARYCENTRIC_PARAMETERS.weight.max}`);
    }

    if (typeof radius !== 'number' || radius < ISOBARYCENTRIC_PARAMETERS.radius.min || radius > ISOBARYCENTRIC_PARAMETERS.radius.max) {
      throw new Error(`Radius must be between ${ISOBARYCENTRIC_PARAMETERS.radius.min} and ${ISOBARYCENTRIC_PARAMETERS.radius.max}`);
    }

    if (typeof phase !== 'number' || phase < ISOBARYCENTRIC_PARAMETERS.phase.min || phase > ISOBARYCENTRIC_PARAMETERS.phase.max) {
      throw new Error(`Phase must be between ${ISOBARYCENTRIC_PARAMETERS.phase.min} and ${ISOBARYCENTRIC_PARAMETERS.phase.max}`);
    }

    if (typeof speed !== 'number' || speed < ISOBARYCENTRIC_PARAMETERS.speed.min || speed > ISOBARYCENTRIC_PARAMETERS.speed.max) {
      throw new Error(`Speed must be between ${ISOBARYCENTRIC_PARAMETERS.speed.min} and ${ISOBARYCENTRIC_PARAMETERS.speed.max}`);
    }
  }

  protected validateParameterValue(parameter: string, value: number | string, metadata: NumericParameterMetadata): boolean {
    if (typeof value !== 'number') {
      throw new Error(`${parameter} must be a number`);
    }

    if (value < metadata.min || value > metadata.max) {
      throw new Error(`${parameter} must be between ${metadata.min} and ${metadata.max}`);
    }

    return true;
  }

  protected calculateGroupPosition(positions: Map<number, XYZPosition>): HolophonixPosition {
    if (positions.size === 0) {
      return {
        type: 'xyz',
        coordinate: createXYZPosition(0, 0, 0)
      };
    }

    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    this.members.forEach((member, id) => {
      const config = member.getConfig() as IsobarycentricConfig;
      const pos = positions.get(id);
      if (!pos) return;

      const { weight } = config.parameters;

      sumX += pos.x * weight;
      sumY += pos.y * weight;
      sumZ += pos.z * weight;
      totalWeight += weight;
    });

    return {
      type: 'xyz',
      coordinate: createXYZPosition(
        sumX / totalWeight,
        sumY / totalWeight,
        sumZ / totalWeight
      )
    };
  }

  update(time: number): HolophonixPosition {
    const positions = new Map<number, XYZPosition>();

    this.members.forEach((member, id) => {
      try {
        const behavior = member.getBehavior();
        const config = member.getConfig() as IsobarycentricConfig;
        const basePos = behavior.update(time);
        const xyzPos = this.ensureXYZPosition(basePos);
        const { radius, phase, speed } = config.parameters;

        // Calculate orbital position
        const angle = (phase + speed * time) * (Math.PI / 180);
        const orbitX = xyzPos.x + radius * Math.cos(angle);
        const orbitY = xyzPos.y + radius * Math.sin(angle);
        const orbitZ = xyzPos.z;

        positions.set(id, createXYZPosition(orbitX, orbitY, orbitZ));
      } catch (error) {
        console.error(`Error updating member ${id}:`, error);
      }
    });

    return this.calculateGroupPosition(positions);
  }

  addMember(id: number, behavior: BaseBehavior, config: IsobarycentricConfig): void {
    super.addMember(id, behavior, config);
    this.positionHistory.set(id, []);
  }

  removeMember(id: number): void {
    super.removeMember(id);
    this.positionHistory.delete(id);
  }

  protected ensureXYZPosition(pos: HolophonixPosition): XYZPosition {
    if (pos.type === 'xyz') {
      return pos.coordinate;
    }
    throw new Error(`Unsupported coordinate system: ${pos.type}`);
  }
}
