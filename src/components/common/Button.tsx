import React from 'react'
import { cn } from '@/utils'
import { LucideIcon } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
    success: 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600',
    danger: 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600',
    warning: 'bg-yellow-600 dark:bg-yellow-700 text-white hover:bg-yellow-700 dark:hover:bg-yellow-600',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  }

  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className={cn('animate-spin', children && 'mr-2')}
          width={iconSizes[size]}
          height={iconSizes[size]}
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={iconSizes[size]} className={children ? 'mr-2' : ''} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={iconSizes[size]} className={children ? 'ml-2' : ''} />
      )}
    </button>
  )
}
