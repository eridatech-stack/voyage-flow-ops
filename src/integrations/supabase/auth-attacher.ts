import { createMiddleware } from '@tanstack/react-start'
import { getStoredToken } from '@/lib/auth/jwt'

// Attaches JWT token from localStorage to server function calls
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const token = getStoredToken()
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
)
