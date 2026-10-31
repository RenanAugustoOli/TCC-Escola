import './lib/timezone'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { ZodError } from 'zod'

import { personalWorkoutsRoutes } from './routes/personalWorkouts'
import { authRoutes } from './routes/auth'
import { usersRoutes } from './routes/users'
import { plansRoutes } from './routes/plans'
import { subscriptionsRoutes } from './routes/subscriptions'
import { paymentsRoutes } from './routes/payments'
import { workoutsRoutes } from './routes/workouts'
import { dashboardRoutes } from './routes/dashboard'
import { billingRoutes } from './routes/billing'
import { classesRoutes } from './routes/classes'

export async function buildApp() {
  const app = Fastify({ logger: false })

  app.register(cors, {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  })

  app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  })

  app.register(swagger, {
    openapi: {
      info: { title: 'Academia API', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })

  app.register(swaggerUi, { routePrefix: '/docs' })

  app.register(authRoutes, { prefix: '/auth' })
  app.register(usersRoutes, { prefix: '/users' })
  app.register(plansRoutes, { prefix: '/plans' })
  app.register(subscriptionsRoutes, { prefix: '/subscriptions' })
  app.register(paymentsRoutes, { prefix: '/payments' })
  app.register(workoutsRoutes, { prefix: '/workouts' })
  app.register(dashboardRoutes, { prefix: '/dashboard' })
  app.register(personalWorkoutsRoutes, { prefix: '/personal-workouts' })
  app.register(billingRoutes, { prefix: '/billing' })
  app.register(classesRoutes, { prefix: '/classes' })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const messages = error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
        return `${path}: ${issue.message}`
      })
      return reply.status(400).send({ message: `Dados inválidos: ${messages.join('; ')}` })
    }
    app.log.error(error)
    reply.send(error)
  })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
