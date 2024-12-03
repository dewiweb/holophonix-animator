// Auto-generated bindings for Rust code
import { EventEmitter } from 'events';

export interface Position {
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    rz: number;
}

export interface Keyframe {
    time: number;
    position: Position;
    interpolation: string;
}

export interface Animation {
    track_id: string;
    duration: number;
    keyframes: Keyframe[];
}

export interface TimelineState {
    current_time: number;
    is_playing: boolean;
    loop_enabled: boolean;
}

export interface AnimationState {
    current_animation: Animation | null;
    timeline: TimelineState;
}

export interface OSCConfig {
    host: string;
    port: number;
    timeout_ms: number;
}

export interface OSCMessage {
    address: string;
    args: Array<number | string | Buffer>;
}

export enum ConnectionStatus {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Error = 'error'
}

export class AnimationEngine extends EventEmitter {
    constructor(osc_manager: OSCManager);
    load_animation(animation: Animation): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    reset(): Promise<void>;
    seek(time: number): Promise<void>;
    update(): Promise<void>;
    get_state(): Promise<AnimationState>;
    set_loop(enabled: boolean): Promise<void>;
}

export class OSCManager extends EventEmitter {
    constructor(config: OSCConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(message: OSCMessage): Promise<void>;
    is_connected(): boolean;
    update_config(config: OSCConfig): Promise<void>;
}
