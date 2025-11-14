import React, { useEffect, useState } from 'react'
import { Cue } from '@/cues/types'
import { useProjectStore } from '@/stores/projectStore'
import { 
  Play, 
  Zap, 
  Edit, 
  Plus,
  Circle
} from 'lucide-react'

interface CueButtonProps {
  cue?: Cue
  slot: { row: number; column: number }
  status: 'empty' | 'idle' | 'active'
  isHovered: boolean
  executionState?: {
    progress: number
    activeTargets: string[]
  }
  onClick: (e: React.MouseEvent) => void
  onEdit?: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/**
 * Enhanced Cue Button Component
 * 
 * Features:
 * - Progress bar (shows animation progress)
 * - Track badges (which tracks are active)
 * - Animation info display
 * - Color-coded border
 * - Hover effects
 * - Status indicators
 */
export const CueButton: React.FC<CueButtonProps> = ({
  cue,
  slot,
  status,
  isHovered,
  executionState,
  onClick,
  onEdit,
  onMouseEnter,
  onMouseLeave
}) => {
  const { animations, tracks } = useProjectStore()
  const [localProgress, setLocalProgress] = useState(0)
  
  // Get animation info if this is an animation cue
  const cueData = cue ? ((cue as any).data || (cue as any).parameters) : null
  const animation = cueData?.animationId 
    ? animations.find(a => a.id === cueData.animationId)
    : null
  
  // Get track info - show which tracks will actually be used
  let affectedTracks: string[] = []
  
  if (executionState?.activeTargets) {
    // If actively running, show actual active tracks
    affectedTracks = executionState.activeTargets
  } else if (cueData?.trackIds && cueData.trackIds.length > 0) {
    // If tracks explicitly selected in cue, show those
    affectedTracks = cueData.trackIds
  } else if (animation?.trackIds && animation.trackIds.length > 0) {
    // If no tracks selected, show all available animation tracks (default)
    affectedTracks = animation.trackIds
  }
  
  const trackNames = affectedTracks
    .map((trackId: string) => tracks.find(t => t.id === trackId)?.name)
    .filter(Boolean) as string[]
  
  // Update progress from execution state or animate locally
  useEffect(() => {
    if (status === 'active' && animation) {
      console.log('🎬 CueButton active:', cue?.name, 'animation:', animation.name, 'duration:', animation.duration)
      
      if (executionState?.progress !== undefined) {
        console.log('📊 Using execution state progress:', executionState.progress)
        setLocalProgress(executionState.progress)
      } else {
        // Simulate progress based on animation duration
        // Animation duration is in SECONDS, convert to milliseconds
        const durationMs = (animation.duration || 5) * 1000
        const startTime = Date.now()
        
        console.log('⏱️ Starting local progress simulation, duration (seconds):', animation.duration, 'ms:', durationMs)
        
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min((elapsed / durationMs) * 100, 100)
          setLocalProgress(progress)
          
          if (progress >= 100) {
            clearInterval(interval)
            // Animation finished - we should notify parent but can't from here
            console.log('✅ Animation progress complete (100%)')
          }
        }, 100)
        
        return () => {
          console.log('🛑 Clearing progress interval')
          clearInterval(interval)
        }
      }
    } else {
      setLocalProgress(0)
    }
  }, [status, animation, executionState?.progress, cue?.name])
  
  // Get status colors
  const getColors = () => {
    if (status === 'active') {
      return {
        bg: 'bg-green-500 hover:bg-green-600',
        border: 'border-green-400',
        text: 'text-white'
      }
    } else if (status === 'idle' && cue) {
      return {
        bg: 'bg-gray-600 hover:bg-gray-700',
        border: 'border-gray-500',
        text: 'text-white'
      }
    } else {
      return {
        bg: 'bg-gray-800 hover:bg-gray-700',
        border: 'border-gray-600 border-dashed',
        text: 'text-gray-400'
      }
    }
  }
  
  const colors = getColors()
  
  // Custom color border if cue has color set
  const customBorderColor = cue?.color && status !== 'active' 
    ? { borderColor: cue.color }
    : {}
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        relative rounded-lg overflow-hidden flex flex-col
        transition-all transform hover:scale-105
        ${status === 'empty' ? colors.bg : 'bg-gray-800'}
        ${status === 'empty' ? `border-2 ${colors.border}` : 'border border-gray-700'}
        ${isHovered ? 'ring-2 ring-blue-400' : ''}
      `}
      style={{
        gridRow: slot.row + 1,
        gridColumn: slot.column + 1
      }}
    >
      {cue ? (
        <>
          {/* Colored Header Bar with Cue Name */}
          <div 
            className="relative px-2 py-1 flex items-center gap-1.5 w-full"
            style={{ 
              backgroundColor: status === 'active' ? '#10b981' : (cue.color || '#4B5563'),
              minHeight: '28px',
              boxSizing: 'border-box'
            }}
          >
            {/* Edit Button (left) */}
            {onEdit && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="p-0.5 bg-black/20 rounded hover:bg-black/40 transition-colors cursor-pointer flex-shrink-0"
                title="Edit Cue"
              >
                <Edit className="w-3 h-3 text-white" />
              </div>
            )}
            
            {/* Cue Name (grows to fill space) */}
            <span className="text-xs text-white font-semibold text-left line-clamp-1 flex-1 min-w-0">
              {cue.name}
            </span>
            
            {/* Status Indicator + Type Icon (right) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {status === 'active' && (
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
              {status === 'active' ? (
                <Play className="w-3 h-3 text-white" fill="currentColor" />
              ) : (
                <Zap className="w-3 h-3 text-white" />
              )}
            </div>
            
          </div>
          
          {/* Progress Bar - directly below header */}
          {status === 'active' && (
            <div className="w-full h-0.5 bg-black/60">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-200"
                style={{ width: `${Math.max(localProgress, 1)}%` }}
              />
            </div>
          )}
          
          {/* Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 bg-gray-900 min-h-0 w-full" style={{ boxSizing: 'border-box' }}>
            {/* Animation Info */}
            {animation && (
              <span className="text-xs text-gray-400 text-center line-clamp-2 mb-2">
                {animation.name}
              </span>
            )}
            
            {/* Track Badges (smaller) */}
            {affectedTracks.length > 0 && (
              <div className="flex items-center justify-center gap-0.5 flex-wrap">
                {trackNames.slice(0, 4).map((name: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-1 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                    style={{ fontSize: '9px' }}
                    title={`Track: ${name}`}
                  >
                    {name}
                  </span>
                ))}
                {trackNames.length > 4 && (
                  <span
                    className="px-1 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                    style={{ fontSize: '9px' }}
                    title={`+${trackNames.length - 4} more tracks`}
                  >
                    +{trackNames.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Cue Number - Bottom Right Corner */}
          {cue.number && (
            <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 text-white rounded" style={{ fontSize: '8px' }}>
              Q{cue.number}
            </div>
          )}
          
          {/* Disabled Indicator */}
          {cue.isEnabled === false && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <span className="text-xs text-red-400 font-semibold">DISABLED</span>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Empty Slot */}
          <div className="flex-1 flex flex-col items-center justify-center p-2">
            <Plus className={`w-6 h-6 ${colors.text}`} />
            <span className={`text-xs ${colors.text} mt-1`}>Empty</span>
          </div>
        </>
      )}
    </button>
  )
}
