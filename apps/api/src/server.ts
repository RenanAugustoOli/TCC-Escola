import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

import { personalWorkoutsRoutes } from './routes/personalWorkouts'
import { authRoutes } from './routes/auth'
import { usersRoutes } from './routes/users'
import { plansRoutes } from './routes/plans'
import { subscriptionsRoutes } from './routes/subscriptions'
import { paymentsRoutes } from './routes/payments'
import { workoutsRoutes } from './routes/workouts'
import { dashboardRoutes } from './routes/dashboard'

const app = Fastify({ logger: true })

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

app.get('/health', async () => ({ status: 'ok' }))

const start = async () => {
  const port = Number(process.env.PORT ?? 3001)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`API rodando em http://localhost:${port}`)
  console.log(`Documentação em http://localhost:${port}/docs`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
