/**
 * Centralized logging utility
 * Provides consistent logging across the application with different severity levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: Date
  context?: string
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO
  private logs: LogEntry[] = []
  private maxLogs = 1000

  setLevel(level: LogLevel) {
    this.minLevel = level
  }

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    if (level < this.minLevel) return

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      context,
    }

    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Format output
    const emoji = this.getEmoji(level)
    const prefix = context ? `[${context}]` : ''
    const output = `${emoji} ${prefix} ${message}`

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(output, data)
        break
      case LogLevel.INFO:
        console.log(output, data)
        break
      case LogLevel.WARN:
        console.warn(output, data)
        break
      case LogLevel.ERROR:
        console.error(output, data)
        break
    }
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍'
      case LogLevel.INFO:
        return 'ℹ️'
      case LogLevel.WARN:
        return '⚠️'
      case LogLevel.ERROR:
        return '❌'
    }
  }

  debug(message: string, data?: any, context?: string) {
    this.log(LogLevel.DEBUG, message, data, context)
  }

  info(message: string, data?: any, context?: string) {
    this.log(LogLevel.INFO, message, data, context)
  }

  warn(message: string, data?: any, context?: string) {
    this.log(LogLevel.WARN, message, data, context)
  }

  error(message: string, error?: any, context?: string) {
    this.log(LogLevel.ERROR, message, error, context)
  }

  // Specialized logging methods
  osc(message: string, data?: any) {
    this.info(message, data, 'OSC')
  }

  animation(message: string, data?: any) {
    this.info(message, data, 'Animation')
  }

  track(message: string, data?: any) {
    this.info(message, data, 'Track')
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }
}

export const logger = new Logger()

// Set to DEBUG in development
try {
  if (process.env.NODE_ENV === 'development') {
    logger.setLevel(LogLevel.DEBUG)
  }
} catch {
  // Fallback to INFO level if environment check fails
  logger.setLevel(LogLevel.INFO)
}
