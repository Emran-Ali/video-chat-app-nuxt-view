import jwt from 'jsonwebtoken'
import { prisma } from '~/server/utils/prisma'
import { StreamCallService } from '~/server/utils/stream'

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

    let streamId = user?.streamId

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    if (!streamId) {
      const streamUser = await StreamCallService.createUser({
        id: user.id,
        name: user.name,
        role: 'user',
        image: user.image,
      })

      const firstUser = Object.values(streamUser.users)[0]
      streamId = firstUser?.id

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { streamId },
      })
    }

    const { password: _, ...userWithoutPassword } = user as any
    const sanitizedUser = {
      ...userWithoutPassword,
      streamId,
    }
    return sanitizedUser
  } catch (error) {
    console.error('error', error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Something went wrong',
    })
  }
})
