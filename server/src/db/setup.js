// Creates the database (if missing), applies the schema and upserts seed data.
// Safe to run any number of times: `npm run db:setup`
import { readFile } from 'node:fs/promises'
import pg from 'pg'
import { categories, products as builtProducts } from './seedData.js'
import { realProducts } from './realProducts.js'

// Scanned products are only seeded once their model has been downloaded (tools/fetch-models).
let scanned = {}
try {
  scanned = JSON.parse(await readFile(new URL('./realProducts.generated.json', import.meta.url), 'utf8'))
} catch {
  console.warn('⚠️  ماكو realProducts.generated.json — شغّل npm run fetch-models حتى تنضاف المنتجات الحقيقية')
}
const products = [
  ...builtProducts,
  ...realProducts
    .filter((p) => scanned[p.slug])
    .map((p, i) => {
      const m = scanned[p.slug]
      return {
        ...p,
        model_key: 'scan',
        colors: ['natural'],
        dims: m.dims,
        kind: p.kind || 'floor',
        surface_height: p.host ? m.dims.h : null,
        model_url: `/models/${p.slug}.glb`,
        image_url: `/models/${p.slug}.webp`,
        credit: m.credit,
        source_url: m.source,
        sort: 100 + i,
        active: !p.retired,
      }
    }),
]

const url = new URL(process.env.DATABASE_URL)
const dbName = decodeURIComponent(url.pathname.slice(1))

async function ensureDatabase() {
  // Hosted databases (Neon, Render…) come with the database already created and
  // often forbid CREATE DATABASE, so only create it when we can't connect to it.
  const probe = new pg.Client({ connectionString: url.toString() })
  try {
    await probe.connect()
    await probe.end()
    console.log(`ℹ️  قاعدة البيانات ${dbName} موجودة`)
    return
  } catch (err) {
    await probe.end().catch(() => {})
    if (err.code !== '3D000') throw err // anything but "database does not exist"
  }
  const adminUrl = new URL(url)
  adminUrl.pathname = '/postgres'
  const admin = new pg.Client({ connectionString: adminUrl.toString() })
  await admin.connect()
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
    if (!rowCount) {
      await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`)
      console.log(`✅ انخلقت قاعدة البيانات ${dbName}`)
    }
  } finally {
    await admin.end()
  }
}

async function migrateAndSeed() {
  const client = new pg.Client({ connectionString: url.toString() })
  await client.connect()
  try {
    const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
    await client.query(schema)
    console.log('✅ الجداول جاهزة')

    await client.query('BEGIN')
    const categoryIds = {}
    for (const c of categories) {
      const { rows } = await client.query(
        `INSERT INTO categories (slug, name, blurb, sort) VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, blurb = EXCLUDED.blurb, sort = EXCLUDED.sort
         RETURNING id`,
        [c.slug, c.name, c.blurb, c.sort],
      )
      categoryIds[c.slug] = rows[0].id
    }

    for (const p of products) {
      await client.query(
        `INSERT INTO products (slug, name, description, category_id, price, model_key, colors, dims, kind, surface_height,
                               featured, sort, model_url, image_url, material, credit, source_url, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name, description = EXCLUDED.description, category_id = EXCLUDED.category_id,
           price = EXCLUDED.price, model_key = EXCLUDED.model_key, colors = EXCLUDED.colors, dims = EXCLUDED.dims,
           kind = EXCLUDED.kind, surface_height = EXCLUDED.surface_height, featured = EXCLUDED.featured, sort = EXCLUDED.sort,
           model_url = EXCLUDED.model_url, image_url = EXCLUDED.image_url, material = EXCLUDED.material,
           credit = EXCLUDED.credit, source_url = EXCLUDED.source_url, active = EXCLUDED.active`,
        [
          p.slug, p.name, p.description, categoryIds[p.category], p.price, p.model_key,
          JSON.stringify(p.colors), JSON.stringify(p.dims), p.kind, p.surface_height ?? null,
          Boolean(p.featured), p.sort ?? 0, p.model_url ?? null, p.image_url ?? null, p.material ?? null,
          p.credit ?? null, p.source_url ?? null, p.active !== false,
        ],
      )
    }
    await client.query('COMMIT')
    console.log(`✅ انضافت ${categories.length} أقسام و ${products.length} منتج`)
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    await client.end()
  }
}

try {
  await ensureDatabase()
  await migrateAndSeed()
  console.log('🎉 كلشي تمام، شغّل السيرفر هسه')
} catch (err) {
  console.error('❌ صار خطأ بتجهيز قاعدة البيانات:', err.message)
  if (err.code === '28P01') console.error('   الباسورد مال PostgreSQL غلط. صلّحه بملف server/.env')
  if (err.code === 'ECONNREFUSED') console.error('   PostgreSQL مو شغّال. شغّله وارجع جرّب')
  process.exit(1)
}
