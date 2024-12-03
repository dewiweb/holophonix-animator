import { StateManager } from '../../bindings';
import { Position, TrackParameters } from '../../types';

describe('State Manager Integration', () => {
    let stateManager: StateManager;

    beforeEach(() => {
        stateManager = new StateManager();
    });

    it('should add and retrieve tracks', async () => {
        const trackParams: TrackParameters = {
            id: 'track1',
            name: 'Test Track',
            position: { x: 0, y: 0, z: 0 }
        };

        const addResult = await stateManager.add_track(trackParams);
        expect(addResult).toBe(true);

        const track = await stateManager.get_track('track1');
        expect(track).toBeDefined();
        expect(track?.name).toBe('Test Track');
    });

    it('should update track positions', async () => {
        const trackParams: TrackParameters = {
            id: 'track1',
            name: 'Test Track',
            position: { x: 0, y: 0, z: 0 }
        };

        await stateManager.add_track(trackParams);

        const newPosition: Position = { x: 0.5, y: 0.5, z: 0.5 };
        const updateResult = await stateManager.update_track_position('track1', newPosition);
        expect(updateResult).toBe(true);

        const track = await stateManager.get_track('track1');
        expect(track?.position).toEqual(newPosition);
    });

    it('should remove tracks', async () => {
        const trackParams: TrackParameters = {
            id: 'track1',
            name: 'Test Track',
            position: { x: 0, y: 0, z: 0 }
        };

        await stateManager.add_track(trackParams);
        const removeResult = await stateManager.remove_track('track1');
        expect(removeResult).toBe(true);

        const track = await stateManager.get_track('track1');
        expect(track).toBeNull();
    });

    it('should save and load state', async () => {
        const trackParams: TrackParameters = {
            id: 'track1',
            name: 'Test Track',
            position: { x: 0.5, y: 0.5, z: 0.5 }
        };

        await stateManager.add_track(trackParams);
        
        const savePath = await stateManager.save_state();
        expect(savePath).toBeDefined();

        // Create new state manager to test loading
        const newStateManager = new StateManager();
        const loadResult = await newStateManager.load_state();
        expect(loadResult).toBe(true);

        const track = await newStateManager.get_track('track1');
        expect(track).toBeDefined();
        expect(track?.position).toEqual(trackParams.position);
    });

    it('should handle multiple tracks', async () => {
        const tracks = [
            { id: 'track1', name: 'Track 1', position: { x: 0.1, y: 0.1, z: 0.1 } },
            { id: 'track2', name: 'Track 2', position: { x: 0.2, y: 0.2, z: 0.2 } },
            { id: 'track3', name: 'Track 3', position: { x: 0.3, y: 0.3, z: 0.3 } }
        ];

        for (const track of tracks) {
            await stateManager.add_track(track);
        }

        for (const track of tracks) {
            const retrievedTrack = await stateManager.get_track(track.id);
            expect(retrievedTrack).toBeDefined();
            expect(retrievedTrack?.position).toEqual(track.position);
        }
    });

    it('should cleanup old saves', async () => {
        // Create multiple saves
        for (let i = 0; i < 5; i++) {
            await stateManager.save_state();
        }

        // Keep only 2 most recent saves
        await stateManager.cleanup_old_saves(2);

        // Verify cleanup (implementation-specific verification would be needed)
        const loadResult = await stateManager.load_state();
        expect(loadResult).toBe(true);
    });

    it('should handle invalid track operations gracefully', async () => {
        // Try to get non-existent track
        const track = await stateManager.get_track('nonexistent');
        expect(track).toBeNull();

        // Try to update non-existent track
        const updateResult = await stateManager.update_track_position(
            'nonexistent',
            { x: 0, y: 0, z: 0 }
        );
        expect(updateResult).toBe(false);

        // Try to remove non-existent track
        const removeResult = await stateManager.remove_track('nonexistent');
        expect(removeResult).toBe(false);
    });
});
