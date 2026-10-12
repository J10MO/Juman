import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export const signToken = (user) =>
  jwt.sign({ sub: user.id, name: user.name }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'لازم تسجل دخول أول' })
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'الجلسة خلصت، سجل دخول مرة ثانية' })
  }
}
