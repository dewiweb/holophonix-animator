# Behavior System Implementation Plan 🗺️

## Overview

This document outlines the detailed implementation plan for the Holophonix Track Motion Animator's behavior system, including support for individual and group behaviors, multiple coordinate systems, and various operation modes.

## Related Documentation 📚

- [Development Guide](../development/README.md)
- [OSC Protocol Reference](../reference/osc.md)
- [Component Documentation](../components/)
  - [Fader Component](../components/Fader.md) - Used for behavior parameter control

## Implementation Phases

### Phase 1: Core Architecture Updates

1. **Base Behavior Refactoring**
   ```typescript
   abstract class BaseBehavior {
     abstract calculate(
       time: number,
       mode: BehaviorMode,
       reference?: Position
     ): HolophonixPosition;

     // Mode-specific parameter handling
     protected abstract getDefaultsForMode(mode: BehaviorMode): Record<string, number>;
     protected abstract validateForMode(
       params: Record<string, number>,
       mode: BehaviorMode
     ): ValidationResult;
   }
   ```

2. **Position Types Enhancement**
   ```typescript
   // Holophonix-specific position types
   interface HolophonixPosition {
     type: 'absolute' | 'relative';
     coordinate: 'xyz' | 'xy' | 'aed' | 'ae';
     values: {
       [key: string]: {
         value: number;
         increment?: boolean; // true for +, false for -
       };
     };
   }

   // Example XYZ position
   interface XYZPosition extends HolophonixPosition {
     coordinate: 'xyz';
     values: {
       x?: { value: number; increment?: boolean };
       y?: { value: number; increment?: boolean };
       z?: { value: number; increment?: boolean };
     };
   }

   // Example AED position
   interface AEDPosition extends HolophonixPosition {
     coordinate: 'aed';
     values: {
       azimuth?: { value: number; increment?: boolean };
       elevation?: { value: number; increment?: boolean };
       distance?: { value: number; increment?: boolean };
     };
   }
   ```

### Phase 2: Behavior Implementation Updates

1. **Linear Behavior**
   ```typescript
   class LinearBehavior extends BaseBehavior {
     calculate(time: number, mode: BehaviorMode): HolophonixPosition {
       const offset = this.calculateOffset(time);
       
       if (mode === 'absolute') {
         return {
           type: 'absolute',
           coordinate: 'xyz',
           values: {
             x: { value: offset.x },
             y: { value: offset.y },
             z: { value: offset.z }
           }
         };
       } else {
         return {
           type: 'relative',
           coordinate: 'xyz',
           values: {
             x: { value: Math.abs(offset.x), increment: offset.x >= 0 },
             y: { value: Math.abs(offset.y), increment: offset.y >= 0 },
             z: { value: Math.abs(offset.z), increment: offset.z >= 0 }
           }
         };
       }
     }
   }
   ```

2. **Sine Wave Behavior**
   ```typescript
   class SineWaveBehavior extends BaseBehavior {
     calculate(time: number, mode: BehaviorMode): HolophonixPosition {
       const wave = this.calculateWave(time);
       
       if (mode === 'absolute') {
         return {
           type: 'absolute',
           coordinate: 'xyz',
           values: {
             x: { value: wave.x },
             y: { value: wave.y },
             z: { value: wave.z }
           }
         };
       } else {
         return {
           type: 'relative',
           coordinate: 'xyz',
           values: {
             x: { value: Math.abs(wave.x), increment: wave.x >= 0 },
             y: { value: Math.abs(wave.y), increment: wave.y >= 0 },
             z: { value: Math.abs(wave.z), increment: wave.z >= 0 }
           }
         };
       }
     }
   }
   ```

3. **Circle Behavior**
   ```typescript
   class CircleBehavior extends BaseBehavior {
     calculate(time: number, mode: BehaviorMode): HolophonixPosition {
       const angle = this.calculateAngle(time);
       const position = this.getCirclePosition(angle);
       
       if (mode === 'absolute') {
         return {
           type: 'absolute',
           coordinate: 'xyz',
           values: {
             x: { value: position.x },
             y: { value: position.y },
             z: { value: position.z }
           }
         };
       } else {
         const delta = this.calculateDelta(position);
         return {
           type: 'relative',
           coordinate: 'xyz',
           values: {
             x: { value: Math.abs(delta.x), increment: delta.x >= 0 },
             y: { value: Math.abs(delta.y), increment: delta.y >= 0 },
             z: { value: Math.abs(delta.z), increment: delta.z >= 0 }
           }
         };
       }
     }
   }
   ```

### Phase 3: Group Behavior Implementation

1. **Leader/Follower Manager**
   ```typescript
   class LeaderFollowerManager {
     update(time: number): Map<number, HolophonixPosition> {
       const leaderPos = this.updateLeader(time);
       const positions = new Map<number, HolophonixPosition>();
       
       // Update followers with relative positions
       this.followers.forEach((follower, id) => {
         const delta = this.calculateFollowerDelta(leaderPos, follower);
         positions.set(id, {
           type: 'relative',
           coordinate: 'xyz',
           values: {
             x: { value: Math.abs(delta.x), increment: delta.x >= 0 },
             y: { value: Math.abs(delta.y), increment: delta.y >= 0 },
             z: { value: Math.abs(delta.z), increment: delta.z >= 0 }
           }
         });
       });
       
       return positions;
     }
   }
   ```

2. **Isobarycentric Manager**
   ```typescript
   class IsobarycentricManager {
     update(time: number): Map<number, HolophonixPosition> {
       const center = this.calculateCenter();
       const positions = new Map<number, HolophonixPosition>();
       
       this.tracks.forEach((track, id) => {
         const delta = this.calculateTrackDelta(center, track);
         positions.set(id, {
           type: 'relative',
           coordinate: 'xyz',
           values: {
             x: { value: Math.abs(delta.x), increment: delta.x >= 0 },
             y: { value: Math.abs(delta.y), increment: delta.y >= 0 },
             z: { value: Math.abs(delta.z), increment: delta.z >= 0 }
           }
         });
       });
       
       return positions;
     }
   }
   ```

### Phase 4: Coordinate System Integration

1. **Position Transformer**
   ```typescript
   class PositionTransformer {
     static toAED(pos: HolophonixPosition): AEDPosition;
     static toXYZ(pos: AEDPosition): XYZPosition;
     static transformRelative(
       delta: RelativePosition,
       from: CoordinateSystem,
       to: CoordinateSystem
     ): RelativePosition;
   }
   ```

2. **Validation System**
   ```typescript
   class PositionValidator {
     validateBounds(pos: HolophonixPosition): ValidationResult;
     validateRelativeMotion(
       delta: RelativePosition,
       current: HolophonixPosition
     ): ValidationResult;
   }
   ```

### Phase 5: Testing and Integration

1. **Unit Tests**
   ```typescript
   describe('BaseBehavior', () => {
     test('supports absolute mode', () => {});
     test('supports relative mode', () => {});
     test('handles reference positions', () => {});
     test('validates parameters by mode', () => {});
   });
   ```

2. **Integration Tests**
   ```typescript
   describe('GroupBehavior', () => {
     test('leader-follower formation', () => {});
     test('isobarycentric movement', () => {});
     test('group transitions', () => {});
     test('coordinate transformations', () => {});
   });
   ```

## Holophonix OSC Integration

### OSC Path Structure

1. **Position Paths**
   ```
   # Individual Coordinates
   /track/{id}/x {value}     # X coordinate
   /track/{id}/y {value}     # Y coordinate
   /track/{id}/z {value}     # Z coordinate
   
   /track/{id}/azim {value}  # Azimuth: -180° to +180°
   /track/{id}/elev {value}  # Elevation: -90° to +90°
   /track/{id}/dist {value}  # Distance: 0 to max_distance

   # Combined Coordinates
   /track/{id}/xyz {x} {y} {z}           # Full XYZ
   /track/{id}/xy {x} {y}                # XY only
   /track/{id}/aed {azim} {elev} {dist}  # Full AED
   /track/{id}/ae {azim} {elev}          # AE only
   ```

2. **Relative Movement Paths**
   ```
   # Individual Relative
   /track/{id}/x+ {delta}     # Increment X
   /track/{id}/x- {delta}     # Decrement X
   /track/{id}/y+ {delta}     # Increment Y
   /track/{id}/y- {delta}     # Decrement Y
   /track/{id}/z+ {delta}     # Increment Z
   /track/{id}/z- {delta}     # Decrement Z
   
   /track/{id}/azim+ {delta}  # Increment azimuth
   /track/{id}/azim- {delta}  # Decrement azimuth
   /track/{id}/elev+ {delta}  # Increment elevation
   /track/{id}/elev- {delta}  # Decrement elevation
   /track/{id}/dist+ {delta}  # Increment distance
   /track/{id}/dist- {delta}  # Decrement distance
   ```

### OSC Message Generator

```typescript
class OSCMessageGenerator {
  generatePositionMessages(
    trackId: number,
    position: HolophonixPosition
  ): OSCMessage[] {
    if (position.type === 'absolute') {
      return this.generateAbsoluteMessages(trackId, position);
    } else {
      return this.generateRelativeMessages(trackId, position);
    }
  }

  private generateAbsoluteMessages(
    trackId: number,
    position: HolophonixPosition
  ): OSCMessage[] {
    switch (position.coordinate) {
      case 'xyz':
        return [{
          address: `/track/${trackId}/xyz`,
          args: [
            position.values.x?.value || 0,
            position.values.y?.value || 0,
            position.values.z?.value || 0
          ]
        }];
      
      case 'xy':
        return [{
          address: `/track/${trackId}/xy`,
          args: [
            position.values.x?.value || 0,
            position.values.y?.value || 0
          ]
        }];
      
      case 'aed':
        return [{
          address: `/track/${trackId}/aed`,
          args: [
            position.values.azimuth?.value || 0,
            position.values.elevation?.value || 0,
            position.values.distance?.value || 0
          ]
        }];
      
      case 'ae':
        return [{
          address: `/track/${trackId}/ae`,
          args: [
            position.values.azimuth?.value || 0,
            position.values.elevation?.value || 0
          ]
        }];
      
      default:
        throw new Error(`Unsupported coordinate system: ${position.coordinate}`);
    }
  }

  private generateRelativeMessages(
    trackId: number,
    position: HolophonixPosition
  ): OSCMessage[] {
    const messages: OSCMessage[] = [];

    // Handle XYZ coordinates
    if (position.values.x) {
      messages.push({
        address: `/track/${trackId}/${position.values.x.increment ? 'x+' : 'x-'}`,
        args: [position.values.x.value]
      });
    }
    if (position.values.y) {
      messages.push({
        address: `/track/${trackId}/${position.values.y.increment ? 'y+' : 'y-'}`,
        args: [position.values.y.value]
      });
    }
    if (position.values.z) {
      messages.push({
        address: `/track/${trackId}/${position.values.z.increment ? 'z+' : 'z-'}`,
        args: [position.values.z.value]
      });
    }

    // Handle AED coordinates
    if (position.values.azimuth) {
      messages.push({
        address: `/track/${trackId}/${position.values.azimuth.increment ? 'azim+' : 'azim-'}`,
        args: [position.values.azimuth.value]
      });
    }
    if (position.values.elevation) {
      messages.push({
        address: `/track/${trackId}/${position.values.elevation.increment ? 'elev+' : 'elev-'}`,
        args: [position.values.elevation.value]
      });
    }
    if (position.values.distance) {
      messages.push({
        address: `/track/${trackId}/${position.values.distance.increment ? 'dist+' : 'dist-'}`,
        args: [position.values.distance.value]
      });
    }

    return messages;
  }

  // Query current position
  generatePositionQuery(
    trackId: number,
    coordinate: 'xyz' | 'xy' | 'aed' | 'ae'
  ): OSCMessage {
    return {
      address: '/get',
      args: [`track/${trackId}/${coordinate}`]
    };
  }
}
```

2. **Behavior Integration**
   ```typescript
   class BehaviorOSCBridge {
     private oscGenerator: OSCMessageGenerator;
     private oscClient: OSCClient;

     sendBehaviorUpdate(
       trackId: number,
       position: HolophonixPosition
     ): void {
       const messages = this.oscGenerator.generatePositionMessages(
         trackId,
         position
       );
       
       // Bundle messages for atomic update
       this.oscClient.sendBundle(messages);
     }
   }
   ```

3. **Group Behavior Integration**
   ```typescript
   class GroupBehaviorOSCBridge {
     private oscBridge: BehaviorOSCBridge;

     sendGroupUpdate(
       positions: Map<number, HolophonixPosition>
     ): void {
       positions.forEach((position, trackId) => {
         this.oscBridge.sendBehaviorUpdate(
           trackId,
           position
         );
       });
     }
   }
   ```

### Track Position Management

1. **Track Initial Position**
   ```typescript
   interface Track {
     id: number;
     initialPosition: {
       xyz?: { x: number; y: number; z: number };
       aed?: { azimuth: number; elevation: number; distance: number };
     };
     currentPosition: {
       xyz?: { x: number; y: number; z: number };
       aed?: { azimuth: number; elevation: number; distance: number };
     };
   }

   class TrackPositionManager {
     private tracks: Map<number, Track>;

     addTrack(
       id: number,
       position: { xyz?: XYZPosition; aed?: AEDPosition }
     ): void {
       this.tracks.set(id, {
         id,
         initialPosition: {
           xyz: position.xyz && {
             x: position.xyz.values.x.value,
             y: position.xyz.values.y.value,
             z: position.xyz.values.z.value
           },
           aed: position.aed && {
             azimuth: position.aed.values.azimuth.value,
             elevation: position.aed.values.elevation.value,
             distance: position.aed.values.distance.value
           }
         },
         currentPosition: { ...position } // Clone initial position
       });
     }

     getTrackPosition(id: number): Track['currentPosition'] {
       return this.tracks.get(id)?.currentPosition;
     }

     getInitialPosition(id: number): Track['initialPosition'] {
       return this.tracks.get(id)?.initialPosition;
     }

     resetToInitial(id: number): void {
       const track = this.tracks.get(id);
       if (track) {
         track.currentPosition = { ...track.initialPosition };
       }
     }
   }
   ```

2. **Behavior Integration with Initial Positions**
   ```typescript
   class BaseBehavior {
     protected trackManager: TrackPositionManager;

     calculate(
       trackId: number,
       time: number,
       mode: BehaviorMode
     ): HolophonixPosition {
       // Get reference position for calculations
       const referencePos = this.trackManager.getTrackPosition(trackId);
       
       // Calculate new position relative to reference
       const newPosition = this.calculatePosition(time, mode, referencePos);
       
       // Update track's current position
       this.updateTrackPosition(trackId, newPosition);
       
       return newPosition;
     }
   }
   ```

### Track Update Functionality

1. **Track Component Updates**
   ```typescript
   interface TrackComponentProps {
     trackId: number;
     onUpdateInitialPosition: () => void;
   }

   const TrackComponent: React.FC<TrackComponentProps> = ({ trackId, onUpdateInitialPosition }) => {
     return (
       <div className="track-container">
         {/* Existing track controls */}
         <button 
           className="update-position-btn"
           onClick={onUpdateInitialPosition}
           title="Update track's initial position to current Holophonix position"
         >
           Update Position
         </button>
       </div>
     );
   };
   ```

2. **Position Update Handler**
   ```typescript
   class TrackPositionManager {
     private oscClient: OSCClient;

     // Add query methods for current Holophonix position
     async queryHolophonixPosition(trackId: number): Promise<{
       xyz?: { x: number; y: number; z: number };
       aed?: { azimuth: number; elevation: number; distance: number };
     }> {
       // Query current position from Holophonix
       const xyzPromise = Promise.all([
         this.oscClient.query(`/track/${trackId}/xyz/x`),
         this.oscClient.query(`/track/${trackId}/xyz/y`),
         this.oscClient.query(`/track/${trackId}/xyz/z`)
       ]);

       const aedPromise = Promise.all([
         this.oscClient.query(`/track/${trackId}/aed/azimuth`),
         this.oscClient.query(`/track/${trackId}/aed/elevation`),
         this.oscClient.query(`/track/${trackId}/aed/distance`)
       ]);

       const [xyz, aed] = await Promise.all([xyzPromise, aedPromise]);
       
       return {
         xyz: {
           x: xyz[0],
           y: xyz[1],
           z: xyz[2]
         },
         aed: {
           azimuth: aed[0],
           elevation: aed[1],
           distance: aed[2]
         }
       };
     }

     async updateTrackInitialPosition(trackId: number): Promise<void> {
       try {
         const currentHolophonixPosition = await this.queryHolophonixPosition(trackId);
         
         const track = this.tracks.get(trackId);
         if (track) {
           // Update initial position
           track.initialPosition = currentHolophonixPosition;
           // Reset current position to match
           track.currentPosition = { ...currentHolophonixPosition };
           
           // Notify subscribers of update
           this.emitTrackUpdate(trackId);
         }
       } catch (error) {
         console.error(`Failed to update track ${trackId} position:`, error);
         throw new Error(`Failed to update track position: ${error.message}`);
       }
     }
   }
   ```

3. **Group Component Updates**
   ```typescript
   interface GroupComponentProps {
     groupId: string;
     trackIds: number[];
     onUpdateGroupPositions: () => void;
   }

   const GroupComponent: React.FC<GroupComponentProps> = ({ 
     groupId, 
     trackIds, 
     onUpdateGroupPositions 
   }) => {
     return (
       <div className="group-container">
         {/* Existing group controls */}
         <button 
           className="update-group-btn"
           onClick={onUpdateGroupPositions}
           title="Update all tracks' initial positions to current Holophonix positions"
         >
           Update Group Positions
         </button>
       </div>
     );
   };
   ```

4. **Group Position Update Handler**
   ```typescript
   class GroupBehaviorManager {
     private trackManager: TrackPositionManager;

     async updateGroupInitialPositions(trackIds: number[]): Promise<void> {
       try {
         // Update all tracks in parallel
         await Promise.all(
           trackIds.map(id => this.trackManager.updateTrackInitialPosition(id))
         );
         
         // Notify group update
         this.emitGroupUpdate(trackIds);
       } catch (error) {
         console.error('Failed to update group positions:', error);
         throw new Error(`Failed to update group positions: ${error.message}`);
       }
     }
   }
   ```

5. **Store Integration**
   ```typescript
   class AnimatorStore {
     private trackManager: TrackPositionManager;
     private groupManager: GroupBehaviorManager;

     async handleTrackPositionUpdate(trackId: number): Promise<void> {
       try {
         await this.trackManager.updateTrackInitialPosition(trackId);
         // Update UI state
         this.updateTrackState(trackId);
       } catch (error) {
         // Handle error (show notification, etc.)
         this.handleError(error);
       }
     }

     async handleGroupPositionUpdate(groupId: string): Promise<void> {
       try {
         const group = this.getGroup(groupId);
         if (group) {
           await this.groupManager.updateGroupInitialPositions(group.trackIds);
           // Update UI state
           this.updateGroupState(groupId);
         }
       } catch (error) {
         // Handle error (show notification, etc.)
         this.handleError(error);
       }
     }
   }
   ```

6. **UI Integration**
   ```typescript
   // Track list component
   const TrackList: React.FC = () => {
     const store = useAnimatorStore();
     
     const handleTrackUpdate = async (trackId: number) => {
       try {
         await store.handleTrackPositionUpdate(trackId);
         // Show success notification
         showNotification('Track position updated successfully');
       } catch (error) {
         // Show error notification
         showErrorNotification(error.message);
       }
     };

     return (
       <div className="track-list">
         {store.tracks.map(track => (
           <TrackComponent
             key={track.id}
             trackId={track.id}
             onUpdateInitialPosition={() => handleTrackUpdate(track.id)}
           />
         ))}
       </div>
     );
   };

   // Group list component
   const GroupList: React.FC = () => {
     const store = useAnimatorStore();
     
     const handleGroupUpdate = async (groupId: string) => {
       try {
         await store.handleGroupPositionUpdate(groupId);
         // Show success notification
         showNotification('Group positions updated successfully');
       } catch (error) {
         // Show error notification
         showErrorNotification(error.message);
       }
     };

     return (
       <div className="group-list">
         {store.groups.map(group => (
           <GroupComponent
             key={group.id}
             groupId={group.id}
             trackIds={group.trackIds}
             onUpdateGroupPositions={() => handleGroupUpdate(group.id)}
           />
         ))}
       </div>
     );
   };
   ```

### Behavior Stop and Return Interpolation

1. **Interpolation Manager**
   ```typescript
   interface InterpolationConfig {
     duration: number;    // Duration in milliseconds
     easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
     fps?: number;       // Default: 60
   }

   class InterpolationManager {
     private static DEFAULT_CONFIG: InterpolationConfig = {
       duration: 1000,
       easing: 'easeInOut',
       fps: 60
     };

     calculateProgress(
       elapsed: number,
       duration: number,
       easing: InterpolationConfig['easing']
     ): number {
       const t = Math.min(elapsed / duration, 1);
       
       switch (easing) {
         case 'linear':
           return t;
         case 'easeInOut':
           return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
         case 'easeIn':
           return t * t;
         case 'easeOut':
           return t * (2 - t);
         default:
           return t;
       }
     }

     interpolatePosition(
       start: HolophonixPosition,
       end: HolophonixPosition,
       progress: number
     ): HolophonixPosition {
       if (start.coordinate !== end.coordinate) {
         // Convert to same coordinate system first
         end = this.convertCoordinates(end, start.coordinate);
       }

       const result: HolophonixPosition = {
         type: 'relative',
         coordinate: start.coordinate,
         values: {}
       };

       // Interpolate each value
       Object.keys(start.values).forEach(key => {
         const startVal = start.values[key].value;
         const endVal = end.values[key].value;
         const delta = endVal - startVal;
         const currentVal = startVal + (delta * progress);

         result.values[key] = {
           value: Math.abs(currentVal - startVal),
           increment: currentVal >= startVal
         };
       });

       return result;
     }
   }
   ```

2. **Behavior Stop Handler**
   ```typescript
   class BehaviorManager {
     private interpolationManager: InterpolationManager;
     private trackManager: TrackPositionManager;
     private animationFrameId: number | null = null;

     async stopBehavior(
       trackId: number,
       config?: Partial<InterpolationConfig>
     ): Promise<void> {
       const track = this.trackManager.getTrack(trackId);
       if (!track) return;

       const currentPosition = await this.trackManager.queryHolophonixPosition(trackId);
       const initialPosition = track.initialPosition;

       const fullConfig = {
         ...InterpolationManager.DEFAULT_CONFIG,
         ...config
       };

       let startTime: number | null = null;

       const animate = (timestamp: number) => {
         if (!startTime) startTime = timestamp;
         const elapsed = timestamp - startTime;

         const progress = this.interpolationManager.calculateProgress(
           elapsed,
           fullConfig.duration,
           fullConfig.easing
         );

         const interpolatedPosition = this.interpolationManager.interpolatePosition(
           currentPosition,
           initialPosition,
           progress
         );

         // Send OSC messages for interpolated position
         this.sendPositionUpdate(trackId, interpolatedPosition);

         if (progress < 1) {
           this.animationFrameId = requestAnimationFrame(animate);
         } else {
           this.animationFrameId = null;
           // Ensure we're exactly at initial position
           this.sendPositionUpdate(trackId, {
             type: 'absolute',
             coordinate: initialPosition.coordinate,
             values: initialPosition.values
           });
         }
       };

       // Start animation
       this.animationFrameId = requestAnimationFrame(animate);
     }

     private sendPositionUpdate(
       trackId: number,
       position: HolophonixPosition
     ): void {
       const messages = this.oscGenerator.generatePositionMessages(
         trackId,
         position
       );
       this.oscClient.sendBundle(messages);
     }
   }
   ```

3. **Group Stop Handler**
   ```typescript
   class GroupBehaviorManager {
     private behaviorManager: BehaviorManager;

     async stopGroupBehavior(
       trackIds: number[],
       config?: Partial<InterpolationConfig>
     ): Promise<void> {
       // Stop all tracks in parallel
       await Promise.all(
         trackIds.map(id => this.behaviorManager.stopBehavior(id, config))
       );
     }
   }
   ```

4. **UI Integration**
   ```typescript
   interface StopButtonProps {
     trackId: number;
     isGroup?: boolean;
     onStopClick: () => void;
     isReturning: boolean;
   }

   const StopButton: React.FC<StopButtonProps> = ({
     trackId,
     isGroup,
     onStopClick,
     isReturning
   }) => {
     return (
       <button
         className={`stop-btn ${isReturning ? 'returning' : ''}`}
         onClick={onStopClick}
         disabled={isReturning}
       >
         {isReturning ? 'Returning...' : 'Stop'}
       </button>
     );
   };

   // Track component integration
   const TrackComponent: React.FC<TrackComponentProps> = ({ trackId }) => {
     const [isReturning, setIsReturning] = useState(false);
     const store = useAnimatorStore();

     const handleStop = async () => {
       setIsReturning(true);
       try {
         await store.stopTrackBehavior(trackId);
       } catch (error) {
         showErrorNotification(error.message);
       } finally {
         setIsReturning(false);
       }
     };

     return (
       <div className="track-container">
         {/* Other controls */}
         <StopButton
           trackId={trackId}
           onStopClick={handleStop}
           isReturning={isReturning}
         />
       </div>
     );
   };
   ```

### Behavior Start Interpolation

1. **Behavior Start Handler**
   ```typescript
   class BehaviorManager {
     private interpolationManager: InterpolationManager;
     private trackManager: TrackPositionManager;
     private activeInterpolations: Map<number, number> = new Map(); // trackId -> animationFrameId

     async startBehavior(
       trackId: number,
       behavior: BaseBehavior,
       mode: BehaviorMode,
       config?: Partial<InterpolationConfig>
     ): Promise<void> {
       const track = this.trackManager.getTrack(trackId);
       if (!track) return;

       // Only interpolate in absolute mode
       if (mode === 'absolute') {
         await this.interpolateToStartPosition(trackId, behavior, config);
       } else {
         // For relative mode, start behavior immediately
         this.startBehaviorExecution(trackId, behavior);
       }
     }

     private async interpolateToStartPosition(
       trackId: number,
       behavior: BaseBehavior,
       config?: Partial<InterpolationConfig>
     ): Promise<void> {
       // Get current position from Holophonix
       const currentPosition = await this.trackManager.queryHolophonixPosition(trackId);
       
       // Calculate behavior's starting position
       const startPosition = behavior.calculateStartPosition();

       const fullConfig = {
         ...InterpolationManager.DEFAULT_CONFIG,
         ...config
       };

       return new Promise((resolve, reject) => {
         let startTime: number | null = null;

         const animate = (timestamp: number) => {
           if (!startTime) startTime = timestamp;
           const elapsed = timestamp - startTime;

           const progress = this.interpolationManager.calculateProgress(
             elapsed,
             fullConfig.duration,
             fullConfig.easing
           );

           const interpolatedPosition = this.interpolationManager.interpolatePosition(
             currentPosition,
             startPosition,
             progress
           );

           // Send OSC messages for interpolated position
           this.sendPositionUpdate(trackId, interpolatedPosition);

           if (progress < 1) {
             const frameId = requestAnimationFrame(animate);
             this.activeInterpolations.set(trackId, frameId);
           } else {
             this.activeInterpolations.delete(trackId);
             // Start the actual behavior
             this.startBehaviorExecution(trackId, behavior);
             resolve();
           }
         };

         const frameId = requestAnimationFrame(animate);
         this.activeInterpolations.set(trackId, frameId);
       });
     }

     private startBehaviorExecution(trackId: number, behavior: BaseBehavior): void {
       // Start the behavior's execution loop
       behavior.start();
     }

     cancelInterpolation(trackId: number): void {
       const frameId = this.activeInterpolations.get(trackId);
       if (frameId) {
         cancelAnimationFrame(frameId);
         this.activeInterpolations.delete(trackId);
       }
     }
   }
   ```

2. **Base Behavior Updates**
   ```typescript
   abstract class BaseBehavior {
     abstract calculateStartPosition(): HolophonixPosition;
     
     protected getStartPosition(): HolophonixPosition {
       // Calculate the initial position for this behavior
       // This will be the target for interpolation in absolute mode
       return {
         type: 'absolute',
         coordinate: this.preferredCoordinate,
         values: this.calculateInitialValues()
       };
     }

     protected abstract calculateInitialValues(): Record<string, { value: number }>;
   }
   ```

3. **Behavior Implementation Example**
   ```typescript
   class CircleBehavior extends BaseBehavior {
     calculateStartPosition(): HolophonixPosition {
       const radius = this.parameters.radius;
       const startAngle = this.parameters.startAngle;
       
       return {
         type: 'absolute',
         coordinate: 'xyz',
         values: {
           x: { value: radius * Math.cos(startAngle) },
           y: { value: radius * Math.sin(startAngle) },
           z: { value: this.parameters.height }
         }
       };
     }
   }

   class LinearBehavior extends BaseBehavior {
     calculateStartPosition(): HolophonixPosition {
       return {
         type: 'absolute',
         coordinate: 'xyz',
         values: {
           x: { value: this.parameters.startX },
           y: { value: this.parameters.startY },
           z: { value: this.parameters.startZ }
         }
       };
     }
   }
   ```

4. **UI Integration**
   ```typescript
   interface StartButtonProps {
     trackId: number;
     onStartClick: () => void;
     isInterpolating: boolean;
   }

   const StartButton: React.FC<StartButtonProps> = ({
     trackId,
     onStartClick,
     isInterpolating
   }) => {
     return (
       <button
         className={`start-btn ${isInterpolating ? 'interpolating' : ''}`}
         onClick={onStartClick}
         disabled={isInterpolating}
       >
         {isInterpolating ? 'Moving to start...' : 'Start'}
       </button>
     );
   };

   // Track component integration
   const TrackComponent: React.FC<TrackComponentProps> = ({ trackId }) => {
     const [isInterpolating, setIsInterpolating] = useState(false);
     const store = useAnimatorStore();

     const handleStart = async () => {
       setIsInterpolating(true);
       try {
         await store.startTrackBehavior(trackId);
       } catch (error) {
         showErrorNotification(error.message);
       } finally {
         setIsInterpolating(false);
       }
     };

     return (
       <div className="track-container">
         {/* Other controls */}
         <StartButton
           trackId={trackId}
           onStartClick={handleStart}
           isInterpolating={isInterpolating}
         />
       </div>
     );
   };
   ```

### Implementation Considerations

1. **Start Position Calculation**
   - Each behavior defines its start position
   - Handle coordinate system preferences
   - Support both XYZ and AED formats
   - Validate position boundaries

2. **Interpolation Control**
   - Smooth transition to start position
   - Cancellable interpolation
   - Progress feedback
   - Error handling

3. **Mode Handling**
   - Only interpolate in absolute mode
   - Immediate start in relative mode
   - Clear mode transitions
   - State management

4. **Performance**
   - Efficient animation frames
   - Smooth transitions
   - Resource cleanup
   - Memory management

### Success Criteria

1. **Functionality**
   - All behaviors support both modes
   - Group operations work correctly
   - Coordinate transformations are precise
   - Parameter validation is comprehensive

2. **Performance**
   - Smooth real-time updates
   - Efficient group calculations
   - Low memory overhead
   - Quick mode switching

3. **Reliability**
   - Comprehensive error handling
   - Predictable behavior
   - Safe coordinate conversion
   - Stable group operations

4. **Maintainability**
   - Clear documentation
   - Type safety
   - Test coverage
   - Code organization

## Dependencies

1. **Core System**
   - TypeScript 4.x
   - React for UI
   - Electron for desktop

2. **Testing**
   - Jest for unit testing
   - React Testing Library
   - Performance monitoring tools

3. **Development Tools**
   - ESLint for code quality
   - Prettier for formatting
   - TypeDoc for documentation

## Risk Assessment

1. **Technical Risks**
   - Complex coordinate transformations
   - Real-time performance with large groups
   - Precision in floating-point calculations

2. **Mitigation Strategies**
   - Comprehensive testing suite
   - Performance profiling
   - Error boundary implementation
   - Fallback mechanisms

## Future Considerations

1. **Extensibility**
   - Plugin system for custom behaviors
   - Additional coordinate systems
   - Advanced group formations

2. **Performance Optimization**
   - WebAssembly for calculations
   - Worker threads for group operations
   - Caching strategies

3. **Feature Expansion**
   - 3D visualization
   - Behavior recording
   - Path prediction
   - Collision avoidance
