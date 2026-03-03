import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '~/server/utils/prisma'
import { StreamCallService } from '~/server/utils/stream'
import { loginValidation } from '~/utils/validation/user-validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    const validation = await loginValidation.validate(body, {
      abortEarly: false,
    })
    const { email, password } = validation

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
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
    try {
      await StreamCallService.createUser({
        id: user.id,
        name: user.name || user.email.split('@')[0],
        role: 'user',
        image: (user as any).image || (user as any).photoUrl || undefined,
      })
    } catch (streamError) {
      console.error('Stream sync error:', streamError)
    }

    // Generate Stream token
    const streamToken = StreamCallService.createUserToken(user.id)

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = user as any
    const sanitizedUser = {
      ...userWithoutPassword,
      image: userWithoutPassword.image || userWithoutPassword.photoUrl,
    }

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizedUser,
        accessToken: token,
        streamToken: streamToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      throw createError({
        statusCode: 400,
        message: error.errors[0],
      })
    }
    throw error
  }
})
