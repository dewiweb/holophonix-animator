import { AnimationEngine, OSCManager, OSCConfig, Animation, Position, Keyframe } from '../../bindings';

describe('Animation Engine Integration', () => {
    let animationEngine: AnimationEngine;
    let oscManager: OSCManager;

    beforeEach(async () => {
        const config: OSCConfig = {
            host: 'localhost',
            port: 8000,
            timeout_ms: 1000
        };
        oscManager = new OSCManager(config);
        animationEngine = new AnimationEngine(oscManager);
        await animationEngine.initialize();
    });

    afterEach(async () => {
        await animationEngine.reset();
    });

    it('should manage playback state', async () => {
        const initialState = await animationEngine.get_state();
        expect(initialState.timeline.is_playing).toBe(false);
        
        // Create and load a test animation
        const testAnimation: Animation = {
            track_id: 'test_track',
            duration: 10,
            keyframes: [{
                time: 0,
                position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
                interpolation: 'linear'
            }]
        };
        await animationEngine.load_animation(testAnimation);
        
        await animationEngine.play();
        const playingState = await animationEngine.get_state();
        expect(playingState.timeline.is_playing).toBe(true);
        
        await animationEngine.pause();
        const pausedState = await animationEngine.get_state();
        expect(pausedState.timeline.is_playing).toBe(false);
    });

    it('should manage timeline position', async () => {
        // Create and load a test animation
        const testAnimation: Animation = {
            track_id: 'test_track',
            duration: 10,
            keyframes: [{
                time: 0,
                position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
                interpolation: 'linear'
            }]
        };
        await animationEngine.load_animation(testAnimation);
        
        await animationEngine.seek(5.0);
        const state = await animationEngine.get_state();
        expect(state.timeline.current_time).toBe(5.0);
        
        await animationEngine.reset();
        const resetState = await animationEngine.get_state();
        expect(resetState.timeline.current_time).toBe(0);
    });

    it('should handle keyframe management', async () => {
        const animation: Animation = {
            track_id: 'test_track',
            duration: 10,
            keyframes: [
                {
                    time: 0,
                    position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
                    interpolation: 'linear'
                },
                {
                    time: 5,
                    position: { x: 1, y: 1, z: 0, rx: 0, ry: 0, rz: 0 },
                    interpolation: 'linear'
                }
            ]
        };
        
        await animationEngine.load_animation(animation);
        const state = await animationEngine.get_state();
        expect(state.current_animation).toEqual(animation);
    });

    it('should maintain consistent playback speed', async () => {
        const testAnimation: Animation = {
            track_id: 'test_track',
            duration: 10,
            keyframes: [{
                time: 0,
                position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
                interpolation: 'linear'
            }]
        };
        await animationEngine.load_animation(testAnimation);
        
        const startTime = 0;
        await animationEngine.seek(startTime);
        await animationEngine.play();
        
        // Wait for a short time to let animation progress
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const state = await animationEngine.get_state();
        expect(state.timeline.current_time).toBeGreaterThan(startTime);
    });

    it('should handle loop mode', async () => {
        const testAnimation: Animation = {
            track_id: 'test_track',
            duration: 10,
            keyframes: [{
                time: 0,
                position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
                interpolation: 'linear'
            }]
        };
        await animationEngine.load_animation(testAnimation);
        
        await animationEngine.set_loop_mode(true);
        const state = await animationEngine.get_state();
        expect(state.timeline.loop_enabled).toBe(true);
        
        await animationEngine.set_loop_mode(false);
        const updatedState = await animationEngine.get_state();
        expect(updatedState.timeline.loop_enabled).toBe(false);
    });

    it('should handle empty animation state', async () => {
        const state = await animationEngine.get_state();
        expect(state.current_animation).toBeNull();
    });

    it('should handle rapid playback state changes', async () => {
        for (let i = 0; i < 5; i++) {
            await animationEngine.play();
            await animationEngine.pause();
        }
        const state = await animationEngine.get_state();
        expect(state.timeline.is_playing).toBe(false);
    });
});
