import { BaseBehavior } from '../base';
import { 
  HolophonixPosition, 
  XYZPosition, 
  createXYZPosition, 
  convertAEDtoXYZ, 
  convertXYZtoAED,
  getXValue,
  getYValue,
  getZValue
} from '../../types/position';
import { ParameterDefinitions } from '../../types/parameters';

interface FollowerConfig {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  delay: number;
  scale: number;
}

export class LeaderFollowerManager {
  private leader: BaseBehavior;
  private followers: Map<number, { behavior: BaseBehavior; config: FollowerConfig }>;
  private lastLeaderPosition: XYZPosition | null;

  constructor(leader: BaseBehavior) {
    this.leader = leader;
    this.followers = new Map();
    this.lastLeaderPosition = null;
  }

  addFollower(
    id: number,
    behavior: BaseBehavior,
    config: FollowerConfig
  ): void {
    this.followers.set(id, { behavior, config });
  }

  removeFollower(id: number): void {
    this.followers.delete(id);
  }

  private updateLeader(time: number): XYZPosition {
    const result = this.leader.update(time);
    if ('coordinate' in result && result.coordinate === 'xyz') {
      this.lastLeaderPosition = result as XYZPosition;
      return this.lastLeaderPosition;
    }
    // If not XYZ, convert from AED
    this.lastLeaderPosition = convertAEDtoXYZ(result);
    return this.lastLeaderPosition;
  }

  private calculateFollowerPosition(
    leaderPos: XYZPosition,
    config: FollowerConfig,
    time: number
  ): XYZPosition {
    // Apply delay
    const delayedTime = Math.max(0, time - config.delay);
    
    // Get the follower's base position
    const basePos = leaderPos;
    
    // Apply scaling
    const scaledPos = createXYZPosition(
      getXValue(basePos) * config.scale,
      getYValue(basePos) * config.scale,
      getZValue(basePos) * config.scale
    );
    
    // Apply offset
    return createXYZPosition(
      getXValue(scaledPos) + config.offsetX,
      getYValue(scaledPos) + config.offsetY,
      getZValue(scaledPos) + config.offsetZ
    );
  }

  update(time: number): Map<number, HolophonixPosition> {
    const positions = new Map<number, HolophonixPosition>();
    
    // Update leader
    const leaderPos = this.updateLeader(time);
    positions.set(-1, leaderPos);
    
    // Update followers
    this.followers.forEach(({ behavior, config }, id) => {
      const followerPos = this.calculateFollowerPosition(leaderPos, config, time);
      positions.set(id, followerPos);
    });
    
    return positions;
  }

  reset(): void {
    this.leader.reset();
    this.followers.forEach(({ behavior }) => behavior.reset());
    this.lastLeaderPosition = null;
  }
}

// Common parameters for leader-follower behaviors
export const LEADER_FOLLOWER_PARAMETERS: ParameterDefinitions = {
  delay: {
    min: 0,
    max: 10,
    default: 0,
    step: 0.1,
    unit: 'seconds',
    description: 'Time delay between leader and follower'
  },
  scale: {
    min: 0,
    max: 2,
    default: 1,
    step: 0.1,
    unit: 'normalized',
    description: 'Scaling factor for follower movement'
  },
  offsetX: {
    min: -100,
    max: 100,
    default: 0,
    step: 1,
    unit: 'meters',
    description: 'X offset from leader position'
  },
  offsetY: {
    min: -100,
    max: 100,
    default: 0,
    step: 1,
    unit: 'meters',
    description: 'Y offset from leader position'
  },
  offsetZ: {
    min: -100,
    max: 100,
    default: 0,
    step: 1,
    unit: 'meters',
    description: 'Z offset from leader position'
  }
};
