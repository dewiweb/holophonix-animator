import { useState, useEffect, useRef } from 'react'
import { Animation, AnimationType, Keyframe, Track } from '@/types'
import { useProjectStore } from '@/stores/projectStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getDefaultAnimationParameters } from '../utils/defaultParameters'

export const useAnimationForm = (
  selectedTrack: Track | undefined, 
  currentAnimation: Animation | null,
  skipInitRef?: React.MutableRefObject<boolean>
) => {
  const { currentProject } = useProjectStore()
  const { animation: animationSettings } = useSettingsStore()
  const prevAnimationId = useRef<string | null>(null)

  const [animationForm, setAnimationForm] = useState<Partial<Animation>>({
    name: '',
    type: 'linear',
    duration: animationSettings.defaultAnimationDuration,
    loop: false,
    coordinateSystem: { type: currentProject?.coordinateSystem.type || 'xyz' },
    parameters: {}
  })

  const [keyframes, setKeyframes] = useState<Keyframe[]>([])
  const [originalAnimationParams, setOriginalAnimationParams] = useState<any>(null)
  const [pendingTypeChange, setPendingTypeChange] = useState<AnimationType | null>(null)

  // Load existing animation when a DIFFERENT animation is selected
  // DON'T reset form when animation becomes null (playback ends)
  useEffect(() => {
    // Skip initialization if state was just restored from tab switch
    if (skipInitRef?.current) {
      console.log('⏭️ Skipping form init - state already restored')
      return
    }
    
    const currentAnimationId = currentAnimation?.id || null
    
    // Only update form if animation ID actually changed to a different animation
    if (currentAnimationId && currentAnimationId !== prevAnimationId.current) {
      // Load existing animation into form
      setAnimationForm(currentAnimation!)
      setKeyframes(currentAnimation!.keyframes || [])
      setOriginalAnimationParams(currentAnimation!.parameters)
      prevAnimationId.current = currentAnimationId
    }
    // If currentAnimationId is null but we had an animation before,
    // DON'T reset - this means animation finished playing but user is still editing
  }, [selectedTrack?.id, currentAnimation, skipInitRef])

  // Update parameters when type changes (deferred to next render)
  useEffect(() => {
    if (!pendingTypeChange) return
    
    const currentPosition = animationForm.parameters?.startPosition || 
                           animationForm.parameters?.center || 
                           selectedTrack?.position || 
                           selectedTrack?.initialPosition || 
                           { x: 0, y: 0, z: 0 }
    
    const trackWithPosition = selectedTrack || { 
      position: currentPosition, 
      initialPosition: currentPosition 
    } as Track
    
    const defaultParams = getDefaultAnimationParameters(pendingTypeChange, trackWithPosition)
    
    setAnimationForm(prev => ({
      ...prev,
      parameters: defaultParams
    }))
    
    setPendingTypeChange(null)
  }, [pendingTypeChange, selectedTrack])

  const handleAnimationTypeChange = (type: AnimationType) => {
    // Update type immediately, defer parameter update to useEffect
    setAnimationForm(prev => ({
      ...prev,
      type
    }))
    
    // Trigger parameter update in next render
    setPendingTypeChange(type)
  }

  const handleResetToDefaults = () => {
    // Use functional update for consistency
    setAnimationForm(prev => {
      if (!prev.type) return prev
      
      // Preserve position when resetting to defaults
      const currentPosition = prev.parameters?.startPosition || 
                             prev.parameters?.center || 
                             selectedTrack?.position || 
                             selectedTrack?.initialPosition || 
                             { x: 0, y: 0, z: 0 }
      
      const trackWithPosition = selectedTrack || { 
        position: currentPosition, 
        initialPosition: currentPosition 
      } as Track
      
      const defaultParams = getDefaultAnimationParameters(prev.type, trackWithPosition)
      
      // Return new form object with reset parameters
      return {
        name: prev.name || '',
        type: prev.type,
        duration: prev.duration || 10,
        loop: prev.loop || false,
        pingPong: prev.pingPong || false,
        coordinateSystem: prev.coordinateSystem || { type: 'xyz' },
        parameters: { ...defaultParams }  // NEW object reference
      }
    })
  }

  return {
    animationForm,
    setAnimationForm,
    keyframes,
    setKeyframes,
    originalAnimationParams,
    setOriginalAnimationParams,
    handleAnimationTypeChange,
    handleResetToDefaults
  }
}
