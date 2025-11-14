import React, { useEffect, useState } from 'react'
import { useCueStoreV2 } from '@/cues/storeV2'
import { Cue, CueBank, CueSlot } from '@/cues/types'
import { CueEditorV2 as CueEditor } from './CueEditorV2'
import { CueButton } from './CueButton'
import { 
  AlertTriangle, 
  Grid3x3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export const CueGrid: React.FC = () => {
  const {
    currentShow,
    executionContext,
    selectedBankId,
    createShow,
    createCue,
    triggerCue,
    stopCue,
    toggleCue,
    panic,
    switchBank,
    assignCueToSlot,
    clearSlot,
    getCueById,
    getCueBankById
  } = useCueStoreV2()

  const activeCues = executionContext.activeCues

  const [hoveredSlot, setHoveredSlot] = useState<{ row: number; col: number } | null>(null)
  const [editingCue, setEditingCue] = useState<string | null>(null)

  // Initialize show if none exists
  useEffect(() => {
    if (!currentShow) {
      createShow('Default Show')
    }
  }, [currentShow, createShow])

  const currentBank = currentShow?.cueBanks.find(b => b.id === selectedBankId)
  const banks = currentShow?.cueBanks || []

  const handleSlotClick = (slot: CueSlot, e: React.MouseEvent) => {
    if (slot.cueId) {
      const cue = getCueById(slot.cueId)
      if (cue) {
        // Double click to edit, single click to trigger
        if (e.detail === 2) {
          setEditingCue(slot.cueId)
        } else {
          toggleCue(slot.cueId)
        }
      }
    } else {
      // Create new cue in this slot
      handleCreateCue(slot.row, slot.column)
    }
  }

  const handleSlotRightClick = (e: React.MouseEvent, slot: CueSlot) => {
    e.preventDefault()
    // Right-click could be used for context menu in future
    // Arming system removed
  }

  const handleCreateCue = (row: number, col: number) => {
    if (!currentBank) return
    
    // Create cue with skipAutoAssign to prevent duplicate bug
    const cueId = createCue({
      name: `Cue ${row + 1}-${col + 1}`,
      type: 'animation',
      color: '#4F46E5',
      status: 'idle',
      isEnabled: true,
      triggers: [{
        id: `trigger-${Date.now()}`,
        type: 'manual',
        enabled: true
      }],
      data: {
        animationId: '',
        playbackSpeed: 1.0
      },
      created: new Date(),
      modified: new Date(),
      triggerCount: 0
    } as any, { skipAutoAssign: true })  // Prevent auto-assignment
    
    // Manually assign to specific slot
    if (cueId && currentBank) {
      assignCueToSlot(cueId, currentBank.id, row, col)
    }
  }

  const getSlotStatus = (slot: CueSlot): 'empty' | 'idle' | 'active' => {
    if (!slot.cueId) return 'empty'
    if (activeCues.has(slot.cueId)) return 'active'
    return 'idle'
  }

  const getSlotColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500 hover:bg-green-600'
      case 'idle': return 'bg-gray-600 hover:bg-gray-700'
      default: return 'bg-gray-800 hover:bg-gray-700 border-2 border-dashed border-gray-600'
    }
  }

  if (!currentShow || !currentBank) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Grid3x3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No show loaded</p>
          <button
            onClick={() => createShow('New Show')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Show
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cue Grid
          </h2>
          
          {/* Bank Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const currentIndex = banks.findIndex(b => b.id === selectedBankId)
                const prevBank = banks[currentIndex - 1]
                if (prevBank) switchBank(prevBank.id)
              }}
              disabled={banks.findIndex(b => b.id === selectedBankId) === 0}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex gap-1">
              {banks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => switchBank(bank.id)}
                  className={`px-3 py-1 rounded font-medium text-sm transition-colors ${
                    bank.id === selectedBankId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Bank {bank.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                const currentIndex = banks.findIndex(b => b.id === selectedBankId)
                const nextBank = banks[currentIndex + 1]
                if (nextBank) switchBank(nextBank.id)
              }}
              disabled={banks.findIndex(b => b.id === selectedBankId) === banks.length - 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => panic()}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            PANIC
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid gap-2" style={{ 
          gridTemplateColumns: `repeat(${currentBank.columns}, minmax(80px, 1fr))`,
          gridTemplateRows: `repeat(${currentBank.rows}, minmax(80px, 1fr))`,
          maxWidth: '100%',
          aspectRatio: `${currentBank.columns}/${currentBank.rows}`
        }}>
          {currentBank.slots.map((slot) => {
            const cue = slot.cueId ? getCueById(slot.cueId) : undefined
            const status = getSlotStatus(slot)
            const isHovered = hoveredSlot?.row === slot.row && hoveredSlot?.col === slot.column
            const execution = slot.cueId ? executionContext.activeCues.get(slot.cueId) : undefined
            
            return (
              <CueButton
                key={`${slot.row}-${slot.column}`}
                cue={cue}
                slot={slot}
                status={status}
                isHovered={isHovered}
                executionState={execution}
                onClick={(e) => handleSlotClick(slot, e)}
                onEdit={slot.cueId ? () => setEditingCue(slot.cueId!) : undefined}
                onMouseEnter={() => setHoveredSlot({ row: slot.row, col: slot.column })}
                onMouseLeave={() => setHoveredSlot(null)}
              />
            )
          })}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              Active: {activeCues.size}
            </span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {currentShow.name} - Bank {currentBank.label} ({currentBank.rows}x{currentBank.columns})
        </div>
      </div>
      
      {/* Cue Editor Modal */}
      {editingCue && (
        <CueEditor 
          cueId={editingCue}
          onClose={() => setEditingCue(null)}
        />
      )}
    </div>
  )
}
