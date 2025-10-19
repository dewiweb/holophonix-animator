import { useState, useEffect } from 'react'
import { Animation, AnimationType, Keyframe, Track } from '@/types'
import { useProjectStore } from '@/stores/projectStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getDefaultAnimationParameters } from '../utils/defaultParameters'

export const useAnimationForm = (selectedTrack: Track | undefined, currentAnimation: Animation | null) => {
  const { currentProject } = useProjectStore()
  const { animation: animationSettings } = useSettingsStore()

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

  // Load existing animation when track is selected
  useEffect(() => {
    if (currentAnimation) {
      setAnimationForm(currentAnimation)
      setKeyframes(currentAnimation.keyframes || [])
      setOriginalAnimationParams(currentAnimation.parameters)
    } else {
      setAnimationForm({
        name: '',
        type: 'linear',
        duration: animationSettings.defaultAnimationDuration,
        loop: false,
        coordinateSystem: { type: currentProject?.coordinateSystem.type || 'xyz' },
        parameters: {}
      })
      setKeyframes([])
      setOriginalAnimationParams(null)
    }
  }, [selectedTrack?.id, currentAnimation, animationSettings.defaultAnimationDuration, currentProject?.coordinateSystem.type])

  const handleAnimationTypeChange = (type: AnimationType) => {
    setAnimationForm(prev => ({ ...prev, type }))
    const defaultParams = getDefaultAnimationParameters(type, selectedTrack ?? null)
    setAnimationForm(prev => ({ ...prev, parameters: defaultParams }))
  }

  const handleResetToDefaults = () => {
    if (!animationForm.type) return
    const defaultParams = getDefaultAnimationParameters(animationForm.type, selectedTrack ?? null)
    setAnimationForm(prev => ({ ...prev, parameters: defaultParams }))
  }

  return {
    animationForm,
    setAnimationForm,
    keyframes,
    setKeyframes,
    originalAnimationParams,
    handleAnimationTypeChange,
    handleResetToDefaults
  }
}
