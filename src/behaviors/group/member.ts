import { BaseBehavior } from '../base';
import { HolophonixPosition } from '../../types/position';

export interface GroupMemberConfig {
  sync?: Record<string, boolean>;
}

export class GroupMember {
  private behavior: BaseBehavior;
  private config: GroupMemberConfig;
  private parameters: Record<string, number | string>;

  constructor(behavior: BaseBehavior, config: GroupMemberConfig = {}) {
    this.behavior = behavior;
    this.config = config;
    this.parameters = behavior.getParameters();
  }

  update(time: number): HolophonixPosition {
    return this.behavior.update(time);
  }

  getParameters(): Record<string, number | string> {
    return { ...this.parameters };
  }

  setParameter(name: string, value: number | string): void {
    if (this.config.sync?.[name] !== false) {
      this.parameters[name] = value;
      this.behavior.setParameterValue(name, value);
    }
  }

  shouldSync(parameter: string): boolean {
    return this.config.sync?.[parameter] !== false;
  }

  reset(): void {
    this.behavior.reset();
    this.parameters = this.behavior.getParameters();
  }
}
