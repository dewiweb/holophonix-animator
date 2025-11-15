/**
 * Initialize synchronization between main process animation engine and renderer
 * Subscribes to position updates and animation stopped events
 */

import { getAnimationEngine, isUsingMainProcessEngine } from '@/utils/animationEngineAdapter'
import { useProjectStore } from './projectStore'
import { useAnimationStore } from './animationStore'

let isInitialized = false

export function initAnimationEngineSync() {
  if (isInitialized) {
    console.log('⚠️ Animation engine sync already initialized')
    return
  }
  
  if (!isUsingMainProcessEngine()) {
    console.log('ℹ️ Main process engine not enabled, skipping sync initialization')
    return
  }
  
  console.log('🔄 Initializing main process animation engine synchronization...')
  
  const engineAdapter = getAnimationEngine()
  
  // Subscribe to position updates from main engine
  const unsubscribePositions = engineAdapter.onPositionUpdate((updates) => {
    const projectStore = useProjectStore.getState()
    
    // Update track positions in UI
    updates.forEach(({ trackId, position }) => {
      projectStore.updateTrack(trackId, { position })
    })
  })
  
  // Subscribe to animation stopped events
  const unsubscribeStopped = engineAdapter.onAnimationStopped((animationId) => {
    console.log(`🛑 Main engine: Animation stopped ${animationId}`)
    const animationStore = useAnimationStore.getState()
    
    // Sync state with renderer
    const playingAnimations = new Map(animationStore.playingAnimations)
    playingAnimations.delete(animationId)
    
    animationStore.stopAnimation(animationId)
  })
  
  isInitialized = true
  console.log('✅ Main process animation engine sync initialized')
  
  // Return cleanup function
  return () => {
    unsubscribePositions()
    unsubscribeStopped()
    isInitialized = false
    console.log('🔌 Animation engine sync cleaned up')
  }
}
