import { Show, CueBank, CueSlot } from '../types'
import { generateId } from '@/utils'

/**
 * Cue Bank Module
 * Handles bank/grid management and slot operations
 */

/**
 * Create a new cue bank
 * 
 * @param show - Current show
 * @param name - Bank name
 * @param rows - Number of rows
 * @param columns - Number of columns
 * @returns Bank ID and updated show
 */
export function createCueBank(
  show: Show,
  name: string,
  rows: number,
  columns: number
): { bankId: string; show: Show } {
  const bankId = generateId()
  
  // Create bank
  const bank: CueBank = {
    id: bankId,
    name,
    label: generateBankLabel(show.cueBanks.length),
    rows,
    columns,
    slots: [],
    isActive: false
  }
  
  // Initialize slots
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      bank.slots.push(createEmptySlot(row, col))
    }
  }
  
  show.cueBanks.push(bank)
  show.modified = new Date()
  
  return { bankId, show: { ...show } }
}

/**
 * Delete a cue bank
 * 
 * @param show - Current show
 * @param bankId - Bank ID to delete
 * @returns Updated show
 */
export function deleteCueBank(
  show: Show,
  bankId: string
): Show {
  // Don't delete if it's the only bank
  if (show.cueBanks.length <= 1) {
    console.warn('Cannot delete last cue bank')
    return show
  }
  
  // Don't delete if it's active
  if (show.activeBankId === bankId) {
    console.warn('Cannot delete active bank, switch to another first')
    return show
  }
  
  show.cueBanks = show.cueBanks.filter(b => b.id !== bankId)
  show.modified = new Date()
  
  return { ...show }
}

/**
 * Assign a cue to a slot
 * 
 * @param show - Current show
 * @param cueId - Cue ID
 * @param bankId - Bank ID
 * @param row - Row index
 * @param column - Column index
 * @returns Updated show
 */
export function assignCueToSlot(
  show: Show,
  cueId: string,
  bankId: string,
  row: number,
  column: number
): Show {
  const bank = show.cueBanks.find(b => b.id === bankId)
  if (!bank) {
    console.error('Bank not found:', bankId)
    return show
  }
  
  const slot = bank.slots.find(s => s.row === row && s.column === column)
  if (!slot) {
    console.error('Slot not found:', row, column)
    return show
  }
  
  // Clear any existing assignment first (prevents duplicates)
  clearCueFromAllSlots(show, cueId)
  
  // Assign to new slot
  slot.cueId = cueId
  slot.isEmpty = false
  slot.isActive = false
  
  show.modified = new Date()
  
  return { ...show }
}

/**
 * Clear a slot
 * 
 * @param show - Current show
 * @param bankId - Bank ID
 * @param row - Row index
 * @param column - Column index
 * @returns Updated show
 */
export function clearSlot(
  show: Show,
  bankId: string,
  row: number,
  column: number
): Show {
  const bank = show.cueBanks.find(b => b.id === bankId)
  if (!bank) return show
  
  const slot = bank.slots.find(s => s.row === row && s.column === column)
  if (!slot) return show
  
  slot.cueId = undefined
  slot.isEmpty = true
  slot.isActive = false
  slot.color = undefined
  slot.label = undefined
  slot.icon = undefined
  
  show.modified = new Date()
  
  return { ...show }
}

/**
 * Switch active bank
 * 
 * @param show - Current show
 * @param bankId - Bank ID to activate
 * @returns Updated show
 */
export function switchBank(
  show: Show,
  bankId: string
): Show {
  const bank = show.cueBanks.find(b => b.id === bankId)
  if (!bank) {
    console.error('Bank not found:', bankId)
    return show
  }
  
  // Deactivate all banks
  show.cueBanks.forEach(b => {
    b.isActive = false
  })
  
  // Activate target bank
  bank.isActive = true
  show.activeBankId = bankId
  
  return { ...show }
}

/**
 * Get cue bank by ID
 * 
 * @param show - Current show
 * @param bankId - Bank ID
 * @returns Bank or undefined
 */
export function getCueBankById(
  show: Show,
  bankId: string
): CueBank | undefined {
  return show.cueBanks.find(b => b.id === bankId)
}

/**
 * Get active bank
 * 
 * @param show - Current show
 * @returns Active bank or undefined
 */
export function getActiveBank(show: Show): CueBank | undefined {
  if (show.activeBankId) {
    return show.cueBanks.find(b => b.id === show.activeBankId)
  }
  return show.cueBanks.find(b => b.isActive)
}

/**
 * Find slot by cue ID
 * 
 * @param show - Current show
 * @param cueId - Cue ID
 * @returns Array of [bankId, slot] tuples
 */
export function findSlotsByCueId(
  show: Show,
  cueId: string
): Array<{ bankId: string; slot: CueSlot }> {
  const results: Array<{ bankId: string; slot: CueSlot }> = []
  
  for (const bank of show.cueBanks) {
    for (const slot of bank.slots) {
      if (slot.cueId === cueId) {
        results.push({ bankId: bank.id, slot })
      }
    }
  }
  
  return results
}

/**
 * Get slot at position
 * 
 * @param bank - Cue bank
 * @param row - Row index
 * @param column - Column index
 * @returns Slot or undefined
 */
export function getSlotAt(
  bank: CueBank,
  row: number,
  column: number
): CueSlot | undefined {
  return bank.slots.find(s => s.row === row && s.column === column)
}

/**
 * Find first empty slot in bank
 * 
 * @param bank - Cue bank
 * @returns Slot or undefined
 */
export function findFirstEmptySlot(bank: CueBank): CueSlot | undefined {
  return bank.slots.find(s => s.isEmpty)
}

/**
 * Count empty slots in bank
 * 
 * @param bank - Cue bank
 * @returns Number of empty slots
 */
export function countEmptySlots(bank: CueBank): number {
  return bank.slots.filter(s => s.isEmpty).length
}

/**
 * Count occupied slots in bank
 * 
 * @param bank - Cue bank
 * @returns Number of occupied slots
 */
export function countOccupiedSlots(bank: CueBank): number {
  return bank.slots.filter(s => !s.isEmpty).length
}

/**
 * Resize bank (change grid dimensions)
 * 
 * @param show - Current show
 * @param bankId - Bank ID
 * @param newRows - New number of rows
 * @param newColumns - New number of columns
 * @returns Updated show
 */
export function resizeBank(
  show: Show,
  bankId: string,
  newRows: number,
  newColumns: number
): Show {
  const bank = show.cueBanks.find(b => b.id === bankId)
  if (!bank) return show
  
  const oldSlots = bank.slots
  const newSlots: CueSlot[] = []
  
  // Create new grid
  for (let row = 0; row < newRows; row++) {
    for (let col = 0; col < newColumns; col++) {
      // Try to preserve existing slot
      const existingSlot = oldSlots.find(s => s.row === row && s.column === col)
      if (existingSlot) {
        newSlots.push(existingSlot)
      } else {
        newSlots.push(createEmptySlot(row, col))
      }
    }
  }
  
  bank.rows = newRows
  bank.columns = newColumns
  bank.slots = newSlots
  
  show.modified = new Date()
  
  return { ...show }
}

/**
 * Move cue from one slot to another
 * 
 * @param show - Current show
 * @param sourceBankId - Source bank ID
 * @param sourceRow - Source row
 * @param sourceColumn - Source column
 * @param targetBankId - Target bank ID
 * @param targetRow - Target row
 * @param targetColumn - Target column
 * @returns Updated show
 */
export function moveCueSlot(
  show: Show,
  sourceBankId: string,
  sourceRow: number,
  sourceColumn: number,
  targetBankId: string,
  targetRow: number,
  targetColumn: number
): Show {
  const sourceBank = show.cueBanks.find(b => b.id === sourceBankId)
  const targetBank = show.cueBanks.find(b => b.id === targetBankId)
  
  if (!sourceBank || !targetBank) {
    console.error('Source or target bank not found')
    return show
  }
  
  const sourceSlot = sourceBank.slots.find(
    s => s.row === sourceRow && s.column === sourceColumn
  )
  const targetSlot = targetBank.slots.find(
    s => s.row === targetRow && s.column === targetColumn
  )
  
  if (!sourceSlot || !targetSlot) {
    console.error('Source or target slot not found')
    return show
  }
  
  if (!sourceSlot.cueId) {
    console.warn('Source slot is empty')
    return show
  }
  
  // Swap cues
  const tempCueId = targetSlot.cueId
  const tempIsEmpty = targetSlot.isEmpty
  
  targetSlot.cueId = sourceSlot.cueId
  targetSlot.isEmpty = false
  
  sourceSlot.cueId = tempCueId
  sourceSlot.isEmpty = tempIsEmpty
  
  show.modified = new Date()
  
  return { ...show }
}

/**
 * Copy bank
 * 
 * @param show - Current show
 * @param sourceBankId - Source bank ID
 * @param newName - Name for copied bank
 * @returns Bank ID and updated show
 */
export function copyBank(
  show: Show,
  sourceBankId: string,
  newName: string
): { bankId: string; show: Show } | null {
  const sourceBank = show.cueBanks.find(b => b.id === sourceBankId)
  if (!sourceBank) return null
  
  const newBankId = generateId()
  
  // Deep copy bank
  const newBank: CueBank = {
    id: newBankId,
    name: newName,
    label: generateBankLabel(show.cueBanks.length),
    rows: sourceBank.rows,
    columns: sourceBank.columns,
    slots: sourceBank.slots.map(slot => ({ ...slot })),
    color: sourceBank.color,
    isActive: false
  }
  
  show.cueBanks.push(newBank)
  show.modified = new Date()
  
  return { bankId: newBankId, show: { ...show } }
}

/**
 * Clear all slots in bank
 * 
 * @param show - Current show
 * @param bankId - Bank ID
 * @returns Updated show
 */
export function clearAllSlots(
  show: Show,
  bankId: string
): Show {
  const bank = show.cueBanks.find(b => b.id === bankId)
  if (!bank) return show
  
  bank.slots.forEach(slot => {
    slot.cueId = undefined
    slot.isEmpty = true
    slot.isActive = false
    slot.color = undefined
    slot.label = undefined
    slot.icon = undefined
  })
  
  show.modified = new Date()
  
  return { ...show }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create an empty slot
 * 
 * NOTE: Old type system has 'isArmed' property which we're removing.
 * This will be resolved when we migrate to new types.
 */
function createEmptySlot(row: number, column: number): CueSlot {
  return {
    row,
    column,
    isEmpty: true,
    isActive: false
  } as CueSlot  // Type assertion for now, will fix in migration
}

/**
 * Generate bank label (A, B, C, ...)
 */
function generateBankLabel(bankIndex: number): string {
  if (bankIndex < 26) {
    return String.fromCharCode(65 + bankIndex)  // A-Z
  } else {
    // After Z, use AA, AB, etc.
    const first = Math.floor(bankIndex / 26) - 1
    const second = bankIndex % 26
    return String.fromCharCode(65 + first) + String.fromCharCode(65 + second)
  }
}

/**
 * Clear cue from all slots in all banks
 * This prevents duplicate button bug
 */
function clearCueFromAllSlots(show: Show, cueId: string): void {
  for (const bank of show.cueBanks) {
    for (const slot of bank.slots) {
      if (slot.cueId === cueId) {
        slot.cueId = undefined
        slot.isEmpty = true
        slot.isActive = false
      }
    }
  }
}

/**
 * Get slot statistics for a bank
 */
export function getBankStatistics(bank: CueBank): {
  total: number
  occupied: number
  empty: number
  percentFull: number
} {
  const total = bank.slots.length
  const occupied = countOccupiedSlots(bank)
  const empty = countEmptySlots(bank)
  const percentFull = total > 0 ? (occupied / total) * 100 : 0
  
  return { total, occupied, empty, percentFull }
}

/**
 * Validate bank grid dimensions
 */
export function validateBankDimensions(
  rows: number,
  columns: number
): { valid: boolean; error?: string } {
  if (rows < 1 || rows > 32) {
    return { valid: false, error: 'Rows must be between 1 and 32' }
  }
  
  if (columns < 1 || columns > 32) {
    return { valid: false, error: 'Columns must be between 1 and 32' }
  }
  
  const total = rows * columns
  if (total > 256) {
    return { valid: false, error: 'Total slots cannot exceed 256' }
  }
  
  return { valid: true }
}

/**
 * Auto-arrange cues in bank
 * Places cues sequentially in empty slots
 */
export function autoArrangeCues(
  show: Show,
  bankId: string,
  cueIds: string[]
): Show {
  const bank = show.cueBanks.find(b => b.id === bankId)
  if (!bank) return show
  
  // Clear all slots first
  show = clearAllSlots(show, bankId)
  
  // Assign cues to slots sequentially
  let slotIndex = 0
  for (const cueId of cueIds) {
    if (slotIndex >= bank.slots.length) break
    
    const slot = bank.slots[slotIndex]
    slot.cueId = cueId
    slot.isEmpty = false
    slotIndex++
  }
  
  show.modified = new Date()
  
  return { ...show }
}
