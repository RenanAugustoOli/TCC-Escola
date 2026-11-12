import { buildApp } from './app'
import { runBillingCycle } from './lib/billing'

const start = async () => {
  const app = await buildApp()
  const port = Number(process.env.PORT ?? 3001)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`API rodando em http://localhost:${port}`)
  console.log(`Documentação em http://localhost:${port}/docs`)

  const ONE_HOUR_MS = 60 * 60 * 1000
  setInterval(() => {
    runBillingCycle().catch(console.error)
  }, ONE_HOUR_MS)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
