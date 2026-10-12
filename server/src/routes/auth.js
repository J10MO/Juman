import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { query } from '../db/pool.js'
import { requireAuth, signToken } from '../middleware/auth.js'

const router = Router()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { error: 'حاولت هواية مرات، استريح شوية وارجع جرّب' },
})

const registerSchema = z.object({
  name: z.string().trim().min(2, 'الاسم لازم يكون حرفين على الأقل').max(60),
  email: z.string().trim().toLowerCase().email('الإيميل مو صحيح'),
  password: z.string().min(8, 'الباسورد لازم يكون ٨ أحرف على الأقل').max(100),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('الإيميل مو صحيح'),
  password: z.string().min(1, 'اكتب الباسورد'),
})

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.created_at })

router.post('/register', limiter, async (req, res) => {
  const data = registerSchema.parse(req.body)
  const exists = await query('SELECT 1 FROM users WHERE email = $1', [data.email])
  if (exists.rowCount) return res.status(409).json({ error: 'هذا الإيميل مسجل من قبل. جرّب تسجل دخول' })

  const hash = await bcrypt.hash(data.password, 12)
  const { rows } = await query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [data.name, data.email, hash],
  )
  res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) })
})

router.post('/login', limiter, async (req, res) => {
  const data = loginSchema.parse(req.body)
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [data.email])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
    return res.status(401).json({ error: 'الإيميل أو الباسورد غلط' })
  }
  res.json({ token: signToken(user), user: publicUser(user) })
})

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.userId])
  if (!rows[0]) return res.status(404).json({ error: 'الحساب مو موجود' })
  res.json({ user: publicUser(rows[0]) })
})

export default router
