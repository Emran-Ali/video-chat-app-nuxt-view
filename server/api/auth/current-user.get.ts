import jwt from 'jsonwebtoken'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as { userId: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token',
    })
  }
})
