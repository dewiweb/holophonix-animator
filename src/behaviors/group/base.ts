import { BaseBehavior } from '../base';
import { HolophonixPosition, XYZPosition, isXYZPosition, convertAEDtoXYZ } from '../../types/position';
import { ParameterMetadata, validateParameterValue, ParameterValidationError } from '../../types/parameters';

export type SyncStrategy = 'all' | 'none' | 'selective';
export type UpdateStrategy = 'sequential' | 'parallel';

export interface GroupMemberConfig {
  sync?: Record<string, boolean>;
  syncStrategy?: SyncStrategy;
  updateStrategy?: UpdateStrategy;
  parameterMapping?: Record<string, string>;
}

export interface GroupBehaviorState {
  time: number;
  parameters: Record<string, any>;
  memberStates: Map<number, any>;
}

export abstract class GroupBehaviorBase extends BaseBehavior {
  protected members: Map<number, BaseBehavior> = new Map();
  protected parameters: Record<string, number | string> = {};
  protected configs: Map<number, GroupMemberConfig> = new Map();
  protected state: GroupBehaviorState;

  constructor(parameters: Record<string, ParameterMetadata>) {
    super(parameters);
    this.state = {
      time: 0,
      parameters: {},
      memberStates: new Map()
    };
  }

  addMember(id: number, behavior: BaseBehavior, config: GroupMemberConfig = {}): void {
    const defaultConfig: GroupMemberConfig = {
      syncStrategy: 'selective',
      updateStrategy: 'sequential',
      sync: {},
      parameterMapping: {}
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    this.members.set(id, behavior);
    this.configs.set(id, finalConfig);
    this.syncMemberParameters(id, behavior, finalConfig);
  }

  removeMember(id: number): void {
    this.members.delete(id);
    this.configs.delete(id);
    this.state.memberStates.delete(id);
  }

  getMember(id: number): BaseBehavior | undefined {
    return this.members.get(id);
  }

  setParameterValue(parameter: string, value: number | string): void {
    const metadata = this.parameterDefinitions[parameter];
    if (!metadata) {
      throw new ParameterValidationError(`Unknown parameter: ${parameter}`);
    }

    if (!this.validateParameterValue(parameter, value, metadata)) {
      throw new ParameterValidationError(`Invalid value for parameter ${parameter}: ${value}`);
    }

    this.parameters[parameter] = value;
    this.members.forEach((member, id) => {
      const config = this.configs.get(id);
      if (config && this.shouldSync(parameter, config)) {
        const mappedParam = this.getMappedParameter(parameter, config);
        member.setParameterValue(mappedParam, value);
      }
    });
  }

  protected shouldSync(parameter: string, config: GroupMemberConfig): boolean {
    if (!config.syncStrategy || config.syncStrategy === 'all') return true;
    if (config.syncStrategy === 'none') return false;
    return config.sync?.[parameter] ?? true;
  }

  protected getMappedParameter(parameter: string, config: GroupMemberConfig): string {
    return config.parameterMapping?.[parameter] ?? parameter;
  }

  protected syncMemberParameters(id: number, member: BaseBehavior, config: GroupMemberConfig): void {
    Object.entries(this.parameters).forEach(([param, value]) => {
      if (this.shouldSync(param, config)) {
        const mappedParam = this.getMappedParameter(param, config);
        member.setParameterValue(mappedParam, value);
      }
    });
  }

  protected updateMembers(time: number): void {
    this.members.forEach((member, id) => {
      const config = this.configs.get(id);
      if (config?.updateStrategy === 'sequential') {
        const position = member.update(time);
        this.state.memberStates.set(id, position);
      }
    });

    if (this.members.size > 0) {
      const parallelMembers = Array.from(this.members.entries())
        .filter(([id]) => this.configs.get(id)?.updateStrategy === 'parallel');
      
      const positions = parallelMembers.map(([id, member]) => {
        const position = member.update(time);
        this.state.memberStates.set(id, position);
        return position;
      });
    }
  }

  abstract update(time: number): HolophonixPosition;
}
