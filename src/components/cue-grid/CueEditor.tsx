import React, { useState, useEffect } from 'react'
import { Cue, CueTrigger } from '@/cues/types'
import { useCueStore } from '@/cues/store'
import { useProjectStore } from '@/stores/projectStore'
import { usePresetStore } from '@/stores/presetStore'
import { useAnimationStore } from '@/stores/animationStore'
import { 
  X, 
  Save, 
  Trash2,
  Play,
  Settings,
  Keyboard,
  Radio,
  Music,
  Clock,
  Lock,
  Unlock
} from 'lucide-react'

interface CueEditorProps {
  cueId: string | null
  onClose: () => void
}

export const CueEditor: React.FC<CueEditorProps> = ({ cueId, onClose }) => {
  const { animations, tracks } = useProjectStore()
  const { presets } = usePresetStore()
  const { updateCue, deleteCue, getCueById } = useCueStore()
  
  const [cue, setCue] = useState<Cue | null>(null)
  const [editedCue, setEditedCue] = useState<Partial<Cue>>({})
  const [sourceType, setSourceType] = useState<'preset' | 'animation'>('animation')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [selectedAnimationId, setSelectedAnimationId] = useState<string>('')
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  const [triggerType, setTriggerType] = useState<'manual' | 'hotkey' | 'osc' | 'midi'>('manual')
  const [hotkey, setHotkey] = useState<string>('')
  const [oscAddress, setOscAddress] = useState<string>('')
  const [midiNote, setMidiNote] = useState<number>(60)
  const [midiChannel, setMidiChannel] = useState<number>(1)

  useEffect(() => {
    if (cueId) {
      const foundCue = getCueById(cueId)
      if (foundCue) {
        setCue(foundCue)
        setEditedCue(foundCue)
        
        // Load existing parameters
        if (foundCue.parameters.presetId) {
          setSourceType('preset')
          setSelectedPresetId(foundCue.parameters.presetId)
        } else if (foundCue.parameters.animationId) {
          setSourceType('animation')
          setSelectedAnimationId(foundCue.parameters.animationId)
        }
        if (foundCue.parameters.trackIds) {
          setSelectedTrackIds(foundCue.parameters.trackIds)
        }
        
        // Load trigger settings
        const trigger = foundCue.triggers[0]
        if (trigger) {
          setTriggerType(trigger.type as any)
          setHotkey(trigger.hotkey || '')
          setOscAddress(trigger.oscAddress || '')
          setMidiNote(trigger.midiNote || 60)
          setMidiChannel(trigger.midiChannel || 1)
        }
      }
    }
  }, [cueId, getCueById])

  const handleSave = () => {
    if (!cue || !cueId) return
    
    // Build trigger based on type
    const trigger: CueTrigger = {
      id: cue.triggers[0]?.id || `trigger-${Date.now()}`,
      type: triggerType,
      enabled: true,
      ...(triggerType === 'hotkey' && { hotkey }),
      ...(triggerType === 'osc' && { oscAddress }),
      ...(triggerType === 'midi' && { midiNote, midiChannel })
    }
    
    // Build parameters based on source type
    const parameters: any = { ...editedCue.parameters }
    
    if (sourceType === 'preset') {
      parameters.presetId = selectedPresetId
      parameters.animationId = undefined
      parameters.trackIds = selectedTrackIds.length > 0 ? selectedTrackIds : undefined
    } else {
      parameters.animationId = selectedAnimationId
      parameters.presetId = undefined
      // Only include trackIds if animation is not locked
      const selectedAnimation = animations.find(a => a.id === selectedAnimationId)
      if (!selectedAnimation?.trackSelectionLocked) {
        parameters.trackIds = selectedTrackIds.length > 0 ? selectedTrackIds : undefined
      } else {
        // For locked animations, remove trackIds from cue
        parameters.trackIds = undefined
      }
    }
    
    // Update cue with new settings
    updateCue(cueId, {
      ...editedCue,
      parameters,
      triggers: [trigger]
    })
    
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
                  value={editedCue.name || ''}
                  onChange={(e) => setEditedCue({ ...editedCue, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editedCue.description || ''}
                  onChange={(e) => setEditedCue({ ...editedCue, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cue Number
                  </label>
                  <input
                    type="number"
                    value={editedCue.number || ''}
                    onChange={(e) => setEditedCue({ ...editedCue, number: parseFloat(e.target.value) })}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={editedCue.color || '#4F46E5'}
                    onChange={(e) => setEditedCue({ ...editedCue, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Animation Source Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Animation Source
            </h3>
            <div className="space-y-4">
              {/* Source Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceType('preset')}
                    className={`px-4 py-3 rounded-md border-2 transition-colors ${
                      sourceType === 'preset'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Unlock className="w-5 h-5" />
                      <span className="text-sm font-medium">Preset</span>
                      <span className="text-xs opacity-70">Choose tracks</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('animation')}
                    className={`px-4 py-3 rounded-md border-2 transition-colors ${
                      sourceType === 'animation'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Lock className="w-5 h-5" />
                      <span className="text-sm font-medium">Saved Animation</span>
                      <span className="text-xs opacity-70">With tracks</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Preset Mode */}
              {sourceType === 'preset' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Preset
                    </label>
                    <select
                      value={selectedPresetId}
                      onChange={(e) => setSelectedPresetId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">-- Choose Preset --</option>
                      {presets.map(preset => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} ({preset.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPresetId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Tracks <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded">
                        {tracks.map(track => (
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
                      {selectedTrackIds.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">⚠️ You must select at least one track for presets</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Saved Animation Mode */}
              {sourceType === 'animation' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Animation
                    </label>
                    <select
                      value={selectedAnimationId}
                      onChange={(e) => setSelectedAnimationId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">-- Choose Animation --</option>
                      {animations.map(anim => (
                        <option key={anim.id} value={anim.id}>
                          {anim.name} ({anim.type}) {anim.trackSelectionLocked ? '🔒' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAnimationId && (() => {
                    const selectedAnimation = animations.find(a => a.id === selectedAnimationId)
                    const isLocked = selectedAnimation?.trackSelectionLocked
                    
                    return isLocked ? (
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
                              {selectedAnimation.trackIds?.map(trackId => {
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
                              Cannot change tracks. To use different tracks, duplicate the animation in Animation Editor.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Target Tracks (optional)
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded">
                          {tracks.map(track => (
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
                          Leave empty to use currently selected tracks
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
          
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
                <div className="grid grid-cols-4 gap-2">
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
                  <button
                    onClick={() => setTriggerType('midi')}
                    className={`px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-colors ${
                      triggerType === 'midi'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                    MIDI
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
                    OSC Address
                  </label>
                  <input
                    type="text"
                    value={oscAddress}
                    onChange={(e) => setOscAddress(e.target.value)}
                    placeholder="/cue/trigger/1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
              
              {triggerType === 'midi' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      MIDI Note
                    </label>
                    <input
                      type="number"
                      value={midiNote}
                      onChange={(e) => setMidiNote(parseInt(e.target.value))}
                      min="0"
                      max="127"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      MIDI Channel
                    </label>
                    <input
                      type="number"
                      value={midiChannel}
                      onChange={(e) => setMidiChannel(parseInt(e.target.value))}
                      min="1"
                      max="16"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
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
