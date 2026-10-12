import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ZodError } from 'zod'
import { config } from './config.js'
import { pool } from './db/pool.js'
import authRoutes from './routes/auth.js'
import catalogRoutes from './routes/catalog.js'
import designRoutes from './routes/designs.js'
import contactRoutes from './routes/contact.js'
import orderRoutes from './routes/orders.js'

const app = express()
// Behind Render's proxy: use the visitor's IP (rate limits) instead of the proxy's.
if (config.isProd) app.set('trust proxy', 1)

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
app.use(cors({ origin: config.clientOrigin }))
app.use(express.json({ limit: '3mb' }))
if (!config.isProd) app.use(morgan('dev'))

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: true })
  } catch {
    res.status(503).json({ ok: false, db: false, error: 'قاعدة البيانات مو متصلة' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api', catalogRoutes)
app.use('/api/designs', designRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/orders', orderRoutes)

app.use('/api', (_req, res) => res.status(404).json({ error: 'هذا الرابط ماكو' }))

// In production the API also serves the built React app.
const dist = fileURLToPath(new URL('../../client/dist', import.meta.url))
if (existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '7d', index: false }))
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile('index.html', { root: dist }) : next()))
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message || 'البيانات مو صحيحة', issues: err.issues })
  }
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'الملف كلش كبير' })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'البيانات مو مفهومة' })
  console.error(err)
  if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000') {
    return res.status(503).json({ error: 'قاعدة البيانات مو متصلة، شغّل npm run db:setup' })
  }
  res.status(500).json({ error: 'صار خلل بالسيرفر، جرّب مرة ثانية' })
})

app.listen(config.port, () => {
  console.log(`🚀 سيرفر جُمان شغّال على http://localhost:${config.port}`)
})
