import { BehaviorImplementation } from '../base';
import { GroupBehaviorBase, GroupMemberConfig } from './base';
import { HolophonixPosition, XYZPosition, createXYZPosition } from '../../types/position';
import { ParameterMetadata } from '../../types/parameters';

export interface LeaderFollowerConfig extends GroupMemberConfig {
  delay: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
}

export class LeaderFollowerBehavior extends GroupBehaviorBase {
  private readonly leader: BehaviorImplementation;
  private readonly positionHistory: Map<number, XYZPosition[]> = new Map();
  private readonly historyTimes: number[] = [];

  constructor(leader: BehaviorImplementation) {
    super({
      delay: {
        type: 'number',
        min: 0,
        max: 10,
        step: 0.1,
        label: 'Delay',
        defaultValue: 0
      },
      scale: {
        type: 'number',
        min: 0,
        max: 2,
        step: 0.1,
        label: 'Scale',
        defaultValue: 1
      }
    });
    this.leader = leader;
  }

  update(time: number): HolophonixPosition {
    const leaderPos = this.ensureXYZPosition(this.leader.update(time));
    const positions = new Map<number, XYZPosition>();
    positions.set(0, leaderPos);

    // Store leader position in history
    this.historyTimes.push(time);
    if (!this.positionHistory.has(0)) {
      this.positionHistory.set(0, []);
    }
    this.positionHistory.get(0)!.push(leaderPos);

    // Clean up old history entries
    const maxDelay = Math.max(...Array.from(this.members.values()).map(member => 
      this.configs.get(member.id)?.delay || 0
    ));
    while (this.historyTimes[0] < time - maxDelay) {
      this.historyTimes.shift();
      for (const history of this.positionHistory.values()) {
        history.shift();
      }
    }

    // Calculate follower positions
    this.members.forEach((member, id) => {
      const config = this.configs.get(id) as LeaderFollowerConfig;
      const delay = config.delay || 0;
      const scale = config.scale || 1;
      
      // Get delayed position from history
      const delayedTime = time - delay;
      const historyIndex = this.historyTimes.findIndex(t => t >= delayedTime);
      if (historyIndex === -1) {
        positions.set(id, leaderPos); // Use current position if no history available
        return;
      }

      const delayedPos = this.positionHistory.get(0)![historyIndex];
      
      // Apply damping and scaling
      const dampedPos = createXYZPosition(
        leaderPos.x + (delayedPos.x - leaderPos.x) * scale,
        leaderPos.y + (delayedPos.y - leaderPos.y) * scale,
        leaderPos.z + (delayedPos.z - leaderPos.z) * scale
      );

      // Apply offsets
      const finalPos = createXYZPosition(
        dampedPos.x + (config.offsetX || 0),
        dampedPos.y + (config.offsetY || 0),
        dampedPos.z + (config.offsetZ || 0)
      );

      positions.set(id, finalPos);
    });

    return positions.get(0)!;
  }

  protected validateConfig(config: LeaderFollowerConfig): void {
    if (config.delay < 0 || config.delay > 10) {
      throw new Error(`Delay must be between 0 and 10 seconds`);
    }
    if (config.scale < 0 || config.scale > 2) {
      throw new Error(`Scale must be between 0 and 2`);
    }
  }
}
