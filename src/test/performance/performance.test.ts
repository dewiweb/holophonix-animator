import { StateManager, AnimationEngine, OscManager } from '../../rust/src/lib';
import { Position, TrackParameters } from '../../shared/types';
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
    let stateManager: StateManager;
    let animationEngine: AnimationEngine;
    let oscManager: OscManager;

    beforeEach(() => {
        stateManager = new StateManager();
        animationEngine = new AnimationEngine();
        oscManager = new OscManager();
    });

    describe('Position Updates', () => {
        it('should update position within 5ms', async () => {
            const track: TrackParameters = {
                id: 'test-track',
                position: { x: 0, y: 0, z: 0 }
            };

            await stateManager.add_track(track);

            const newPosition: Position = { x: 0.5, y: 0.5, z: 0.5 };
            const start = performance.now();
            
            await stateManager.update_track_position(track.id, newPosition);
            await oscManager.send_position(newPosition);
            
            const end = performance.now();
            const duration = end - start;
            
            expect(duration).toBeLessThan(5); // Less than 5ms
        });

        it('should handle rapid position updates', async () => {
            const track: TrackParameters = {
                id: 'test-track',
                position: { x: 0, y: 0, z: 0 }
            };

            await stateManager.add_track(track);

            const updateCount = 100;
            const durations: number[] = [];

            for (let i = 0; i < updateCount; i++) {
                const newPosition: Position = {
                    x: Math.sin(i * Math.PI / 50),
                    y: Math.cos(i * Math.PI / 50),
                    z: 0
                };

                const start = performance.now();
                await stateManager.update_track_position(track.id, newPosition);
                await oscManager.send_position(newPosition);
                const end = performance.now();

                durations.push(end - start);
            }

            const averageDuration = durations.reduce((a, b) => a + b) / durations.length;
            expect(averageDuration).toBeLessThan(5); // Average less than 5ms
        });
    });

    describe('Animation Performance', () => {
        it('should maintain 60 FPS during animation', async () => {
            const frameTime = 1000 / 60; // ~16.67ms for 60 FPS
            const track: TrackParameters = {
                id: 'test-track',
                position: { x: 0, y: 0, z: 0 },
                keyframes: [
                    { time: 0, position: { x: 0, y: 0, z: 0 } },
                    { time: 1000, position: { x: 1, y: 1, z: 0 } }
                ]
            };

            await stateManager.add_track(track);
            await animationEngine.play();

            const frameTimes: number[] = [];
            const frameCount = 60; // Test one second of animation

            for (let i = 0; i < frameCount; i++) {
                const start = performance.now();
                
                await animationEngine.get_position_at_time(i * frameTime);
                
                const end = performance.now();
                frameTimes.push(end - start);
            }

            const maxFrameTime = Math.max(...frameTimes);
            expect(maxFrameTime).toBeLessThan(frameTime);
        });
    });

    describe('Memory Usage', () => {
        it('should stay under 100MB during heavy load', async () => {
            const trackCount = 50; // Create multiple tracks
            const keyframeCount = 100; // With many keyframes

            // Create tracks with keyframes
            for (let i = 0; i < trackCount; i++) {
                const keyframes = Array.from({ length: keyframeCount }, (_, j) => ({
                    time: j * 100,
                    position: {
                        x: Math.sin(j * Math.PI / 50),
                        y: Math.cos(j * Math.PI / 50),
                        z: 0
                    }
                }));

                const track: TrackParameters = {
                    id: `track-${i}`,
                    position: { x: 0, y: 0, z: 0 },
                    keyframes
                };

                await stateManager.add_track(track);
            }

            // Run animation
            await animationEngine.play();

            // Monitor memory usage
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
            
            expect(heapUsedMB).toBeLessThan(100); // Less than 100MB
        });
    });

    describe('OSC Latency', () => {
        it('should have OSC latency under 10ms', async () => {
            const messageCount = 100;
            const latencies: number[] = [];

            for (let i = 0; i < messageCount; i++) {
                const position: Position = {
                    x: Math.random() * 2 - 1,
                    y: Math.random() * 2 - 1,
                    z: Math.random() * 2 - 1
                };

                const start = performance.now();
                
                // Create and send OSC message
                const message = await oscManager.create_position_message(position);
                await oscManager.send_position(position);
                
                const end = performance.now();
                latencies.push(end - start);
            }

            const averageLatency = latencies.reduce((a, b) => a + b) / latencies.length;
            const maxLatency = Math.max(...latencies);

            expect(averageLatency).toBeLessThan(10); // Average under 10ms
            expect(maxLatency).toBeLessThan(20); // Max under 20ms
        });
    });

    describe('State Management', () => {
        it('should handle large state operations efficiently', async () => {
            const start = performance.now();

            // Create complex state
            const trackCount = 20;
            const keyframeCount = 50;

            for (let i = 0; i < trackCount; i++) {
                const keyframes = Array.from({ length: keyframeCount }, (_, j) => ({
                    time: j * 100,
                    position: {
                        x: Math.sin(j * Math.PI / 25),
                        y: Math.cos(j * Math.PI / 25),
                        z: Math.sin(j * Math.PI / 50)
                    }
                }));

                await stateManager.add_track({
                    id: `track-${i}`,
                    position: { x: 0, y: 0, z: 0 },
                    keyframes
                });
            }

            // Save state
            const savePath = await stateManager.save_state();

            // Clear and reload state
            const newStateManager = new StateManager();
            await newStateManager.load_state();

            const end = performance.now();
            const duration = end - start;

            // Entire operation should complete within 1 second
            expect(duration).toBeLessThan(1000);
        });
    });
});
