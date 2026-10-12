const required = (name) => {
  const value = process.env[name]
  if (!value) {
    console.error(`❌ المتغير ${name} مو موجود بملف .env — شوف .env.example`)
    process.exit(1)
  }
  return value
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
  isProd: process.env.NODE_ENV === 'production',
}
