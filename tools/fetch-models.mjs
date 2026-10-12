// Downloads the real furniture scans listed in server/src/db/realProducts.js from
// Poly Haven (CC0), optimises them into compact GLB files for the web and
// measures their real dimensions.
//
//   npm run fetch-models            # only missing models
//   npm run fetch-models -- --force # re-download everything
import { mkdir, writeFile, readFile, rm, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { center, dedup, getBounds, prune, textureCompress, weld } from '@gltf-transform/functions'
import sharp from 'sharp'
import { realProducts } from '../server/src/db/realProducts.js'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'client', 'public', 'models')
const TMP = path.join(ROOT, 'tools', '.cache')
const META = path.join(ROOT, 'server', 'src', 'db', 'realProducts.generated.json')
const force = process.argv.includes('--force')

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

const exists = (p) => access(p).then(() => true, () => false)

async function download(url, dest) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status} ${url}`)
      await mkdir(path.dirname(dest), { recursive: true })
      await writeFile(dest, Buffer.from(await res.arrayBuffer()))
      return
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
}

async function processOne(p, meta) {
  const glbPath = path.join(OUT, `${p.slug}.glb`)
  const imgPath = path.join(OUT, `${p.slug}.webp`)
  if (!force && meta[p.slug] && (await exists(glbPath)) && (await exists(imgPath))) return 'cached'

  const [info, files] = await Promise.all([
    fetch(`https://api.polyhaven.com/info/${p.ph}`).then((r) => r.json()),
    fetch(`https://api.polyhaven.com/files/${p.ph}`).then((r) => r.json()),
  ])
  const gltf = files.gltf?.['1k']?.gltf
  if (!gltf) throw new Error('no 1k glTF available')

  const dir = path.join(TMP, p.ph)
  await rm(dir, { recursive: true, force: true })
  const main = path.join(dir, path.basename(new URL(gltf.url).pathname))
  await download(gltf.url, main)
  await Promise.all(Object.entries(gltf.include || {}).map(([rel, f]) => download(f.url, path.join(dir, rel))))

  const doc = await io.read(main)
  await doc.transform(
    dedup(),
    prune(),
    weld(),
    // bottom-centre at the origin, like the procedural models
    center({ pivot: 'below' }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }),
  )
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0]
  const { min, max } = getBounds(scene)
  await mkdir(OUT, { recursive: true })
  await io.write(glbPath, doc)

  const thumb = await fetch(`https://cdn.polyhaven.com/asset_img/thumbs/${p.ph}.png?width=640&height=640`)
  await sharp(Buffer.from(await thumb.arrayBuffer())).webp({ quality: 82 }).toFile(imgPath)

  const r = (v) => Math.round(v * 1000) / 1000
  meta[p.slug] = {
    dims: { w: r(max[0] - min[0]), d: r(max[2] - min[2]), h: r(max[1] - min[1]) },
    credit: Object.keys(info.authors || {}).join('، '),
    source: `https://polyhaven.com/a/${p.ph}`,
    license: 'CC0',
  }
  await rm(dir, { recursive: true, force: true })
  return 'ok'
}

const meta = (await exists(META)) ? JSON.parse(await readFile(META, 'utf8')) : {}
let failed = 0
for (const p of realProducts) {
  try {
    const status = await processOne(p, meta)
    const d = meta[p.slug].dims
    console.log(`${status === 'ok' ? '✅' : '⏭️ '} ${p.slug.padEnd(28)} ${d.w}×${d.d}×${d.h} m`)
    await writeFile(META, JSON.stringify(meta, null, 2))
  } catch (err) {
    failed++
    console.error(`❌ ${p.slug}: ${err.message}`)
  }
}
console.log(failed ? `\n${failed} model(s) failed — run again to retry.` : '\n🎉 All models ready.')
