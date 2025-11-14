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
      if (executionState?.progress !== undefined) {
        setLocalProgress(executionState.progress)
      } else {
        // Simulate progress based on animation duration
        const duration = animation.duration || 5000
        const startTime = Date.now()
        
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min((elapsed / duration) * 100, 100)
          setLocalProgress(progress)
          
          if (progress >= 100) {
            clearInterval(interval)
          }
        }, 100)
        
        return () => clearInterval(interval)
      }
    } else {
      setLocalProgress(0)
    }
  }, [status, animation, executionState?.progress])
  
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
            
            {/* Cue Number Badge */}
            {cue.number && (
              <div className="px-1.5 py-0.5 bg-black/30 text-white text-xs font-bold rounded flex-shrink-0">
                Q{cue.number}
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
          
          {/* Progress Bar */}
          {status === 'active' && localProgress > 0 && (
            <div className="absolute top-[28px] left-0 right-0 h-0.5 bg-black/30 overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-200"
                style={{ width: `${localProgress}%` }}
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
            
            {/* Progress Percentage (when active) */}
            {status === 'active' && localProgress > 0 && (
              <div className="mt-auto pt-1">
                <span className="text-xs text-gray-400">
                  {Math.round(localProgress)}%
                </span>
              </div>
            )}
          </div>
          
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
