import { Router } from 'express'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { config } from '../config.js'
import { pool, query } from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

export const GOVERNORATES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'كربلاء', 'بابل', 'الأنبار', 'ديالى', 'ذي قار',
  'السليمانية', 'دهوك', 'كركوك', 'صلاح الدين', 'واسط', 'ميسان', 'المثنى', 'القادسية', 'حلبجة',
]
const DELIVERY_FEE = 15000 // free inside Baghdad

const orderSchema = z.object({
  name: z.string().trim().min(2, 'اكتب اسمك الكامل').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?964|0)?7\d{9}$/, 'رقم الموبايل لازم يكون عراقي، مثل 07701234567'),
  governorate: z.enum(GOVERNORATES, { errorMap: () => ({ message: 'اختار المحافظة' }) }),
  address: z.string().trim().min(5, 'اكتب العنوان بالتفصيل (المنطقة، المحلة، أقرب نقطة دالة)').max(300),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  designId: z.number().int().positive().nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().int().min(1).max(50),
        color: z.string().max(20),
      }),
    )
    .min(1, 'السلة فارغة')
    .max(100),
})

const userFromToken = (req) => {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) return null
  try {
    return jwt.verify(h.slice(7), config.jwtSecret).sub
  } catch {
    return null
  }
}

router.get('/governorates', (_req, res) => res.json({ governorates: GOVERNORATES, deliveryFee: DELIVERY_FEE }))

router.post(
  '/',
  rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, message: { error: 'طلبات هواية، ارجع بعد شوية' } }),
  async (req, res) => {
    const o = orderSchema.parse(req.body)
    const ids = [...new Set(o.items.map((i) => i.productId))]
    const { rows: products } = await query('SELECT id, name, price, colors FROM products WHERE id = ANY($1)', [ids])
    const byId = Object.fromEntries(products.map((p) => [p.id, p]))
    const missing = ids.filter((id) => !byId[id])
    if (missing.length) return res.status(400).json({ error: 'بعض المنتجات بالسلة ما موجودة بعد. حدّث الصفحة' })

    const lines = o.items.map((i) => ({
      productId: i.productId,
      name: byId[i.productId].name,
      color: byId[i.productId].colors.includes(i.color) ? i.color : byId[i.productId].colors[0],
      qty: i.qty,
      price: byId[i.productId].price,
    }))
    const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0)
    const delivery = o.governorate === 'بغداد' ? 0 : DELIVERY_FEE
    const userId = userFromToken(req)

    // Only attach a design that belongs to the person ordering.
    let designId = null
    if (o.designId && userId) {
      const own = await pool.query('SELECT 1 FROM designs WHERE id = $1 AND user_id = $2', [o.designId, userId])
      if (own.rowCount) designId = o.designId
    }

    const { rows } = await query(
      `INSERT INTO orders (user_id, design_id, name, phone, governorate, address, notes, items, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, total, status, created_at AS "createdAt"`,
      [userId, designId, o.name, o.phone, o.governorate, o.address, o.notes || null, JSON.stringify(lines), subtotal + delivery],
    )
    res.status(201).json({
      order: { ...rows[0], subtotal, delivery, items: lines },
      message: 'وصل طلبك! راح نتصل بيك خلال ٢٤ ساعة حتى نأكد الموعد',
    })
  },
)

router.get('/', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT id, governorate, items, total, status, created_at AS "createdAt"
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.userId],
  )
  res.json({ orders: rows })
})

export default router
