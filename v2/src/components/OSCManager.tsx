import React, { useState, useEffect } from 'react'
import { useOSCStore } from '@/stores/oscStore'
import { useProjectStore } from '@/stores/projectStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/utils'
import { OSCMessage, OSCConnection } from '@/types'
import {
  Radio,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react'

export const OSCManager: React.FC = () => {
  const {
    connections,
    activeConnectionId,
    config,
    outgoingMessages,
    incomingMessages,
    messageHistory,
    connect,
    disconnect,
    removeConnection,
    sendMessage,
    clearMessageHistory,
    processIncomingMessage,
  } = useOSCStore()

  const { tracks } = useProjectStore()
  const { osc: oscSettings } = useSettingsStore()

  // Use incoming port from settings for OSC server
  const incomingPort = oscSettings.defaultIncomingPort || 8000

  const [newConnectionHost, setNewConnectionHost] = useState('localhost')
  const [newConnectionPort, setNewConnectionPort] = useState(4003) // Holophonix default OSC port
  const [messageToSend, setMessageToSend] = useState('')
  const [messageArgs, setMessageArgs] = useState('')
  const [showMessageHistory, setShowMessageHistory] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle')

  const activeConnection = connections.find(conn => conn.id === activeConnectionId)

  // Start OSC incoming server on mount
  useEffect(() => {
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
    
    if (hasElectronAPI) {
      console.log('🎧 Starting OSC incoming server on port:', incomingPort)
      ;(window as any).electronAPI.oscStartServer(incomingPort)
        .then((result: any) => {
          if (result.success) {
            console.log('✅ OSC incoming server started:', result.message)
          } else {
            console.error('❌ Failed to start OSC incoming server:', result.error)
          }
        })
        .catch((error: any) => {
          console.error('❌ Error starting OSC incoming server:', error)
        })
    }
  }, [incomingPort])

  // Listen for incoming OSC messages from main process
  useEffect(() => {
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
    console.log('🔗 OSCManager electronAPI detection:', {
      hasElectronAPI: !!hasElectronAPI,
      windowType: typeof window,
      electronAPIType: typeof (window as any).electronAPI
    })

    if (hasElectronAPI) {
      console.log('🔗 Setting up OSC message listener...')
      const cleanup = (window as any).electronAPI.onOSCMessageReceived((message: any) => {
        console.log('📨 OSC Manager received message from main process:', message)
        console.log('📨 Message details:', {
          address: message.address,
          args: message.args,
          argsType: typeof message.args,
          argsIsArray: Array.isArray(message.args),
          timestamp: message.timestamp
        })
        // Call processIncomingMessage from the store directly to avoid stale closure
        useOSCStore.getState().processIncomingMessage(message)
        console.log('✅ processIncomingMessage called')
      })

      return cleanup
    } else {
      console.log('⚠️ electronAPI not available for OSC message listening')
    }
  }, []) // Empty dependency array - only set up once on mount

  const handleConnect = async () => {
    setConnectionStatus('connecting')
    try {
      await connect(newConnectionHost, newConnectionPort)
      setConnectionStatus('success')
      setTimeout(() => setConnectionStatus('idle'), 2000)
    } catch (error) {
      setConnectionStatus('error')
      setTimeout(() => setConnectionStatus('idle'), 3000)
    }
  }

  const handleDisconnect = (connectionId: string) => {
    disconnect(connectionId)
  }

  const handleRemoveConnection = (connectionId: string) => {
    removeConnection(connectionId)
  }

  const handleSendMessage = () => {
    if (!messageToSend.trim() || !activeConnection) return

    const args = messageArgs.split(',').map(arg => {
      const trimmed = arg.trim()
      // Try to parse as number, otherwise keep as string
      const num = parseFloat(trimmed)
      return isNaN(num) ? trimmed : num
    }).filter(arg => arg !== '') // Remove empty strings

    console.log('Sending OSC message:', messageToSend, args)
    sendMessage(messageToSend.trim(), args)
    setMessageToSend('')
    setMessageArgs('')
  }

  const handleSendTrackPosition = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track || !activeConnection) return

    sendMessage(`/track/${trackId}/position`, [track.position.x, track.position.y, track.position.z])
  }

  const handleSendTrackMute = (trackId: string, muted: boolean) => {
    if (!activeConnection) return
    sendMessage(`/track/${trackId}/mute`, [muted ? 1 : 0])
  }

  const handleSendTrackVolume = (trackId: string, volume: number) => {
    if (!activeConnection) return
    sendMessage(`/track/${trackId}/volume`, [volume])
  }

  const formatMessage = (message: OSCMessage) => {
    return `${message.address} ${message.args.map(arg => typeof arg === 'string' ? `"${arg}"` : arg).join(' ')}`
  }

  const getStatusIcon = (connection: OSCConnection) => {
    if (connectionStatus === 'connecting') return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
    if (connection.isConnected) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (connection.errorCount > 0) return <AlertCircle className="w-4 h-4 text-red-500" />
    return <WifiOff className="w-4 h-4 text-gray-400" />
  }

  const getStatusText = (connection: OSCConnection) => {
    if (connectionStatus === 'connecting') return 'Connecting...'
    if (connection.isConnected) return 'Connected'
    if (connection.errorCount > 0) return `Error (${connection.errorCount})`
    return 'Disconnected'
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 lg:mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">OSC Manager</h1>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMessageHistory(!showMessageHistory)}
            className={cn(
              "px-3 py-2 rounded-md text-sm transition-colors flex items-center",
              showMessageHistory ? "bg-blue-600 dark:bg-blue-700 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            )}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {showMessageHistory ? 'Hide History' : 'Show History'}
          </button>

          <button
            onClick={clearMessageHistory}
            className="px-3 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-md text-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 flex-1 min-h-0 overflow-auto custom-scrollbar">
        {/* Connection Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Device Connections</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Listening on port:</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{incomingPort}</span>
            </div>
          </div>

          {/* Current Connections */}
          <div className="space-y-3 mb-6">
            {connections.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <WifiOff className="w-8 h-8 mx-auto mb-2" />
                <p>No OSC connections configured</p>
              </div>
            ) : (
              connections.map((connection) => (
                <div
                  key={connection.id}
                  className={cn(
                    "p-4 border rounded-lg transition-colors",
                    connection.id === activeConnectionId ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(connection)}
                      <span className="font-medium">
                        {connection.host}:{connection.port}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        connection.isConnected ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      )}>
                        {getStatusText(connection)}
                      </span>

                      {connection.id === activeConnectionId && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Messages:</span> {connection.messageCount}
                    </div>
                    <div>
                      <span className="font-medium">Errors:</span> {connection.errorCount}
                    </div>
                    <div>
                      <span className="font-medium">Last Message:</span>
                      {connection.lastMessage ?
                        new Date(connection.lastMessage.timestamp || 0).toLocaleTimeString() :
                        'None'
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {connection.isConnected ? (
                      <button
                        onClick={() => handleDisconnect(connection.id)}
                        className="px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center"
                      >
                        <WifiOff className="w-4 h-4 mr-2" />
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => connect(connection.host, connection.port)}
                        disabled={connectionStatus === 'connecting'}
                        className="px-3 py-2 bg-green-600 dark:bg-green-700 text-white rounded text-sm hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
                      >
                        <Wifi className="w-4 h-4 mr-2" />
                        Connect
                      </button>
                    )}

                    <div className="flex items-center space-x-2">
                      {connection.id === activeConnectionId && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">Primary Connection</span>
                      )}

                      <button
                        onClick={() => handleRemoveConnection(connection.id)}
                        className="px-2 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded text-sm hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                        title="Remove Connection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New Connection Form */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Add New Connection</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Host</label>
                  <input
                    type="text"
                    value={newConnectionHost}
                    onChange={(e) => setNewConnectionHost(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Port</label>
                  <input
                    type="number"
                    min="1024"
                    max="65535"
                    value={newConnectionPort}
                    onChange={(e) => setNewConnectionPort(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={connectionStatus === 'connecting'}
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Connection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Message Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Message Interface</h2>

          {/* Message Sending */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">OSC Address</label>
              <input
                type="text"
                value={messageToSend}
                onChange={(e) => setMessageToSend(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="/track/1/position"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Arguments (comma-separated)</label>
              <input
                type="text"
                value={messageArgs}
                onChange={(e) => setMessageArgs(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="0, 0, 0"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!messageToSend.trim() || !activeConnection}
              className="w-full px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md text-sm hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </button>
          </div>

          {/* Quick Actions for Tracks */}
          {tracks.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h3>

              <div className="space-y-2">
                {tracks.slice(0, 5).map((track) => (
                  <div key={track.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{track.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({track.position.x.toFixed(1)}, {track.position.y.toFixed(1)}, {track.position.z.toFixed(1)})
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleSendTrackPosition(track.id)}
                        className="px-2 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded text-xs hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        title="Send position"
                      >
                        Pos
                      </button>
                      <button
                        onClick={() => handleSendTrackMute(track.id, !track.isMuted)}
                        className={cn(
                          "px-2 py-1 rounded text-xs transition-colors",
                          track.isMuted ? "bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600" : "bg-gray-600 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600"
                        )}
                        title={track.isMuted ? "Unmute" : "Mute"}
                      >
                        {track.isMuted ? 'Unmute' : 'Mute'}
                      </button>
                    </div>
                  </div>
                ))}

                {tracks.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    ... and {tracks.length - 5} more tracks
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message History */}
      {showMessageHistory && (
        <div className="mt-2 lg:mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 lg:p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">Message History</h2>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-900 dark:text-gray-100">Auto-scroll</span>
              </label>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                {messageHistory.length} messages
              </span>
            </div>
          </div>

          <div
            className="bg-gray-900 dark:bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-64 overflow-y-auto"
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            {messageHistory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">No messages yet...</p>
            ) : (
              messageHistory.map((message, index) => {
                // Determine if message is incoming or outgoing
                const isOutgoing = outgoingMessages.some(outgoing =>
                  outgoing.address === message.address &&
                  outgoing.timestamp === message.timestamp
                )

                return (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(message.timestamp || 0).toLocaleTimeString()}
                    </span>
                    {' '}
                    <span className={cn(
                      "font-medium",
                      isOutgoing ? "text-blue-400" : "text-green-400"
                    )}>
                      {isOutgoing ? '→' : '←'} {message.address}
                    </span>
                    {' '}
                    <span className={cn(
                      isOutgoing ? "text-yellow-400" : "text-green-300"
                    )}>
                      {Array.isArray(message.args)
                        ? message.args.map(arg => typeof arg === 'string' ? `"${arg}"` : arg).join(' ')
                        : `"${message.args}"`
                      }
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Connection Status Summary */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{connections.length}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Connections</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {connections.filter(c => c.isConnected).length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Connected</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {outgoingMessages.length + incomingMessages.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Messages Sent</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {connections.reduce((sum, c) => sum + c.errorCount, 0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Errors</div>
        </div>
      </div>
    </div>
  )
}
