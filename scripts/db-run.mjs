// Ejecuta un archivo .sql contra la base de datos de Supabase.
// Uso: node scripts/db-run.mjs <archivo.sql>
// Las credenciales se leen de .env.local (variables SIN prefijo VITE_).
import { readFileSync } from 'node:fs'
import pg from 'pg'

process.loadEnvFile('.env.local')

const file = process.argv[2]
if (!file) {
  console.error('Uso: node scripts/db-run.mjs <archivo.sql>')
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

const sql = readFileSync(file, 'utf8')

try {
  await client.connect()
  await client.query(sql)
  console.log(`✔ ${file} ejecutado correctamente`)
} catch (err) {
  console.error(`✘ Error ejecutando ${file}:`)
  console.error(err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
