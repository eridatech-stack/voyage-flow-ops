import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { verifyToken } from '@/lib/auth/jwt'

export const requireAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest()
    const authHeader = request?.headers?.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) throw new Error('Unauthorized')
    const payload = await verifyToken(token)
    if (!payload) throw new Error('Unauthorized: Invalid token')
    return next({ context: { userId: payload.userId, email: payload.email } })
  },
)
