import { Router } from 'express'
import { query } from '../db/pool.js'

const router = Router()

const PRODUCT_FIELDS = `
  p.id, p.slug, p.name, p.description, p.price, p.model_key AS "modelKey", p.colors, p.dims,
  p.kind, p.surface_height AS "surfaceHeight", p.featured,
  p.model_url AS "modelUrl", p.image_url AS "imageUrl", p.material, p.credit, p.source_url AS "sourceUrl", p.active,
  c.slug AS "categorySlug", c.name AS "categoryName"`

router.get('/categories', async (_req, res) => {
  const { rows } = await query(`
    SELECT c.id, c.slug, c.name, c.blurb, COUNT(p.id) AS "productCount"
    FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.active
    GROUP BY c.id ORDER BY c.sort`)
  res.json({ categories: rows })
})

router.get('/products', async (req, res) => {
  const where = []
  const params = []
  if (req.query.category) {
    params.push(String(req.query.category))
    where.push(`c.slug = $${params.length}`)
  }
  if (req.query.q) {
    params.push(`%${String(req.query.q).trim()}%`)
    where.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`)
  }
  if (req.query.featured === '1') where.push('p.featured')
  // retired pieces stay available to old designs (?all=1) but are hidden from the shop
  if (req.query.all !== '1') where.push('p.active')
  if (req.query.source === 'scan') where.push('p.model_url IS NOT NULL')
  if (req.query.source === 'built') where.push('p.model_url IS NULL')

  const { rows } = await query(
    `SELECT ${PRODUCT_FIELDS}
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY c.sort, p.featured DESC, p.sort, p.id`,
    params,
  )
  res.json({ products: rows })
})

router.get('/products/:slug', async (req, res) => {
  const { rows } = await query(
    `SELECT ${PRODUCT_FIELDS}
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = $1`,
    [req.params.slug],
  )
  if (!rows[0]) return res.status(404).json({ error: 'هذا المنتج ماكو' })

  const related = await query(
    `SELECT ${PRODUCT_FIELDS}
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE c.slug = $1 AND p.slug <> $2 AND p.active ORDER BY p.featured DESC, p.sort LIMIT 4`,
    [rows[0].categorySlug, rows[0].slug],
  )
  res.json({ product: rows[0], related: related.rows })
})

export default router
