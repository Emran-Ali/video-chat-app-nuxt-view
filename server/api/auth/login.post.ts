import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '~/server/utils/prisma'
import { StreamCallService } from '~/server/utils/stream'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  // Create or update user in Stream
  await StreamCallService.createUser({
    id: user.id,
    name: user.name || user.email.split('@')[0],
    role: 'user',
    image: user.image || undefined,
  })

  // Generate Stream token
  const streamToken = StreamCallService.createUserToken(user.streamId)

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  )

  const { password: _, ...userWithoutPassword } = user
  return {
    data: {
      user: userWithoutPassword,
      accessToken: token,
      streamToken: streamToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    message: 'Login successful',
  }
})
