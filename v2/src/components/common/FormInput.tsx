import React from 'react'
import { cn } from '@/utils'

interface FormInputProps {
  label: string
  value: number | string
  onChange: (value: number | string) => void
  type?: 'text' | 'number'
  placeholder?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  error?: string
  hint?: string
  className?: string
  inputClassName?: string
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  max,
  step,
  disabled = false,
  error,
  hint,
  className,
  inputClassName,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      onChange(parseFloat(e.target.value) || 0)
    } else {
      onChange(e.target.value)
    }
  }

  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-md text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
          error
            ? 'border-red-300 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-200 dark:border-gray-600',
          disabled && 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-60',
          inputClassName
        )}
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  )
}
