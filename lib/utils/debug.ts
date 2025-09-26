import debug from 'debug'

// Create debug namespaces for different parts of the app
export const dbDebug = debug('app:database')
export const authDebug = debug('app:auth')
export const apiDebug = debug('app:api')
export const uiDebug = debug('app:ui')

// Helper function to log database operations
export const logDbOperation = (operation: string, table: string, data?: any) => {
  dbDebug(`${operation} on ${table}:`, data)
}

// Helper function to log authentication events
export const logAuthEvent = (event: string, user?: any) => {
  authDebug(`Auth event: ${event}`, user ? { id: user.id, email: user.email } : 'No user')
}

// Helper function to log API calls
export const logApiCall = (method: string, endpoint: string, data?: any) => {
  apiDebug(`${method} ${endpoint}`, data)
}

// Helper function to log UI events
export const logUiEvent = (component: string, event: string, data?: any) => {
  uiDebug(`${component}: ${event}`, data)
}

// Type-safe error logging
export const logError = (context: string, error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[${context}] Error:`, errorMessage)
  if (error instanceof Error && error.stack) {
    console.error('Stack trace:', error.stack)
  }
}

// Database schema validation helper
export const validateDbSchema = (data: Record<string, any>, requiredFields: string[]) => {
  const missingFields = requiredFields.filter(field => !(field in data))
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }
  return true
}