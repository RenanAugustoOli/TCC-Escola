import fs from 'fs'
import path from 'path'

const DB_DEST = '/tmp/academia.db'

if (!fs.existsSync(DB_DEST)) {
  const candidates = [
    path.join(process.cwd(), 'prisma', 'demo.db'),
    path.join(__dirname, '..', 'prisma', 'demo.db'),
    path.join(__dirname, 'prisma', 'demo.db'),
  ]
  for (const src of candidates) {
    try {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, DB_DEST)
        break
      }
    } catch {}
  }
}

process.env.DATABASE_URL = `file:${DB_DEST}`
