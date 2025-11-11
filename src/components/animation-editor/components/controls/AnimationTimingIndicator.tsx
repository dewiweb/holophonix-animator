/**
 * Animation Timing Indicator
 * 
 * Visual display of current animation timing state:
 * - Loop count
 * - Direction (ping-pong: forward/backward)
 * - Progress through current cycle
 * - Pause state
 */

import React, { useEffect, useState } from 'react'
import { useAnimationStore } from '@/stores/animationStore'
import { useProjectStore } from '@/stores/projectStore'
import { calculateAnimationTime } from '@/utils/animationTiming'
import { cn } from '@/utils'
import { ArrowRight, ArrowLeft, Pause } from 'lucide-react'

interface AnimationTimingIndicatorProps {
  animationId?: string | null
  className?: string
}

interface TimingDisplayState {
  loopCount: number
  isReversed: boolean
  progress: number
  isPaused: boolean
  animationTime: number
  duration: number
}

export const AnimationTimingIndicator: React.FC<AnimationTimingIndicatorProps> = ({
  animationId,
  className
}) => {
  const [timingState, setTimingState] = useState<TimingDisplayState | null>(null)
  
  useEffect(() => {
    if (!animationId) {
      setTimingState(null)
      return
    }
    
    // Update timing display at 10 FPS (every 100ms) to avoid excessive renders
    const interval = setInterval(() => {
      const animationStore = useAnimationStore.getState()
      const projectStore = useProjectStore.getState()
      
      const playingAnimation = animationStore.playingAnimations.get(animationId)
      const animation = projectStore.animations.find(a => a.id === animationId)
      
      if (!playingAnimation || !animation) {
        setTimingState(null)
        return
      }
      
      // Calculate current timing state
      const result = calculateAnimationTime(
        Date.now(),
        animation,
        playingAnimation.timingState
      )
      
      setTimingState({
        loopCount: result.loopCount,
        isReversed: result.isReversed,
        progress: result.progress,
        isPaused: result.newState.isPaused,
        animationTime: result.animationTime,
        duration: animation.duration
      })
    }, 100) // 10 FPS update rate
    
    return () => clearInterval(interval)
  }, [animationId])
  
  if (!timingState || !animationId) {
    return null
  }
  
  const { loopCount, isReversed, progress, isPaused, animationTime, duration } = timingState
  
  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg border",
      "bg-gray-50 dark:bg-gray-900",
      "border-gray-300 dark:border-gray-700",
      className
    )}>
      {/* Pause Indicator */}
      {isPaused && (
        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
          <Pause className="w-4 h-4" />
          <span className="text-xs font-medium">Paused</span>
        </div>
      )}
      
      {/* Direction Indicator (for ping-pong) */}
      {loopCount > 0 && (
        <div className={cn(
          "flex items-center gap-1",
          isReversed 
            ? "text-purple-600 dark:text-purple-400" 
            : "text-blue-600 dark:text-blue-400"
        )}>
          {isReversed ? (
            <>
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Backward</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs font-medium">Forward</span>
            </>
          )}
        </div>
      )}
      
      {/* Loop Count */}
      {loopCount > 0 && (
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <span className="text-xs">Loop</span>
          <span className="text-xs font-mono font-bold">{loopCount + 1}</span>
        </div>
      )}
      
      {/* Time Display */}
      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
        <span className="text-xs font-mono">
          {animationTime.toFixed(2)}s / {duration.toFixed(2)}s
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="flex-1 min-w-[120px] max-w-[200px]">
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={cn(
              "absolute top-0 left-0 h-full transition-all duration-100",
              isReversed 
                ? "bg-purple-500 dark:bg-purple-600" 
                : "bg-blue-500 dark:bg-blue-600",
              isPaused && "opacity-50"
            )}
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
          
          {/* Direction indicator on progress bar */}
          {loopCount > 0 && (
            <div 
              className={cn(
                "absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-100",
                isReversed ? "right-0" : "left-0"
              )}
            />
          )}
        </div>
        
        {/* Progress percentage */}
        <div className="text-center mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {(progress * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}
