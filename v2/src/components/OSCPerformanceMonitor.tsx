/**
 * OSC Performance Monitor
 * 
 * Displays real-time performance metrics for OSC message batching
 * and animation engine performance
 */

import React, { useState, useEffect } from 'react'
import { Activity, Zap, Package, TrendingUp, Clock } from 'lucide-react'
import { oscBatchManager } from '@/utils/oscBatchManager'
import { useAnimationStore } from '@/stores/animationStore'

// Simple className utility
const cn = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' ')

interface PerformanceMetrics {
  batchStats: {
    totalBatchesSent: number
    totalMessagesSent: number
    averageBatchSize: number
    lastSendTime: number
    queueLength: number
  }
  engineStats: {
    fps: number
    averageFrameTime: number
    isRunning: boolean
  }
}

export const OSCPerformanceMonitor: React.FC<{ className?: string }> = ({ className }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    batchStats: {
      totalBatchesSent: 0,
      totalMessagesSent: 0,
      averageBatchSize: 0,
      lastSendTime: 0,
      queueLength: 0
    },
    engineStats: {
      fps: 0,
      averageFrameTime: 0,
      isRunning: false
    }
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const { averageFrameTime, isEngineRunning, frameCount } = useAnimationStore()

  useEffect(() => {
    const interval = setInterval(() => {
      const batchStats = oscBatchManager.getStats()
      const fps = averageFrameTime > 0 ? 1000 / averageFrameTime : 0

      setMetrics({
        batchStats,
        engineStats: {
          fps: Math.round(fps),
          averageFrameTime: Math.round(averageFrameTime * 10) / 10,
          isRunning: isEngineRunning
        }
      })
    }, 500) // Update every 500ms

    return () => clearInterval(interval)
  }, [averageFrameTime, isEngineRunning, frameCount])

  const handleReset = () => {
    oscBatchManager.resetStats()
  }

  const getHealthColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-500'
    if (value >= thresholds.warning) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div 
        className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Performance Monitor
            </span>
            {metrics.engineStats.isRunning && (
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                Running
              </span>
            )}
          </div>
          
          {/* Quick stats when collapsed */}
          {!isExpanded && (
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>{metrics.engineStats.fps} FPS</span>
              </div>
              <div className="flex items-center space-x-1">
                <Package className="w-3 h-3" />
                <span>{metrics.batchStats.totalBatchesSent} batches</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded metrics */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Engine Stats */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-purple-500" />
              Animation Engine
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded">
                <div className={cn(
                  "text-lg font-bold",
                  getHealthColor(metrics.engineStats.fps, { good: 50, warning: 30 })
                )}>
                  {metrics.engineStats.fps}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">FPS</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {metrics.engineStats.averageFrameTime}ms
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Frame Time</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded">
                <div className={cn(
                  "text-lg font-bold",
                  metrics.engineStats.isRunning ? "text-green-600 dark:text-green-400" : "text-gray-400"
                )}>
                  {metrics.engineStats.isRunning ? 'ON' : 'OFF'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Status</div>
              </div>
            </div>
          </div>

          {/* OSC Batch Stats */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <Package className="w-4 h-4 mr-2 text-orange-500" />
              OSC Batching
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {metrics.batchStats.totalBatchesSent}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Batches</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {metrics.batchStats.totalMessagesSent}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Messages</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {metrics.batchStats.averageBatchSize.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avg Batch Size</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {metrics.batchStats.queueLength}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Queue Length</div>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <h4 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Performance Insights
            </h4>
            <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
              {metrics.engineStats.fps < 30 && (
                <div>⚠️ Low FPS detected. Consider reducing visual effects.</div>
              )}
              {metrics.batchStats.averageBatchSize > 20 && (
                <div>✨ Excellent batching efficiency for multi-track animation!</div>
              )}
              {metrics.batchStats.queueLength > 10 && (
                <div>⚠️ High queue length. Messages may be backing up.</div>
              )}
              {metrics.engineStats.fps >= 50 && metrics.batchStats.averageBatchSize > 10 && (
                <div>✅ Optimal performance! All systems running smoothly.</div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {metrics.batchStats.lastSendTime > 0 
                ? `Last: ${new Date(metrics.batchStats.lastSendTime).toLocaleTimeString()}`
                : 'No sends yet'}
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white text-xs rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Reset Stats
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
