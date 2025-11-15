import React, { useState, useEffect } from 'react'
import type { Cue, CueTrigger } from '@/cues/types'
import type { InterpolationMode, EasingFunction } from '@/types/positionPreset'
import { useProjectStore } from '@/stores/projectStore'
import { useCueStoreV2 } from '@/cues/storeV2'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { PositionCueFields } from './PositionCueFields'
import { 
  X, 
  Save, 
  Trash2,
  Play,
  Keyboard,
  Radio,
  Lock,
  Unlock,
  Home
} from 'lucide-react'

// Type guard for animation cues (temporary until type migration)
const isAnimationCue = (cue: any) => cue.type === 'animation' || cue.category === 'animation'

// Default colors for each cue type
const DEFAULT_CUE_COLORS = {
  animation: '#4F46E5', // Indigo
  osc: '#9333EA',       // Purple
  position: '#3B82F6',  // Blue
  reset: '#F97316'      // Orange
}

interface CueEditorProps {
  cueId: string | null
  onClose: () => void
}

/**
 * CueEditor V2 - Migrated to storeV2
 * 
 * Changes from V1:
 * - Uses useCueStoreV2
 * - No preset support (removed)
 * - Only animation cues for now
 * - Uses cue.data instead of cue.parameters
 * - Simplified structure
 */
export const CueEditorV2: React.FC<CueEditorProps> = ({ cueId, onClose }) => {
  const { animations, tracks } = useProjectStore()
  const { updateCue, deleteCue, getCueById } = useCueStoreV2()
  
  const [cue, setCue] = useState<Cue | null>(null)
  const [cueName, setCueName] = useState('')
  const [cueDescription, setCueDescription] = useState('')
  const [cueNumber, setCueNumber] = useState<number | undefined>(undefined)
  const [cueColor, setCueColor] = useState('#4F46E5')
  const [cueType, setCueType] = useState<'animation' | 'osc' | 'position'>('animation')
  
  // Animation cue specific
  const [selectedAnimationId, setSelectedAnimationId] = useState('')
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  
  // OSC cue specific
  const [oscMessages, setOscMessages] = useState<Array<{address: string, args: any[]}>>([{address: '/cue/trigger', args: []}])
  
  // Position cue specific
  const [positionPresetId, setPositionPresetId] = useState('')
  const [positionDuration, setPositionDuration] = useState(2.0)
  const [positionEasing, setPositionEasing] = useState<any>('ease-in-out')
  const [positionMode, setPositionMode] = useState<any>('cartesian')
  const [positionInterruptAnimations, setPositionInterruptAnimations] = useState(true)
  
  // Triggers
  const [triggerType, setTriggerType] = useState<'manual' | 'hotkey' | 'osc'>('manual')
  const [hotkey, setHotkey] = useState('')
  const [oscTriggerAddress, setOscTriggerAddress] = useState('')
  
  // Track if we're loading an existing cue (to not override its color)
  const [isLoadingCue, setIsLoadingCue] = useState(false)

  // Apply default color when cue type changes (unless loading existing cue)
  useEffect(() => {
    if (!isLoadingCue && DEFAULT_CUE_COLORS[cueType as keyof typeof DEFAULT_CUE_COLORS]) {
      setCueColor(DEFAULT_CUE_COLORS[cueType as keyof typeof DEFAULT_CUE_COLORS])
    }
  }, [cueType, isLoadingCue])

  useEffect(() => {
    if (cueId) {
      setIsLoadingCue(true)
      const foundCue = getCueById(cueId)
      if (foundCue) {
        setCue(foundCue)
        setCueName(foundCue.name)
        setCueDescription(foundCue.description || '')
        setCueNumber(foundCue.number)
        setCueColor(foundCue.color)
        
        // Load animation cue data
        if (isAnimationCue(foundCue)) {
          const cueData = (foundCue as any).data || (foundCue as any).parameters || {}
          setSelectedAnimationId(cueData.animationId || '')
          setSelectedTrackIds(cueData.trackIds || [])
        }
        
        // Load position cue data
        if ((foundCue as any).type === 'position') {
          const cueData = (foundCue as any).data || {}
          setPositionPresetId(cueData.presetId || '')
          setPositionDuration(cueData.transition?.duration || 2.0)
          setPositionEasing(cueData.transition?.easing || 'ease-in-out')
          setPositionMode(cueData.transition?.mode || 'cartesian')
          setPositionInterruptAnimations(cueData.interruptAnimations !== false)
        }
        
        // Load OSC cue data
        if ((foundCue as any).type === 'osc') {
          const cueData = (foundCue as any).data || {}
          if (cueData.messages && Array.isArray(cueData.messages)) {
            setOscMessages(cueData.messages.length > 0 ? cueData.messages : [{address: '/cue/trigger', args: []}])
          }
        }
        
        // Load trigger settings
        const trigger = foundCue.triggers[0]
        if (trigger) {
          setTriggerType(trigger.type as any)
          setHotkey(trigger.hotkey || '')
          setOscTriggerAddress(trigger.oscAddress || '')
        }
        
        // Load cue type
        setCueType((foundCue as any).type || (foundCue as any).category || 'animation')
        
        // Mark loading as complete (use timeout to ensure state updates are processed)
        setTimeout(() => setIsLoadingCue(false), 0)
      }
    }
  }, [cueId, getCueById])

  const handleSave = () => {
    if (!cue || !cueId) return
    
    // Build trigger
    const trigger: CueTrigger = {
      id: cue.triggers[0]?.id || `trigger-${Date.now()}`,
      type: triggerType,
      enabled: true,
      ...(triggerType === 'hotkey' && { hotkey }),
      ...(triggerType === 'osc' && { oscAddress: oscTriggerAddress })
    }
    
    // Build updated cue based on type
    if (cueType === 'animation') {
      // Animation cue
      const selectedAnimation = animations.find(a => a.id === selectedAnimationId)
      const isLocked = selectedAnimation?.trackSelectionLocked
      const cueData = (cue as any).data || (cue as any).parameters || {}
      
      updateCue(cueId, {
        name: cueName,
        description: cueDescription,
        number: cueNumber,
        color: cueColor,
        type: 'animation',
        category: 'animation',
        data: {
          animationId: selectedAnimationId,
          trackIds: isLocked ? undefined : (selectedTrackIds.length > 0 ? selectedTrackIds : undefined),
          playbackSpeed: cueData.playbackSpeed || 1.0,
          loop: cueData.loop,
          reverse: cueData.reverse,
          cueSpecificParams: cueData.cueSpecificParams
        },
        triggers: [trigger]
      } as any)
    } else if (cueType === 'osc') {
      // OSC cue
      updateCue(cueId, {
        name: cueName,
        description: cueDescription,
        number: cueNumber,
        color: cueColor,
        type: 'osc',
        category: 'osc',
        data: {
          messages: oscMessages.filter(m => m.address.trim() !== '')
        },
        triggers: [trigger]
      } as any)
    } else if (cueType === 'position') {
      // Position cue
      updateCue(cueId, {
        name: cueName,
        description: cueDescription,
        number: cueNumber,
        color: cueColor,
        type: 'position',
        data: {
          presetId: positionPresetId,
          transition: {
            duration: positionDuration,
            easing: positionEasing,
            mode: positionMode
          },
          interruptAnimations: positionInterruptAnimations
        },
        triggers: [trigger]
      } as any)
    }
    
    onClose()
  }
  
  const handleDelete = () => {
    if (!cueId) return
    if (confirm('Are you sure you want to delete this cue?')) {
      deleteCue(cueId)
      onClose()
    }
  }
  
  const handleTrackToggle = (trackId: string) => {
    setSelectedTrackIds(prev => 
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    )
  }
  
  if (!cue) return null
  
  // Get selected animation info
  const selectedAnimation = selectedAnimationId 
    ? animations.find(a => a.id === selectedAnimationId)
    : null
  const isAnimationLocked = selectedAnimation?.trackSelectionLocked || false
  
  // Filter available tracks based on animation
  // For unlocked animations, only show tracks that the animation supports/was created with
  const availableTracks = selectedAnimation && !isAnimationLocked && selectedAnimation.trackIds
    ? tracks.filter(track => selectedAnimation.trackIds?.includes(track.id))
    : tracks  // Show all tracks if no animation selected or if animation has no specific tracks
  
  // Show info about track filtering
  const isTrackListFiltered = availableTracks.length < tracks.length
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit Cue: {cue.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Basic Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cue Name
                </label>
                <input
                  type="text"
                  value={cueName}
                  onChange={(e) => setCueName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={cueDescription}
                  onChange={(e) => setCueDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cue Number
                  </label>
                  <input
                    type="number"
                    value={cueNumber || ''}
                    onChange={(e) => setCueNumber(parseFloat(e.target.value) || undefined)}
                    step="0.1"
                    placeholder="Optional (for CueLists)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    For future CueList/GO button workflow
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={cueColor}
                    onChange={(e) => setCueColor(e.target.value)}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Cue Type Selector */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Cue Type
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCueType('animation')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  cueType === 'animation'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                <Play className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-medium">Animation</div>
              </button>
              <button
                type="button"
                onClick={() => setCueType('osc')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  cueType === 'osc'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                <Radio className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-medium">OSC</div>
              </button>
              <button
                type="button"
                onClick={() => setCueType('position')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  cueType === 'position'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                <Home className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-medium">Position</div>
              </button>
            </div>
          </div>
          
          {/* Animation Selection (for animation cues) */}
          {cueType === 'animation' && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Animation
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Animation
                  </label>
                  <select
                    value={selectedAnimationId}
                    onChange={(e) => setSelectedAnimationId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- Choose Animation --</option>
                    {animations.map(anim => (
                      <option key={anim.id} value={anim.id}>
                        {anim.name} ({anim.type}) {anim.trackSelectionLocked ? '🔒' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAnimationId && (
                  isAnimationLocked ? (
                    // Locked animation - show info only
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-start gap-2">
                        <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Tracks Locked
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            This animation is locked to specific tracks:
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedAnimation?.trackIds?.map(trackId => {
                              const track = tracks.find(t => t.id === trackId)
                              return track ? (
                                <span
                                  key={trackId}
                                  className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs"
                                >
                                  {track.name}
                                </span>
                              ) : null
                            })}
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Cannot change tracks for locked animations.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Unlocked animation - allow track selection
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Unlock className="w-4 h-4 inline mr-1" />
                        Target Tracks (optional)
                      </label>
                      
                      {isTrackListFiltered && (
                        <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
                          ℹ️ Showing only tracks compatible with this animation ({availableTracks.length} of {tracks.length} tracks)
                        </div>
                      )}
                      
                      {availableTracks.length > 0 ? (
                        <>
                          {/* Formation animation warning */}
                          {selectedAnimation?.transform?.mode === 'formation' && (
                            <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                              <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                    Formation Animation
                                  </p>
                                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                    This animation was saved with {Object.keys(selectedAnimation.transform.tracks).length} tracks in a formation. 
                                    Playing on a different number of tracks may break the formation geometry.
                                  </p>
                                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                                    💡 For best results with LTP priority mode, select all {Object.keys(selectedAnimation.transform.tracks).length} tracks or lock this animation.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded">
                            {availableTracks.map(track => (
                              <label key={track.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedTrackIds.includes(track.id)}
                                  onChange={() => handleTrackToggle(track.id)}
                                  className="rounded"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {track.name}
                                </span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Leave empty to use currently selected tracks when triggered
                          </p>
                        </>
                      ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400">
                          No compatible tracks available. This animation may need to be created with specific tracks first.
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          
          {/* OSC Messages (for OSC cues) */}
          {cueType === 'osc' && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                OSC Messages
              </h3>
              <div className="space-y-3">
                {oscMessages.map((msg, idx) => (
                  <div key={idx} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          OSC Address
                        </label>
                        <input
                          type="text"
                          value={msg.address}
                          onChange={(e) => {
                            const newMsgs = [...oscMessages]
                            newMsgs[idx].address = e.target.value
                            setOscMessages(newMsgs)
                          }}
                          placeholder="/osc/address"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                        
                        {/* OSC Arguments */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Arguments ({msg.args?.length || 0})
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const newMsgs = [...oscMessages]
                                if (!newMsgs[idx].args) newMsgs[idx].args = []
                                newMsgs[idx].args.push(0)
                                setOscMessages(newMsgs)
                              }}
                              className="text-xs text-blue-500 hover:text-blue-600"
                            >
                              + Add Arg
                            </button>
                          </div>
                          
                          {msg.args && msg.args.length > 0 && (
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {msg.args.map((arg: any, argIdx: number) => (
                                <div key={argIdx} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-8">[{argIdx}]</span>
                                  <select
                                    value={typeof arg}
                                    onChange={(e) => {
                                      const newMsgs = [...oscMessages]
                                      const type = e.target.value
                                      if (type === 'number') newMsgs[idx].args[argIdx] = 0
                                      else if (type === 'string') newMsgs[idx].args[argIdx] = ''
                                      else if (type === 'boolean') newMsgs[idx].args[argIdx] = false
                                      setOscMessages(newMsgs)
                                    }}
                                    className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  >
                                    <option value="number">Number</option>
                                    <option value="string">String</option>
                                    <option value="boolean">Bool</option>
                                  </select>
                                  
                                  {typeof arg === 'boolean' ? (
                                    <select
                                      value={arg ? 'true' : 'false'}
                                      onChange={(e) => {
                                        const newMsgs = [...oscMessages]
                                        newMsgs[idx].args[argIdx] = e.target.value === 'true'
                                        setOscMessages(newMsgs)
                                      }}
                                      className="flex-1 text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                      <option value="true">true</option>
                                      <option value="false">false</option>
                                    </select>
                                  ) : typeof arg === 'string' ? (
                                    <input
                                      type="text"
                                      value={arg}
                                      onChange={(e) => {
                                        const newMsgs = [...oscMessages]
                                        newMsgs[idx].args[argIdx] = e.target.value
                                        setOscMessages(newMsgs)
                                      }}
                                      placeholder="text"
                                      className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      value={arg}
                                      onChange={(e) => {
                                        const newMsgs = [...oscMessages]
                                        newMsgs[idx].args[argIdx] = parseFloat(e.target.value) || 0
                                        setOscMessages(newMsgs)
                                      }}
                                      step="any"
                                      className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                    />
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newMsgs = [...oscMessages]
                                      newMsgs[idx].args.splice(argIdx, 1)
                                      setOscMessages(newMsgs)
                                    }}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    title="Remove argument"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Example: /track/1/xyz [1.0, 2.5, 0.0]
                        </p>
                      </div>
                      {oscMessages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newMsgs = oscMessages.filter((_, i) => i !== idx)
                            setOscMessages(newMsgs)
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Remove message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setOscMessages([...oscMessages, {address: '', args: []}])
                  }}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-medium"
                >
                  + Add OSC Message
                </button>
              </div>
            </div>
          )}
          
          {/* Position Configuration (for Position cues) */}
          {cueType === 'position' && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Position Preset
              </h3>
              <PositionCueFields
                presetId={positionPresetId}
                duration={positionDuration}
                easing={positionEasing}
                mode={positionMode}
                interruptAnimations={positionInterruptAnimations}
                onPresetChange={setPositionPresetId}
                onDurationChange={setPositionDuration}
                onEasingChange={setPositionEasing}
                onModeChange={setPositionMode}
                onInterruptAnimationsChange={setPositionInterruptAnimations}
              />
            </div>
          )}
          
          {/* Triggers */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Trigger Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trigger Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTriggerType('manual')}
                    className={`px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-colors ${
                      triggerType === 'manual'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    Manual
                  </button>
                  <button
                    onClick={() => setTriggerType('hotkey')}
                    className={`px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-colors ${
                      triggerType === 'hotkey'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Keyboard className="w-4 h-4" />
                    Hotkey
                  </button>
                  <button
                    onClick={() => setTriggerType('osc')}
                    className={`px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-colors ${
                      triggerType === 'osc'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Radio className="w-4 h-4" />
                    OSC
                  </button>
                </div>
              </div>
              
              {/* Trigger-specific settings */}
              {triggerType === 'hotkey' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hotkey (e.g., Space, F1, Ctrl+1)
                  </label>
                  <input
                    type="text"
                    value={hotkey}
                    onChange={(e) => setHotkey(e.target.value)}
                    placeholder="Press a key combination"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
              
              {triggerType === 'osc' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    OSC Trigger Address
                  </label>
                  <input
                    type="text"
                    value={oscTriggerAddress}
                    onChange={(e) => setOscTriggerAddress(e.target.value)}
                    placeholder="/cue/trigger/1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
