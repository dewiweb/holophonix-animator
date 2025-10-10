import React from 'react'
import { Position } from '@/types'
import { cn } from '@/utils'

interface PositionInputProps {
  label: string
  value: Position
  onChange: (value: Position) => void
  disabled?: boolean
  className?: string
}

export const PositionInput: React.FC<PositionInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const handleChange = (axis: 'x' | 'y' | 'z', newValue: string) => {
    onChange({
      ...value,
      [axis]: parseFloat(newValue) || 0,
    })
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          step="0.1"
          value={value.x}
          onChange={(e) => handleChange('x', e.target.value)}
          disabled={disabled}
          className={cn(
            'px-2 py-1 border border-gray-300 rounded text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            disabled && 'bg-gray-100 cursor-not-allowed'
          )}
          placeholder="X"
        />
        <input
          type="number"
          step="0.1"
          value={value.y}
          onChange={(e) => handleChange('y', e.target.value)}
          disabled={disabled}
          className={cn(
            'px-2 py-1 border border-gray-300 rounded text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            disabled && 'bg-gray-100 cursor-not-allowed'
          )}
          placeholder="Y"
        />
        <input
          type="number"
          step="0.1"
          value={value.z}
          onChange={(e) => handleChange('z', e.target.value)}
          disabled={disabled}
          className={cn(
            'px-2 py-1 border border-gray-300 rounded text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            disabled && 'bg-gray-100 cursor-not-allowed'
          )}
          placeholder="Z"
        />
      </div>
    </div>
  )
}
