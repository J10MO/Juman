import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const itemSchema = z.object({
  uid: z.string().max(40),
  productId: z.number().int(),
  x: z.number().finite(),
  z: z.number().finite(),
  rot: z.number().finite(),
  color: z.string().max(20),
  parent: z.string().max(40).nullable().optional(),
})

const roomSchema = z.object({
  id: z.string().max(40),
  name: z.string().trim().max(40),
  type: z.string().max(20),
  x: z.number().min(-40).max(40),
  z: z.number().min(-40).max(40),
  width: z.number().min(1.2).max(20),
  depth: z.number().min(1.2).max(20),
  wallColor: z.string().max(20),
  floor: z.string().max(20),
})

const designSchema = z.object({
  name: z.string().trim().min(1, 'انطي اسم للتصميم').max(80),
  // legacy single-room designs still send `room`
  room: z
    .object({ width: z.number(), depth: z.number(), wallColor: z.string().max(20), floor: z.string().max(20) })
    .optional(),
  plan: z.object({ template: z.string().max(30), rooms: z.array(roomSchema).min(1).max(12) }),
  items: z.array(itemSchema).max(400),
  thumbnail: z
    .string()
    .max(1_500_000)
    .refine((s) => s.startsWith('data:image/'), 'صورة غير صالحة')
    .nullable()
    .optional(),
})

/** Bounding box of the plan, kept in the old `room` column for listings. */
const legacyRoom = (plan) => {
  const xs = plan.rooms.flatMap((r) => [r.x - r.width / 2, r.x + r.width / 2])
  const zs = plan.rooms.flatMap((r) => [r.z - r.depth / 2, r.z + r.depth / 2])
  const first = plan.rooms[0]
  return {
    width: Math.round((Math.max(...xs) - Math.min(...xs)) * 100) / 100,
    depth: Math.round((Math.max(...zs) - Math.min(...zs)) * 100) / 100,
    wallColor: first.wallColor,
    floor: first.floor,
  }
}

const parseId = (req) => {
  const id = Number(req.params.id)
  return Number.isInteger(id) && id > 0 ? id : null
}

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, thumbnail, room, plan, jsonb_array_length(items) AS "itemCount",
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM designs WHERE user_id = $1 ORDER BY updated_at DESC`,
    [req.userId],
  )
  res.json({ designs: rows })
})

router.get('/:id', async (req, res) => {
  const id = parseId(req)
  if (!id) return res.status(400).json({ error: 'رقم التصميم غلط' })
  const { rows } = await query(
    `SELECT id, name, room, plan, items, thumbnail, updated_at AS "updatedAt"
     FROM designs WHERE id = $1 AND user_id = $2`,
    [id, req.userId],
  )
  if (!rows[0]) return res.status(404).json({ error: 'التصميم مو موجود' })
  res.json({ design: rows[0] })
})

router.post('/', async (req, res) => {
  const d = designSchema.parse(req.body)
  const { rows } = await query(
    `INSERT INTO designs (user_id, name, room, plan, items, thumbnail) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, updated_at AS "updatedAt"`,
    [req.userId, d.name, JSON.stringify(legacyRoom(d.plan)), JSON.stringify(d.plan), JSON.stringify(d.items), d.thumbnail ?? null],
  )
  res.status(201).json({ design: rows[0] })
})

router.put('/:id', async (req, res) => {
  const id = parseId(req)
  if (!id) return res.status(400).json({ error: 'رقم التصميم غلط' })
  const d = designSchema.parse(req.body)
  const { rows } = await query(
    `UPDATE designs SET name = $1, room = $2, plan = $3, items = $4, thumbnail = COALESCE($5, thumbnail), updated_at = now()
     WHERE id = $6 AND user_id = $7
     RETURNING id, name, updated_at AS "updatedAt"`,
    [d.name, JSON.stringify(legacyRoom(d.plan)), JSON.stringify(d.plan), JSON.stringify(d.items), d.thumbnail ?? null, id, req.userId],
  )
  if (!rows[0]) return res.status(404).json({ error: 'التصميم مو موجود' })
  res.json({ design: rows[0] })
})

router.delete('/:id', async (req, res) => {
  const id = parseId(req)
  if (!id) return res.status(400).json({ error: 'رقم التصميم غلط' })
  const { rowCount } = await query('DELETE FROM designs WHERE id = $1 AND user_id = $2', [id, req.userId])
  if (!rowCount) return res.status(404).json({ error: 'التصميم مو موجود' })
  res.status(204).end()
})

export default router
