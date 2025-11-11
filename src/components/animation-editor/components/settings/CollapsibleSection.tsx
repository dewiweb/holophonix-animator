/**
 * Collapsible Section
 * 
 * Reusable collapsible section component for better UI organization
 */

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/utils'

interface CollapsibleSectionProps {
  title: string
  defaultExpanded?: boolean
  badge?: string
  children: React.ReactNode
  className?: string
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = true,
  badge,
  children,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={cn("border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">{title}</span>
          {badge && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
              {badge}
            </span>
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  )
}
