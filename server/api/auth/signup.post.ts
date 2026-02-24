import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '~/server/utils/prisma'
import { StreamCallService } from '~/server/utils/stream'
import { signUpValidation } from '~/utils/validation/user-validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const validation = await signUpValidation.validate(body, {
      abortEarly: false,
    })
    const { email, password, name, image } = validation

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User already exists',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Note: If prisma type is stale, this might show a lint error until 'npx prisma generate' is run.
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name,
        image: image,
      },
    })

    console.log('User created:', user.id)

    // Create user in Stream
    let streamToken = ''
    try {
      const streamUser = await StreamCallService.createUser({
        id: user.id,
        name: user.name || user.email.split('@')[0],
        role: 'user',
        image: user.image,
      })

      const firstUser = Object.values(streamUser.users)[0]
      const streamId = firstUser?.id
      await prisma.user.update({
        where: { id: user.id },
        data: { streamId },
      })

      streamToken = StreamCallService.createUserToken(streamId)
    } catch (streamError) {
      console.error('Stream initialization error:', streamError)
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = user

    const sanitizedUser = {
      ...userWithoutPassword,
      image: userWithoutPassword.image || userWithoutPassword.photoUrl,
    }

    return {
      success: true,
      message: 'Account created successfully',
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
