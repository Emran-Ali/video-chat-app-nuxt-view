import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '~/server/utils/prisma'
import { StreamCallService } from '~/server/utils/stream'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, name, fullName, image } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

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

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || fullName,
      image: image,
    },
  })

  // Create user in Stream
  const streamUser = await StreamCallService.createUser({
    id: user.id,
    name: user.name || user.email.split('@')[0],
    role: 'user',
    image: user.image || undefined,
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { streamId: streamUser.users[0].id },
  })

  // Generate Stream token
  const streamToken = StreamCallService.createUserToken(streamUser.users[0].id)

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
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
  }
})
