import { Cue, Show, CueList } from '../types'
import { generateId } from '@/utils'

/**
 * Cue Actions Module
 * Handles CRUD operations for cues
 * 
 * Key fix: Prevents duplicate button bug by using skipAutoAssign option
 */

export interface CueActionOptions {
  skipAutoAssign?: boolean  // Don't auto-assign to bank slot
}

/**
 * Create a new cue
 * 
 * @param show - Current show
 * @param cueData - Cue data (without ID)
 * @param options - Creation options
 * @returns Cue ID and updated show
 */
export function createCue(
  show: Show,
  cueData: Omit<Cue, 'id'>,
  options: CueActionOptions = {}
): { cueId: string; show: Show } {
  // Generate unique ID
  const cueId = generateId()
  
  // Create full cue object
  const cue: Cue = {
    ...cueData,
    id: cueId,
    status: 'idle',
    triggerCount: 0,
    created: new Date(),
    modified: new Date()
  } as Cue
  
  // Add to first cue list (or create one)
  if (show.cueLists.length === 0) {
    show.cueLists.push({
      id: generateId(),
      name: 'Main List',
      cues: [cue],
      cueOrder: [cueId],
      autoFollow: false,
      loop: false,
      timecodeSync: false
    })
  } else {
    show.cueLists[0].cues.push(cue)
    show.cueLists[0].cueOrder.push(cueId)
  }
  
  // Only auto-assign to bank if not manually assigning later
  // This prevents the duplicate button bug
  if (!options.skipAutoAssign) {
    const activeBank = show.cueBanks.find(b => b.id === show.activeBankId)
    if (activeBank) {
      const emptySlot = activeBank.slots.find(s => s.isEmpty)
      if (emptySlot) {
        emptySlot.cueId = cueId
        emptySlot.isEmpty = false
      }
    }
  }
  
  show.modified = new Date()
  
  return { cueId, show: { ...show } }
}

/**
 * Update an existing cue
 * 
 * @param show - Current show
 * @param cueId - Cue ID to update
 * @param updates - Partial cue updates
 * @returns Updated show
 */
export function updateCue(
  show: Show,
  cueId: string,
  updates: Partial<Cue>
): Show {
  let updated = false
  
  // Update in all cue lists
  show.cueLists.forEach(list => {
    const cueIndex = list.cues.findIndex(c => c.id === cueId)
    if (cueIndex !== -1) {
      const currentCue = list.cues[cueIndex]
      // Merge updates with current cue, overwrite modified date
      list.cues[cueIndex] = {
        ...currentCue,
        ...updates,
        modified: new Date()
      } as Cue
      updated = true
    }
  })
  
  if (updated) {
    show.modified = new Date()
  }
  
  return { ...show }
}

/**
 * Delete a cue
 * 
 * @param show - Current show
 * @param cueId - Cue ID to delete
 * @returns Updated show
 */
export function deleteCue(
  show: Show,
  cueId: string
): Show {
  // Remove from all cue lists
  show.cueLists.forEach(list => {
    list.cues = list.cues.filter(c => c.id !== cueId)
    list.cueOrder = list.cueOrder.filter(id => id !== cueId)
  })
  
  // Remove from all bank slots
  show.cueBanks.forEach(bank => {
    bank.slots.forEach(slot => {
      if (slot.cueId === cueId) {
        slot.cueId = undefined
        slot.isEmpty = true
        slot.isActive = false
      }
    })
  })
  
  show.modified = new Date()
  
  return { ...show }
}

/**
 * Duplicate a cue
 * 
 * @param show - Current show
 * @param cueId - Cue ID to duplicate
 * @param options - Creation options for duplicate
 * @returns New cue ID and updated show
 */
export function duplicateCue(
  show: Show,
  cueId: string,
  options: CueActionOptions = {}
): { cueId: string; show: Show } | null {
  // Find the cue
  let sourceCue: Cue | undefined
  for (const list of show.cueLists) {
    sourceCue = list.cues.find(c => c.id === cueId)
    if (sourceCue) break
  }
  
  if (!sourceCue) {
    return null
  }
  
  // Create duplicate with modified name
  const duplicateData: Omit<Cue, 'id'> = {
    ...sourceCue,
    name: `${sourceCue.name} (Copy)`,
    status: 'idle',
    triggerCount: 0,
    lastTriggered: undefined
  }
  
  return createCue(show, duplicateData, options)
}

/**
 * Get cue by ID
 * 
 * @param show - Current show
 * @param cueId - Cue ID
 * @returns Cue or undefined
 */
export function getCueById(show: Show, cueId: string): Cue | undefined {
  for (const list of show.cueLists) {
    const cue = list.cues.find(c => c.id === cueId)
    if (cue) return cue
  }
  return undefined
}

/**
 * Get all cues from show
 * 
 * @param show - Current show
 * @returns Array of all cues
 */
export function getAllCues(show: Show): Cue[] {
  const allCues: Cue[] = []
  show.cueLists.forEach(list => {
    allCues.push(...list.cues)
  })
  return allCues
}

/**
 * Find cues by type
 * 
 * @param show - Current show
 * @param type - Cue type
 * @returns Array of matching cues
 */
export function getCuesByType(
  show: Show,
  type: 'animation' | 'osc' | 'reset'
): Cue[] {
  return getAllCues(show).filter(cue => (cue as any).type === type)
}

/**
 * Find cues by status
 * 
 * @param show - Current show
 * @param status - Cue status
 * @returns Array of matching cues
 */
export function getCuesByStatus(
  show: Show,
  status: 'idle' | 'active' | 'complete' | 'error'
): Cue[] {
  return getAllCues(show).filter(cue => cue.status === status)
}

/**
 * Reorder cues in a list
 * 
 * @param show - Current show
 * @param listId - Cue list ID
 * @param newOrder - New order of cue IDs
 * @returns Updated show
 */
export function reorderCues(
  show: Show,
  listId: string,
  newOrder: string[]
): Show {
  const list = show.cueLists.find(l => l.id === listId)
  if (!list) return show
  
  // Validate all IDs exist
  const validIds = newOrder.filter(id => list.cues.some(c => c.id === id))
  
  list.cueOrder = validIds
  show.modified = new Date()
  
  return { ...show }
}

/**
 * Move cue to different list
 * 
 * @param show - Current show
 * @param cueId - Cue ID
 * @param targetListId - Target list ID
 * @returns Updated show
 */
export function moveCueToList(
  show: Show,
  cueId: string,
  targetListId: string
): Show {
  // Find source and target lists
  let sourceCue: Cue | undefined
  let sourceList: CueList | undefined
  
  for (const list of show.cueLists) {
    const cue = list.cues.find(c => c.id === cueId)
    if (cue) {
      sourceCue = cue
      sourceList = list
      break
    }
  }
  
  const targetList = show.cueLists.find(l => l.id === targetListId)
  
  if (!sourceCue || !sourceList || !targetList || sourceList === targetList) {
    return show
  }
  
  // Remove from source
  sourceList.cues = sourceList.cues.filter(c => c.id !== cueId)
  sourceList.cueOrder = sourceList.cueOrder.filter(id => id !== cueId)
  
  // Add to target
  targetList.cues.push(sourceCue)
  targetList.cueOrder.push(cueId)
  
  show.modified = new Date()
  
  return { ...show }
}

/**
 * Batch update multiple cues
 * 
 * @param show - Current show
 * @param updates - Map of cue ID to updates
 * @returns Updated show
 */
export function batchUpdateCues(
  show: Show,
  updates: Map<string, Partial<Cue>>
): Show {
  updates.forEach((update, cueId) => {
    show = updateCue(show, cueId, update)
  })
  
  return show
}

/**
 * Validate cue name uniqueness
 * 
 * @param show - Current show
 * @param name - Cue name to validate
 * @param excludeId - Cue ID to exclude (for updates)
 * @returns True if name is unique
 */
export function isUniqueCueName(
  show: Show,
  name: string,
  excludeId?: string
): boolean {
  const allCues = getAllCues(show)
  return !allCues.some(cue => cue.name === name && cue.id !== excludeId)
}

/**
 * Generate unique cue name
 * 
 * @param show - Current show
 * @param baseName - Base name
 * @returns Unique name
 */
export function generateUniqueCueName(
  show: Show,
  baseName: string
): string {
  let name = baseName
  let counter = 1
  
  while (!isUniqueCueName(show, name)) {
    name = `${baseName} ${counter}`
    counter++
  }
  
  return name
}
