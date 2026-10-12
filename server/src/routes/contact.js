import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { query } from '../db/pool.js'

const router = Router()

const schema = z
  .object({
    name: z.string().trim().min(2, 'اكتب اسمك').max(80),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    email: z.string().trim().email('الإيميل مو صحيح').optional().or(z.literal('')),
    body: z.string().trim().min(5, 'الرسالة كلش قصيرة').max(3000),
  })
  .refine((d) => d.phone || d.email, { message: 'انطينا رقم تلفون أو إيميل حتى نرجعلك', path: ['phone'] })

router.post(
  '/',
  rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, message: { error: 'دزيت هواية رسائل، ارجع بعدين' } }),
  async (req, res) => {
    const d = schema.parse(req.body)
    await query('INSERT INTO messages (name, phone, email, body) VALUES ($1, $2, $3, $4)', [
      d.name, d.phone || null, d.email || null, d.body,
    ])
    res.status(201).json({ ok: true, message: 'وصلتنا رسالتك، راح نرجعلك بأقرب وقت' })
  },
)

export default router
