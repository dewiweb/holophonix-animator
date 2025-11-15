import { app, BrowserWindow, Menu, ipcMain, dialog, screen } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as fs from 'fs'
import * as osc from 'osc'
import * as dgram from 'dgram'

// Load animation engine (plain JS, runs in main process)
const { mainAnimationEngine } = require('./main-process/animationEngine.cjs')

// For Electron main process, use app.getAppPath() for absolute paths
const appPath = app.getAppPath()
const preloadPath = join(appPath, 'preload.cjs')

console.log('🔍 Debug info:', {
  appPath,
  currentDir: process.cwd(),
  preloadPath,
  distPath: join(appPath, '../dist/index.html')
})

const isDev = process.env.NODE_ENV === 'development'

console.log('🔍 App mode:', isDev ? 'DEVELOPMENT' : 'PRODUCTION')

// OSC Communication setup
let oscServer: any = null
let oscClient: any = null

// OSC Server setup for development
function startOSCServer(port: number) {
  try {
    console.log(`Starting OSC server on port ${port}...`)

    // Close existing server if any
    if (oscServer) {
      oscServer.close()
      oscServer = null
    }

    oscServer = dgram.createSocket('udp4')

    oscServer.on('listening', () => {
      const address = oscServer!.address()
      console.log(`✅ OSC Server listening on ${address.address}:${address.port}`)
    })

    oscServer.on('message', (rawMessage: Buffer, remote: dgram.RemoteInfo) => {
      try {
        // Verbose logging disabled for performance

        // Parse OSC message
        const oscMessage = osc.readMessage(rawMessage)
        if (oscMessage) {
          // Send to renderer process
          if (mainWindow && mainWindow.webContents) {
            const messageToSend = {
              address: oscMessage.address,
              args: oscMessage.args,
              timestamp: Date.now(),
            }
            mainWindow.webContents.send('osc-message-received', messageToSend)
          }
        } else {
          console.log('❌ Failed to parse OSC message')
        }
      } catch (error) {
        console.error('❌ Error parsing OSC message:', error)
      }
    })

    oscServer.on('error', (err: Error) => {
      console.error('❌ OSC Server error:', err)
    })

    oscServer.bind(port, '0.0.0.0', () => {
      console.log(`✅ OSC Server bound to port ${port}`)
    })

    return { success: true, message: `OSC Server started on port ${port}` }
  } catch (error) {
    console.error('❌ Failed to start OSC server:', error)
    return { success: false, error: (error as Error).message }
  }
}

// OSC Client for sending messages
const sendOSCMessage = (host: string, port: number, address: string, args: any[]) => {
  try {
    // Verbose logging disabled for performance

    if (!oscClient) {
      console.log('🔌 Creating new OSC client...')
      oscClient = dgram.createSocket('udp4')
    }

    const message = osc.writeMessage({
      address,
      args,
    })

    console.log(`📦 OSC message buffer: ${message.length} bytes`)

    oscClient.send(message, 0, message.length, port, host, (err: Error | null) => {
      if (err) {
        console.error('❌ Error sending OSC message:', err)
      } else {
        console.log('✅ OSC message sent successfully')
      }
    })

    return { success: true, message: `OSC message sent to ${host}:${port}` }
  } catch (error) {
    console.error('❌ Error creating/sending OSC message:', error)
    return { success: false, error: (error as Error).message }
  }
}

let mainWindow: BrowserWindow | null = null

const createWindow = (): void => {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  
  // Calculate window size based on screen resolution
  // For 1366x768 screens, work area is typically ~720-740px height (minus taskbar)
  // Start with 80% of work area to ensure it fits comfortably
  const idealWidth = Math.floor(screenWidth * 0.80)
  const idealHeight = Math.floor(screenHeight * 0.80)
  
  // Ensure window fits on screen with margins, no artificial minimums
  const windowWidth = Math.min(idealWidth, screenWidth - 50)
  const windowHeight = Math.min(idealHeight, screenHeight - 50)
  
  // Set minimum size that works even on smallest common screens (1366x768)
  // For 768px screen height, work area ~720px, so minimum should be ~400px
  const minWidth = Math.min(800, screenWidth - 100)
  const minHeight = Math.min(400, screenHeight - 100)
  
  console.log('='.repeat(60))
  console.log(`🖥️  Screen work area: ${screenWidth}x${screenHeight}`)
  console.log(`📐 Window size: ${windowWidth}x${windowHeight}`)
  console.log(`📏 Minimum size: ${minWidth}x${minHeight}`)
  console.log(`📊 Calculations:`)
  console.log(`   - idealWidth: ${idealWidth} (${screenWidth} * 0.80)`)
  console.log(`   - idealHeight: ${idealHeight} (${screenHeight} * 0.80)`)
  console.log(`   - minWidth: min(800, ${screenWidth} - 100) = ${minWidth}`)
  console.log(`   - minHeight: min(400, ${screenHeight} - 100) = ${minHeight}`)
  console.log('='.repeat(60))
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: minWidth,
    minHeight: minHeight,
    maxWidth: screenWidth,
    maxHeight: screenHeight,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    frame: true, // Ensure native window frame is used
    center: true, // Center window on screen
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
    title: 'Holophonix Animator v2',
    icon: join(appPath, '../assets/icon.png'), // Add icon later
    show: false, // Don't show until ready
  })

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      const [actualWidth, actualHeight] = mainWindow.getSize()
      const [actualMinWidth, actualMinHeight] = mainWindow.getMinimumSize()
      console.log('🪟 Window created with actual size:', `${actualWidth}x${actualHeight}`)
      console.log('🔒 Actual minimum size:', `${actualMinWidth}x${actualMinHeight}`)
      mainWindow.show()
    }
  })

  // Load the app
  if (isDev) {
    // Development: try Vite dev server
    console.log('🔧 Development mode: Loading from Vite dev server')
    mainWindow.loadURL('http://localhost:5173').then(() => {
      console.log('✅ Successfully loaded from Vite dev server')
      if (mainWindow) {
        mainWindow.webContents.openDevTools()
      }
    }).catch((error) => {
      console.log('❌ Vite dev server not available, trying filesystem fallback:', error.message)
      try {
        if (mainWindow) {
          mainWindow.loadFile(join(appPath, 'dist/index.html'))
        }
      } catch (fileError) {
        console.error('❌ Filesystem loading also failed:', fileError as Error)
      }
    })
  } else {
    // Production: load from bundled files (inside app.asar)
    const indexPath = join(appPath, 'dist/index.html')
    console.log('🔧 Production mode: Loading from', indexPath)
    mainWindow.loadFile(indexPath).catch((error) => {
      console.error('❌ Failed to load index.html:', error)
    })
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
    // Clean up OSC connections
    if (oscServer) {
      oscServer.close()
      oscServer = null
    }
    if (oscClient) {
      oscClient.close()
      oscClient = null
    }
  })

  // Set up OSC message forwarding from main to renderer
  if (mainWindow) {
    console.log('🔧 Setting up OSC server on window load...')
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('🔧 Window finished loading, OSC server will start when settings are received...')
      // OSC server will start when frontend sends settings via IPC
    })
  }
}

// App event listeners
app.whenReady().then(() => {
  createWindow()

  // Create application menu
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'new-project')
          },
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile'],
              filters: [
                { name: 'Holophonix Projects', extensions: ['holophonix'] },
                { name: 'All Files', extensions: ['*'] },
              ],
            })

            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('menu-action', 'open-project', result.filePaths[0])
            }
          },
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'save-project')
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Holophonix Animator',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About',
              message: 'Holophonix Animator v2',
              detail: 'Modern 3D sound animation system for Holophonix processors\nVersion 2.0.0',
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // Initialize animation engine callbacks (after window is created)
  mainAnimationEngine.setCallbacks({
    onPositionUpdate: (updates: any) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('animation-position-update', updates)
      }
    },
    onOSCBatch: (batch: any) => {
      // Use existing OSC batch sending mechanism
      const activeConnectionId = oscClients.keys().next().value
      if (activeConnectionId) {
        const client = oscClients.get(activeConnectionId)
        if (client) {
          const packets = batch.messages.map((msg: any) => ({
            address: `/track/${msg.trackIndex}/${msg.coordSystem}`,
            args: [
              { type: 'f', value: msg.position.x },
              { type: 'f', value: msg.position.y },
              { type: 'f', value: msg.position.z }
            ]
          }))
          
          const oscBundle = {
            timeTag: { raw: [0, 1] },
            packets: packets
          }
          
          client.send(oscBundle)
        }
      }
    },
    onAnimationStopped: (animationId: any) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('animation-stopped', { animationId })
      }
    },
    onPositionCalculationRequest: (requests: any) => {
      // Send requests to renderer for position calculation
      if (mainWindow && !mainWindow.isDestroyed()) {
        // Process each request
        requests.forEach((request: any) => {
          mainWindow!.webContents.send('position-calculation-request', request)
        })
      }
    }
  })
  
  // Handle position calculation responses from renderer
  ipcMain.on('position-calculation-response', (event, response: any) => {
    // Send positions via OSC immediately (non-throttled!)
    const { animationId, positions } = response
    
    if (positions && positions.length > 0) {
      const activeConnectionId = oscClients.keys().next().value
      if (activeConnectionId) {
        const client = oscClients.get(activeConnectionId)
        if (client) {
          const packets = positions.map((pos: any) => ({
            address: `/track/${pos.holophonixIndex}/xyz`,
            args: [
              { type: 'f', value: pos.position.x },
              { type: 'f', value: pos.position.y },
              { type: 'f', value: pos.position.z }
            ]
          }))
          
          const oscBundle = {
            timeTag: { raw: [0, 1] },
            packets: packets
          }
          
          client.send(oscBundle)
        }
      }
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for communication with renderer process
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: [
      { name: 'Holophonix Projects', extensions: ['holophonix'] },
    ],
  })

  return result
})

// OSC Client setup for outgoing connections
let oscClients: Map<string, any> = new Map() // Map<deviceId, oscClient>

function createOSCClient(host: string, port: number, sendBufferSize: number = 262144) {
  try {
    // Create OSC client with optimized settings
    const client = new osc.UDPPort({
      localAddress: '0.0.0.0',
      localPort: 0, // Let OS assign local port
      remoteAddress: host,
      remotePort: port,
      metadata: true
    })

    // Access underlying UDP socket and optimize buffer sizes
    client.on('ready', () => {
      if (client.socket) {
        try {
          // Minimal buffer for real-time sync: prioritize low latency over smoothness
          // 64KB holds ~500 messages (~0.5 seconds max latency)
          // Small buffer ensures device stays in sync with app during animation
          client.socket.setSendBufferSize(64 * 1024) // 64KB - minimal latency
          console.log(`✅ OSC client socket optimized: 64KB send buffer (low latency)`)
        } catch (bufferError) {
          console.warn('⚠️ Could not set socket buffer size:', bufferError)
        }
      }
    })

    client.open()
    console.log(`✅ Created OSC client for ${host}:${port}`)
    return client
  } catch (error) {
    console.error('❌ Failed to create OSC client:', error)
    return null
  }
}

function sendOSCMessageToDevice(deviceId: string, address: string, args: any[]) {
  const client = oscClients.get(deviceId)
  if (client) {
    client.send({
      address: address,
      args: args
    })
    // Verbose logging disabled for performance
  } else {
    console.error(`❌ No OSC client found for device ${deviceId}`)
  }
}

ipcMain.handle('osc-send-message', async (event, host: string, port: number, address: string, args: any[]) => {
  try {
    // Verbose logging disabled for performance
    sendOSCMessage(host, port, address, args)
    return { success: true, message: `OSC message sent to ${host}:${port}` }
  } catch (error) {
    console.error('❌ IPC osc-send-message error:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('osc-update-settings', async (event, settings: any) => {
  try {
    // Verbose logging disabled for performance

    // If the incoming port changed, restart the OSC server
    if (settings.defaultIncomingPort) {
      const newPort = settings.defaultIncomingPort
      const currentPort = oscServer?.port

      if (currentPort !== newPort) {
        console.log(`🔄 Restarting OSC server from port ${currentPort || 'none'} to ${newPort}`)

        // Close existing server if any
        if (oscServer) {
          try {
            oscServer.close()
          } catch (closeError) {
            console.warn('⚠️ Error closing existing OSC server:', closeError)
          }
          oscServer = null
        }

        // Start new server with updated port
        const result = startOSCServer(newPort)
        if (result && result.success) {
          console.log('✅ OSC server restarted on port:', newPort)
          return { success: true, message: `OSC server restarted on port ${newPort}` }
        } else {
          const errorMsg = result?.error || 'Failed to restart OSC server'
          console.error('❌ Failed to restart OSC server:', errorMsg)
          return { success: false, error: errorMsg }
        }
      } else {
        console.log('ℹ️ OSC server already running on port:', newPort)
      }
    }

    return { success: true, message: 'OSC settings updated' }
  } catch (error) {
    console.error('❌ IPC osc-update-settings error:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('osc-start-server', async (event, port: number) => {
  try {
    // Verbose logging disabled for performance

    // Close existing server if any
    if (oscServer) {
      oscServer.close()
      oscServer = null
    }

    // Start new server with specified port
    const result = startOSCServer(port)
    console.log('🔧 OSC server started on port:', port)
    return { success: true, message: `OSC Server started on port ${port}` }
  } catch (error) {
    console.error('❌ IPC osc-start-server error:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('osc-connect-device', async (event, deviceId: string, host: string, port: number) => {
  try {
    // Verbose logging disabled for performance

    // Close existing client if any
    const existingClient = oscClients.get(deviceId)
    if (existingClient) {
      existingClient.close()
    }

    // Create new client for this device
    const client = createOSCClient(host, port)
    if (client) {
      oscClients.set(deviceId, client)
      return { success: true, message: `Connected to device ${deviceId} at ${host}:${port}` }
    } else {
      return { success: false, error: 'Failed to create OSC client' }
    }
  } catch (error) {
    console.error('❌ IPC osc-connect-device error:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('osc-disconnect-device', async (event, deviceId: string) => {
  try {
    // Verbose logging disabled for performance
    const client = oscClients.get(deviceId)
    if (client) {
      client.close()
      oscClients.delete(deviceId)
      // Clear queue tracking
      oscMessageQueues.delete(deviceId)
      return { success: true, message: `Disconnected from device ${deviceId}` }
    } else {
      return { success: false, error: 'Device not found' }
    }
  } catch (error) {
    console.error('❌ IPC osc-disconnect-device error:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Clear OSC socket buffer by recreating the client
// This ensures buffered messages don't continue sending after animation stops
ipcMain.handle('osc-clear-device-buffer', async (event, deviceId: string) => {
  try {
    const client = oscClients.get(deviceId)
    if (!client) {
      return { success: false, error: 'Device not found' }
    }

    // Get connection info before closing
    const host = client.options.remoteAddress
    const port = client.options.remotePort
    
    console.log(`🧹 Clearing OSC buffer for device ${deviceId} (${host}:${port})`)
    
    // Close old client (this clears the buffer)
    client.close()
    
    // Create new client with fresh buffer
    const newClient = createOSCClient(host, port)
    if (newClient) {
      oscClients.set(deviceId, newClient)
      
      // Reset queue tracking
      const queueInfo = oscMessageQueues.get(deviceId)
      if (queueInfo) {
        queueInfo.count = 0
        queueInfo.lastWarning = 0
      }
      
      console.log(`✅ OSC buffer cleared, client recreated`)
      return { success: true, message: 'Buffer cleared' }
    } else {
      return { success: false, error: 'Failed to recreate client' }
    }
  } catch (error) {
    console.error('❌ IPC osc-clear-device-buffer error:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('osc-send-to-device', async (event, deviceId: string, address: string, args: any[]) => {
  try {
    const client = oscClients.get(deviceId)
    if (!client) {
      console.error(`❌ No OSC client found for device ${deviceId}`)
      return { success: false, error: `Device ${deviceId} not connected` }
    }

    // Queue overflow protection (individual messages)
    let queueInfo = oscMessageQueues.get(deviceId)
    if (!queueInfo) {
      queueInfo = { count: 0, lastWarning: 0 }
      oscMessageQueues.set(deviceId, queueInfo)
    }

    if (queueInfo.count > MAX_QUEUE_SIZE) {
      const now = Date.now()
      if (now - queueInfo.lastWarning > QUEUE_WARNING_INTERVAL) {
        console.warn(`⚠️ OSC queue overflow for device ${deviceId}`)
        queueInfo.lastWarning = now
      }
      return { success: false, error: 'Queue overflow' }
    }

    queueInfo.count++

    // Format args for OSC library
    const formattedArgs = args.map((arg: any) => {
      if (arg && typeof arg === 'object' && 'type' in arg && 'value' in arg) {
        return arg
      }
      
      if (typeof arg === 'number') {
        return { type: Number.isInteger(arg) ? 'i' : 'f', value: arg }
      } else if (typeof arg === 'string') {
        return { type: 's', value: arg }
      } else if (typeof arg === 'boolean') {
        return { type: arg ? 'T' : 'F' }
      } else {
        return { type: 's', value: String(arg) }
      }
    })

    // Non-blocking send
    client.send({
      address: address,
      args: formattedArgs
    })
    
    // Decrement queue counter
    setTimeout(() => {
      queueInfo!.count = Math.max(0, queueInfo!.count - 1)
    }, 50)
    
    return { success: true, message: `OSC message sent to device ${deviceId}` }
  } catch (error) {
    console.error('❌ IPC osc-send-to-device error:', error)
    const queueInfo = oscMessageQueues.get(deviceId)
    if (queueInfo) {
      queueInfo.count = Math.max(0, queueInfo.count - 1)
    }
    return { success: false, error: (error as Error).message }
  }
})

// Message queue tracking for overflow protection
const oscMessageQueues = new Map<string, { count: number; lastWarning: number }>()
const MAX_QUEUE_SIZE = 50 // Balanced: handles burst traffic while maintaining sync
const QUEUE_WARNING_INTERVAL = 5000 // Warn every 5 seconds

// OSC Batch sending - optimized for multi-track animations
ipcMain.handle('osc-send-batch', async (event, deviceId: string, batch: any) => {
  try {
    const client = oscClients.get(deviceId)
    if (!client) {
      console.error(`❌ No OSC client found for device ${deviceId}`)
      return { success: false, error: `Device ${deviceId} not connected` }
    }

    // Queue overflow protection
    let queueInfo = oscMessageQueues.get(deviceId)
    if (!queueInfo) {
      queueInfo = { count: 0, lastWarning: 0 }
      oscMessageQueues.set(deviceId, queueInfo)
    }

    // If queue is overflowing, drop this batch and warn
    if (queueInfo.count > MAX_QUEUE_SIZE) {
      const now = Date.now()
      if (now - queueInfo.lastWarning > QUEUE_WARNING_INTERVAL) {
        console.warn(`⚠️ OSC message queue overflow for device ${deviceId}. Dropping messages. Reduce track count or animation complexity.`)
        queueInfo.lastWarning = now
      }
      return { success: false, error: 'Queue overflow - messages dropped' }
    }

    // Increment queue counter
    queueInfo.count += batch.messages.length

    // Create OSC bundle for time-synchronized sending
    const packets = batch.messages.map((msg: any) => ({
      address: `/track/${msg.trackIndex}/${msg.coordSystem}`,
      args: [
        { type: 'f', value: msg.position.x },
        { type: 'f', value: msg.position.y },
        { type: 'f', value: msg.position.z }
      ]
    }))

    // Send as OSC bundle (all messages arrive together)
    const bundle = {
      timeTag: { raw: [0, 1] }, // Immediate execution
      packets: packets
    }

    // Non-blocking send with callback
    client.send(bundle)
    
    // Decrement queue counter after a brief delay (messages sent)
    setTimeout(() => {
      queueInfo!.count = Math.max(0, queueInfo!.count - batch.messages.length)
    }, 50)
    
    return { 
      success: true, 
      message: `OSC batch sent to device ${deviceId}`,
      messageCount: packets.length
    }
  } catch (error) {
    console.error('❌ IPC osc-send-batch error:', error)
    // Decrement on error
    const queueInfo = oscMessageQueues.get(deviceId)
    if (queueInfo) {
      queueInfo.count = Math.max(0, queueInfo.count - (batch.messages?.length || 0))
    }
    return { success: false, error: (error as Error).message }
  }
})

// High-precision timer for animation engine (runs in main process, never throttled)
let animationTimer: NodeJS.Timeout | null = null
let lastAnimationTick = Date.now()

ipcMain.on('start-animation-timer', (event, intervalMs: number) => {
  console.log(`⏱️ Starting main process animation timer at ${intervalMs}ms interval`)
  
  if (animationTimer) {
    clearInterval(animationTimer)
  }
  
  lastAnimationTick = Date.now()
  
  animationTimer = setInterval(() => {
    const now = Date.now()
    const deltaTime = now - lastAnimationTick
    lastAnimationTick = now
    
    // Send tick to renderer process
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('animation-tick', { timestamp: now, deltaTime })
    }
  }, intervalMs)
})

ipcMain.on('stop-animation-timer', () => {
  console.log(`⏱️ Stopping main process animation timer`)
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
})

// ========================================
// MAIN PROCESS ANIMATION ENGINE
// ========================================
// Note: Callbacks are initialized in app.whenReady() block above

// Set engine configuration
ipcMain.handle('animation-engine-set-config', async (event, config: any) => {
  try {
    mainAnimationEngine.setConfig(config)
    return { success: true }
  } catch (error) {
    console.error('❌ Error setting engine config:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Play animation in main process
ipcMain.handle('animation-engine-play', async (event, snapshot: any) => {
  try {
    console.log('🎬 Main engine: Received play command for animation', snapshot.animationId)
    
    // Convert tracks array to Map if needed
    if (Array.isArray(snapshot.tracks)) {
      const tracksMap = new Map()
      snapshot.tracks.forEach((track: any) => {
        tracksMap.set(track.trackId, track)
      })
      snapshot.tracks = tracksMap
    }
    
    mainAnimationEngine.playAnimation(snapshot)
    return { success: true }
  } catch (error) {
    console.error('❌ Error playing animation in main engine:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Pause animation
ipcMain.handle('animation-engine-pause', async (event, animationId: string, currentTime: number) => {
  try {
    mainAnimationEngine.pauseAnimation(animationId, currentTime)
    return { success: true }
  } catch (error) {
    console.error('❌ Error pausing animation:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Resume animation
ipcMain.handle('animation-engine-resume', async (event, animationId: string, currentTime: number) => {
  try {
    mainAnimationEngine.resumeAnimation(animationId, currentTime)
    return { success: true }
  } catch (error) {
    console.error('❌ Error resuming animation:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Stop animation
ipcMain.handle('animation-engine-stop', async (event, animationId: string) => {
  try {
    mainAnimationEngine.stopAnimation(animationId)
    return { success: true }
  } catch (error) {
    console.error('❌ Error stopping animation:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Stop all animations
ipcMain.handle('animation-engine-stop-all', async () => {
  try {
    mainAnimationEngine.stopAll()
    return { success: true }
  } catch (error) {
    console.error('❌ Error stopping all animations:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Get engine status
ipcMain.handle('animation-engine-status', async () => {
  try {
    const status = mainAnimationEngine.getStatus()
    return { success: true, status }
  } catch (error) {
    console.error('❌ Error getting engine status:', error)
    return { success: false, error: (error as Error).message }
  }
})

// ========================================
// PROJECT FILE OPERATIONS
// ========================================

// Show save dialog and return file path
ipcMain.handle('project-show-save-dialog', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Save Holophonix Project',
      defaultPath: 'Untitled.hpx',
      filters: [
        { name: 'Holophonix Projects', extensions: ['hpx'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return result
  } catch (error) {
    console.error('❌ Error showing save dialog:', error)
    return { canceled: true, filePath: undefined }
  }
})

// Show open dialog and return file path
ipcMain.handle('project-show-open-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Open Holophonix Project',
      properties: ['openFile'],
      filters: [
        { name: 'Holophonix Projects', extensions: ['hpx'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return result
  } catch (error) {
    console.error('❌ Error showing open dialog:', error)
    return { canceled: true, filePaths: [] }
  }
})

// Write project data to file
ipcMain.handle('project-write-file', async (event, filePath: string, projectData: string) => {
  try {
    console.log('💾 Writing project file:', filePath)
    fs.writeFileSync(filePath, projectData, 'utf-8')
    console.log('✅ Project file saved successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error writing project file:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Read project data from file
ipcMain.handle('project-read-file', async (event, filePath: string) => {
  try {
    console.log('📖 Reading project file:', filePath)
    const data = fs.readFileSync(filePath, 'utf-8')
    console.log('✅ Project file read successfully')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error reading project file:', error)
    return { success: false, error: (error as Error).message }
  }
})
