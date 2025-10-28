import { useState } from 'react'
import { Keyframe, Position } from '@/types'

export const useKeyframeManagement = (keyframes: Keyframe[], setKeyframes: (keyframes: Keyframe[]) => void) => {
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null)
  const [isKeyframePlacementMode, setIsKeyframePlacementMode] = useState(false)

  const handleKeyframeAdd = (time: number, position: Position) => {
    const newKeyframe: Keyframe = {
      id: `keyframe-${Date.now()}`,
      time,
      position,
      interpolation: 'linear'
    }
    setKeyframes([...keyframes, newKeyframe].sort((a, b) => a.time - b.time))
  }

  const handleKeyframeRemove = (keyframeId: string) => {
    setKeyframes(keyframes.filter(k => k.id !== keyframeId))
  }

  const handleKeyframeUpdate = (keyframeId: string, updates: Partial<Keyframe>) => {
    setKeyframes(keyframes.map(k =>
      k.id === keyframeId ? { ...k, ...updates } : k
    ))
  }

  return {
    selectedKeyframeId,
    setSelectedKeyframeId,
    isKeyframePlacementMode,
    setIsKeyframePlacementMode,
    handleKeyframeAdd,
    handleKeyframeRemove,
    handleKeyframeUpdate,
    handleDeleteKeyframe: handleKeyframeRemove, // Alias for consistency
    handleLoadPreset: () => {} // Placeholder to satisfy expected interface
  }
}
