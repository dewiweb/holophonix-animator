/**
 * Device Availability Utilities for OSC Store
 * Handles checking if Holophonix device is available and responding
 */

export interface AvailabilityState {
  deviceAvailable: boolean
  lastAvailabilityCheck: number | null
  lastAvailabilityError: string | null
  _probePending: boolean
  _probeExpected: Set<string> | null
  _probeDeadline: number | null
  _probeMatched: boolean
  _availabilityIntervalId?: number | null
}

export interface AvailabilityActions {
  sendMessage: (address: string, args: (number | string | boolean)[]) => Promise<void>
  getState: () => AvailabilityState & { activeConnection?: { isConnected: boolean } | null }
  setState: (updates: Partial<AvailabilityState>) => void
}

/**
 * Check if the device is available by sending a lightweight probe
 * Uses strict matching to ensure we get a real response
 */
export async function checkDeviceAvailability(actions: AvailabilityActions): Promise<void> {
  try {
    // Prepare strict probe
    const expected = new Set<string>(['/track/1/name'])
    
    actions.setState({
      _probePending: true,
      _probeExpected: expected,
      _probeDeadline: Date.now() + 900,
      _probeMatched: false
    })

    // Send /get query to check device availability
    await actions.sendMessage('/get', ['/track/1/name'])

    // Wait until deadline or match
    const waitUntil = async (deadline: number): Promise<boolean> => {
      while (Date.now() < deadline) {
        const state = actions.getState()
        if (state._probeMatched) return true
        await new Promise(r => setTimeout(r, 50))
      }
      return actions.getState()._probeMatched
    }

    const state = actions.getState()
    const deadline = state._probeDeadline || (Date.now() + 900)
    const ok = await waitUntil(deadline)
    
    actions.setState({
      deviceAvailable: !!ok,
      lastAvailabilityCheck: Date.now(),
      lastAvailabilityError: ok ? null : 'No response to availability probe',
      _probePending: false,
      _probeExpected: null,
      _probeDeadline: null
    })
  } catch (e) {
    actions.setState({
      deviceAvailable: false,
      lastAvailabilityCheck: Date.now(),
      lastAvailabilityError: (e as Error).message
    })
  }
}

/**
 * Start polling device availability at regular intervals
 */
export function startAvailabilityPolling(
  actions: AvailabilityActions,
  intervalMs: number = 5000
): void {
  const state = actions.getState()
  
  if (state._availabilityIntervalId) {
    console.warn('⚠️ Availability polling already running')
    return
  }

  // Immediately check
  checkDeviceAvailability(actions)

  // Set up interval
  const id = window.setInterval(() => {
    const currentState = actions.getState()
    const active = currentState.activeConnection
    
    if (!active?.isConnected) {
      stopAvailabilityPolling(actions)
      return
    }
    
    checkDeviceAvailability(actions)
  }, intervalMs)

  actions.setState({ _availabilityIntervalId: id as unknown as number })
}

/**
 * Stop polling device availability
 */
export function stopAvailabilityPolling(actions: AvailabilityActions): void {
  const state = actions.getState()
  const id = state._availabilityIntervalId
  
  if (id) {
    window.clearInterval(id as unknown as number)
    actions.setState({ _availabilityIntervalId: null })
  }
}

/**
 * Handle probe response matching for availability checks
 * Called from message processor when a message arrives
 */
export function handleProbeResponse(
  messageAddress: string,
  actions: AvailabilityActions
): void {
  const state = actions.getState()
  
  // Strict availability probe matching: if an expected response arrives, mark matched
  if (state._probePending && state._probeExpected && state._probeExpected.has(messageAddress)) {
    actions.setState({
      _probeMatched: true,
      deviceAvailable: true,
      lastAvailabilityCheck: Date.now(),
      lastAvailabilityError: null
    })
  }
}
