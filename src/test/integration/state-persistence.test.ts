import { StateManager } from '../../rust/src/lib';
import { Position, TrackParameters } from '../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('State Persistence Integration', () => {
    let stateManager: StateManager;
    let testSaveDir: string;

    beforeEach(() => {
        // Create a temporary directory for test saves
        testSaveDir = fs.mkdtempSync(path.join(os.tmpdir(), 'holophonix-test-'));
        stateManager = new StateManager(testSaveDir);
    });

    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(testSaveDir)) {
            fs.rmSync(testSaveDir, { recursive: true, force: true });
        }
    });

    it('should save and load track state', async () => {
        // Create a test track
        const trackId = 'test-track';
        const position: Position = { x: 0.5, y: -0.3, z: 0.1 };
        const trackParams: TrackParameters = {
            id: trackId,
            position,
            keyframes: []
        };

        // Add track to state
        await stateManager.add_track(trackParams);

        // Save state
        const savePath = await stateManager.save_state();
        expect(fs.existsSync(savePath)).toBeTruthy();

        // Create a new state manager and load state
        const newStateManager = new StateManager(testSaveDir);
        await newStateManager.load_state();

        // Verify track was loaded
        const loadedTrack = await newStateManager.get_track(trackId);
        expect(loadedTrack).toBeDefined();
        expect(loadedTrack?.position).toEqual(position);
    });

    it('should save and load animation state', async () => {
        const trackId = 'animated-track';
        const keyframes = [
            { time: 0, position: { x: 0, y: 0, z: 0 } },
            { time: 1000, position: { x: 1, y: 1, z: 0 } }
        ];

        const trackParams: TrackParameters = {
            id: trackId,
            position: { x: 0, y: 0, z: 0 },
            keyframes
        };

        // Add track with keyframes
        await stateManager.add_track(trackParams);

        // Save state
        const savePath = await stateManager.save_state();
        expect(fs.existsSync(savePath)).toBeTruthy();

        // Load state in new manager
        const newStateManager = new StateManager(testSaveDir);
        await newStateManager.load_state();

        // Verify track and keyframes were loaded
        const loadedTrack = await newStateManager.get_track(trackId);
        expect(loadedTrack).toBeDefined();
        expect(loadedTrack?.keyframes).toEqual(keyframes);
    });

    it('should handle multiple state saves', async () => {
        // Create initial state
        const track1Id = 'track1';
        await stateManager.add_track({
            id: track1Id,
            position: { x: 0, y: 0, z: 0 },
            keyframes: []
        });

        // Save initial state
        const save1Path = await stateManager.save_state();
        expect(fs.existsSync(save1Path)).toBeTruthy();

        // Modify state
        const track2Id = 'track2';
        await stateManager.add_track({
            id: track2Id,
            position: { x: 1, y: 1, z: 1 },
            keyframes: []
        });

        // Save modified state
        const save2Path = await stateManager.save_state();
        expect(fs.existsSync(save2Path)).toBeTruthy();

        // Load latest state
        const newStateManager = new StateManager(testSaveDir);
        await newStateManager.load_state();

        // Verify both tracks exist
        const track1 = await newStateManager.get_track(track1Id);
        const track2 = await newStateManager.get_track(track2Id);
        expect(track1).toBeDefined();
        expect(track2).toBeDefined();
    });

    it('should handle invalid save files', async () => {
        // Create an invalid save file
        const invalidSavePath = path.join(testSaveDir, 'invalid_state.json');
        fs.writeFileSync(invalidSavePath, 'invalid json content');

        // Attempt to load state
        const newStateManager = new StateManager(testSaveDir);
        await expect(newStateManager.load_state()).rejects.toThrow();
    });

    it('should cleanup old save files', async () => {
        // Create multiple saves
        for (let i = 0; i < 5; i++) {
            await stateManager.add_track({
                id: `track${i}`,
                position: { x: i, y: i, z: i },
                keyframes: []
            });
            await stateManager.save_state();
            // Add delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Clean up old saves
        await stateManager.cleanup_old_saves(3);

        // Count remaining save files
        const saveFiles = fs.readdirSync(testSaveDir).filter(f => f.endsWith('.json'));
        expect(saveFiles.length).toBe(3);
    });
});
