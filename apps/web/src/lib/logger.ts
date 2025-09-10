interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  category: 'AUTH' | 'API' | 'NAVIGATION' | 'GENERAL'
  message: string
  data?: any
}

class Logger {
  private logs: LogEntry[] = []
  private isDev = process.env.NODE_ENV === 'development'

  private createLog(level: LogEntry['level'], category: LogEntry['category'], message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    }
  }

  info(category: LogEntry['category'], message: string, data?: any) {
    const log = this.createLog('INFO', category, message, data)
    this.logs.push(log)
    
    if (this.isDev) {
      console.log(`[${log.timestamp}] [${log.level}] [${log.category}] ${log.message}`, data ? data : '')
    }
  }

  warn(category: LogEntry['category'], message: string, data?: any) {
    const log = this.createLog('WARN', category, message, data)
    this.logs.push(log)
    
    console.warn(`[${log.timestamp}] [${log.level}] [${log.category}] ${log.message}`, data ? data : '')
  }

  error(category: LogEntry['category'], message: string, data?: any) {
    const log = this.createLog('ERROR', category, message, data)
    this.logs.push(log)
    
    console.error(`[${log.timestamp}] [${log.level}] [${log.category}] ${log.message}`, data ? data : '')
  }

  debug(category: LogEntry['category'], message: string, data?: any) {
    if (!this.isDev) return
    
    const log = this.createLog('DEBUG', category, message, data)
    this.logs.push(log)
    
    console.debug(`[${log.timestamp}] [${log.level}] [${log.category}] ${log.message}`, data ? data : '')
  }

  // Network request logging
  logApiCall(method: string, url: string, payload?: any, response?: any, status?: number) {
    this.info('API', `${method} ${url}`, {
      payload: payload ? JSON.stringify(payload) : null,
      response: response ? JSON.stringify(response) : null,
      status,
      timestamp: new Date().toISOString()
    })
  }

  // Auth specific logging
  logAuthAction(action: string, success: boolean, details?: any) {
    const level = success ? 'INFO' : 'ERROR'
    this.createLog(level, 'AUTH', `Auth action: ${action}`, {
      success,
      details,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  }

  // Get logs for debugging
  getLogs(category?: LogEntry['category'], level?: LogEntry['level']) {
    let filteredLogs = this.logs
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }
    
    return filteredLogs
  }

  // Display logs in table format
  displayLogs(category?: LogEntry['category']) {
    const logs = this.getLogs(category)
    console.table(logs.map(log => ({
      Time: log.timestamp.split('T')[1].split('.')[0],
      Level: log.level,
      Category: log.category,
      Message: log.message,
      Data: log.data ? JSON.stringify(log.data).substring(0, 100) + '...' : ''
    })))
  }

  // Clear logs
  clearLogs() {
    this.logs = []
    console.log('Logs cleared')
  }
}

export const logger = new Logger()

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger
}
