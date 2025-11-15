/**
 * Animation Engine Adapter
 * Provides abstraction layer to switch between renderer and main process engines
 * Feature flag: USE_MAIN_PROCESS_ENGINE
 */

import type { Animation, Position } from '@/types'
import type { PlayingAnimation } from '@/stores/animationStore'

// Feature flag - set to true to use main process engine (never throttled)
const USE_MAIN_PROCESS_ENGINE = true  // ✅ Enable for production-grade real-time performance

export interface AnimationEngineAdapter {
  isAvailable: () => boolean
  playAnimation: (playingAnimation: PlayingAnimation, projectData: any) => Promise<void>
  pauseAnimation: (animationId: string) => Promise<void>
  resumeAnimation: (animationId: string) => Promise<void>
  stopAnimation: (animationId: string) => Promise<void>
  stopAll: () => Promise<void>
  onPositionUpdate: (callback: (updates: PositionUpdate[]) => void) => () => void
  onAnimationStopped: (callback: (animationId: string) => void) => () => void
}

export interface PositionUpdate {
  trackId: string
  position: Position
  time: number
}

/**
 * Main Process Engine Adapter
 * Delegates to main process via IPC - never throttled
 */
class MainProcessEngineAdapter implements AnimationEngineAdapter {
  private positionUpdateCleanup: (() => void) | null = null
  private stoppedCleanup: (() => void) | null = null
  
  isAvailable(): boolean {
    const available = typeof window !== 'undefined' && !!(window as any).electronAPI?.animationEnginePlay
    console.log('🔍 Main Process Engine availability check:', {
      hasWindow: typeof window !== 'undefined',
      hasElectronAPI: !!(window as any).electronAPI,
      hasAnimationEnginePlay: !!(window as any).electronAPI?.animationEnginePlay,
      available
    })
    return available
  }
  
  async playAnimation(playingAnimation: PlayingAnimation, projectData: any): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('⚠️ Main process engine not available')
      return
    }
    
    const electronAPI = (window as any).electronAPI
    
    // Build snapshot for main process
    const snapshot = {
      animationId: playingAnimation.animationId,
      animation: {
        id: playingAnimation.animationId,
        ...projectData.animations.find((a: Animation) => a.id === playingAnimation.animationId)
      },
      tracks: playingAnimation.trackIds.map((trackId: string) => {
        const track = projectData.tracks.find((t: any) => t.id === trackId)
        return {
          trackId,
          holophonixIndex: track?.holophonixIndex || 0,
          initialPosition: track?.initialPosition || { x: 0, y: 0, z: 0 }
        }
      }),
      timingState: playingAnimation.timingState
    }
    
    // Set config
    await electronAPI.animationEngineSetConfig({
      coordinateSystem: projectData.currentProject?.coordinateSystem?.type || 'xyz',
      playbackSpeed: 1.0,
      oscUpdateRate: 30
    })
    
    // Play animation
    const result = await electronAPI.animationEnginePlay(snapshot)
    
    if (result.success) {
      console.log('✅ Main engine: Animation started', playingAnimation.animationId)
    } else {
      console.error('❌ Main engine: Failed to start animation', result.error)
    }
  }
  
  async pauseAnimation(animationId: string): Promise<void> {
    if (!this.isAvailable()) return
    
    const electronAPI = (window as any).electronAPI
    await electronAPI.animationEnginePause(animationId, Date.now())
  }
  
  async resumeAnimation(animationId: string): Promise<void> {
    if (!this.isAvailable()) return
    
    const electronAPI = (window as any).electronAPI
    await electronAPI.animationEngineResume(animationId, Date.now())
  }
  
  async stopAnimation(animationId: string): Promise<void> {
    console.log(`🔌 Adapter: Sending stop command to main process for ${animationId}`)
    if (!this.isAvailable()) {
      console.warn('⚠️ Main process engine not available for stop')
      return
    }
    
    const electronAPI = (window as any).electronAPI
    const result = await electronAPI.animationEngineStop(animationId)
    console.log(`✅ Adapter: Stop command sent, result:`, result)
  }
  
  async stopAll(): Promise<void> {
    console.log(`🔌 Adapter: Sending stop-all command to main process`)
    if (!this.isAvailable()) {
      console.warn('⚠️ Main process engine not available for stop-all')
      return
    }
    
    const electronAPI = (window as any).electronAPI
    const result = await electronAPI.animationEngineStopAll()
    console.log(`✅ Adapter: Stop-all command sent, result:`, result)
  }
  
  onPositionUpdate(callback: (updates: PositionUpdate[]) => void): () => void {
    if (!this.isAvailable()) return () => {}
    
    const electronAPI = (window as any).electronAPI
    this.positionUpdateCleanup = electronAPI.onAnimationPositionUpdate(callback)
    return () => {
      if (this.positionUpdateCleanup) {
        this.positionUpdateCleanup()
        this.positionUpdateCleanup = null
      }
    }
  }
  
  onAnimationStopped(callback: (animationId: string) => void): () => void {
    if (!this.isAvailable()) return () => {}
    
    const electronAPI = (window as any).electronAPI
    this.stoppedCleanup = electronAPI.onAnimationEngineStopped((data: { animationId: string }) => {
      callback(data.animationId)
    })
    return () => {
      if (this.stoppedCleanup) {
        this.stoppedCleanup()
        this.stoppedCleanup = null
      }
    }
  }
}

/**
 * Renderer Process Engine Adapter
 * Uses existing renderer-based engine (subject to throttling)
 */
class RendererProcessEngineAdapter implements AnimationEngineAdapter {
  isAvailable(): boolean {
    // Renderer engine is always available
    return true
  }
  
  async playAnimation(): Promise<void> {
    // Renderer engine is managed by animationStore.startEngine()
    // This is a no-op as the engine is already running
  }
  
  async pauseAnimation(): Promise<void> {
    // Managed by animationStore
  }
  
  async resumeAnimation(): Promise<void> {
    // Managed by animationStore
  }
  
  async stopAnimation(): Promise<void> {
    // Managed by animationStore
  }
  
  async stopAll(): Promise<void> {
    // Managed by animationStore
  }
  
  onPositionUpdate(): () => void {
    // Renderer engine updates positions directly via projectStore
    return () => {}
  }
  
  onAnimationStopped(): () => void {
    // Renderer engine manages this internally
    return () => {}
  }
}

/**
 * Get the appropriate engine adapter based on feature flag
 */
export function getAnimationEngine(): AnimationEngineAdapter {
  if (USE_MAIN_PROCESS_ENGINE) {
    const mainEngine = new MainProcessEngineAdapter()
    if (mainEngine.isAvailable()) {
      console.log('🎬 Using Main Process Animation Engine (production-grade, never throttled)')
      return mainEngine
    } else {
      console.warn('⚠️ Main process engine not available, falling back to renderer engine')
      return new RendererProcessEngineAdapter()
    }
  }
  
  console.log('🎬 Using Renderer Process Animation Engine (development mode)')
  return new RendererProcessEngineAdapter()
}

/**
 * Check if main process engine is active
 */
export function isUsingMainProcessEngine(): boolean {
  return USE_MAIN_PROCESS_ENGINE && new MainProcessEngineAdapter().isAvailable()
}
