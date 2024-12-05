import { Position, Animation, Keyframe } from '../shared/types';
import { AnimationEngine as NativeAnimation } from '../bindings';

export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loop: boolean;
}

export class AnimationEngine {
  private native: NativeAnimation;
  private currentAnimation: Animation | null = null;

  constructor() {
    this.native = new NativeAnimation();
  }

  async initialize(): Promise<void> {
    // Nothing to initialize in native implementation
  }

  async load_animation(animation: Animation): Promise<void> {
    this.currentAnimation = animation;
    await this.native.add_animation(
      animation.track_id,
      animation.keyframes,
      animation.duration
    );
  }

  async play(): Promise<void> {
    if (!this.currentAnimation) {
      throw new Error('No animation loaded');
    }
    await this.native.play(this.currentAnimation.track_id);
  }

  async pause(): Promise<void> {
    if (!this.currentAnimation) {
      throw new Error('No animation loaded');
    }
    await this.native.pause(this.currentAnimation.track_id);
  }

  async stop(): Promise<void> {
    if (!this.currentAnimation) {
      throw new Error('No animation loaded');
    }
    await this.native.stop(this.currentAnimation.track_id);
  }

  async get_position(): Promise<Position> {
    if (!this.currentAnimation) {
      throw new Error('No animation loaded');
    }
    return await this.native.get_position(this.currentAnimation.track_id);
  }

  async get_position_at_time(time: number): Promise<Position> {
    if (!this.currentAnimation) {
      throw new Error('No animation loaded');
    }
    return await this.native.get_position_at_time(this.currentAnimation.track_id, time);
  }
}
