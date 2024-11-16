import type { Position, AEDPosition } from '../types/behaviors';

export interface BehaviorImplementation {
    // Calculate the next position based on the current time
    update(time: number): Position | AEDPosition;

    // Reset the behavior to its initial state
    reset(): void;

    // Update behavior parameters
    setParameters(params: Record<string, number>): void;

    // Get current parameter values
    getParameters(): Record<string, number>;

    // Check if the behavior uses AED coordinates
    usesAED(): boolean;
}

export abstract class BaseBehavior implements BehaviorImplementation {
    protected parameters: Record<string, number>;
    protected startTime: number;
    protected useAED: boolean;

    constructor(params: Record<string, number>, useAED: boolean = false) {
        this.parameters = { ...params };
        this.startTime = Date.now();
        this.useAED = useAED;
    }

    abstract update(time: number): Position | AEDPosition;

    reset(): void {
        this.startTime = Date.now();
    }

    setParameters(params: Record<string, number>): void {
        this.parameters = { ...this.parameters, ...params };
    }

    getParameters(): Record<string, number> {
        return { ...this.parameters };
    }

    usesAED(): boolean {
        return this.useAED;
    }

    protected getElapsedTime(time: number): number {
        return (time - this.startTime) / 1000; // Convert to seconds
    }
}
