// Ejecuta una consulta SQL y muestra las filas resultantes.
// Uso: node scripts/db-query.mjs "SELECT ..."
import pg from 'pg'

process.loadEnvFile('.env.local')

const sql = process.argv[2]
if (!sql) {
  console.error('Uso: node scripts/db-query.mjs "SELECT ..."')
  process.exit(1)
}

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
  database: process.env.SUPABASE_DB_NAME ?? 'postgres',
  user: process.env.SUPABASE_DB_USER ?? 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  const result = await client.query(sql)
  console.table(result.rows)
} catch (err) {
  console.error('✘ Error:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
