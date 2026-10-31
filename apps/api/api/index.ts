import './_db'
import type { IncomingMessage, ServerResponse } from 'http'
import { buildApp } from '../src/app'

type FastifyInstance = Awaited<ReturnType<typeof buildApp>>
let _app: FastifyInstance | null = null

async function getApp(): Promise<FastifyInstance> {
  if (_app) return _app
  _app = await buildApp()
  await _app.ready()
  return _app
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp()
  app.server.emit('request', req, res)
}
