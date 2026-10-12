import pg from 'pg'
import { config } from '../config.js'

// Return BIGINT/NUMERIC counts as JS numbers instead of strings.
pg.types.setTypeParser(20, (v) => Number(v))

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
})

pool.on('error', (err) => console.error('PostgreSQL pool error:', err.message))

export const query = (text, params) => pool.query(text, params)
