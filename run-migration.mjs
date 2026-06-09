import { readFileSync } from 'fs'

const PROJECT_REF = 'lwzrxstmofibqkxudugc'
const ACCESS_TOKEN = process.argv[2]
const MIGRATION_FILE = process.argv[3] || './supabase/migrations/20260427000001_init.sql'

if (!ACCESS_TOKEN) {
  console.error('\nUsage: node run-migration.mjs <your-access-token> [migration-file]')
  console.error('\nGet your token from: https://supabase.com/dashboard/account/tokens')
  console.error('\nExample (email automation tables):')
  console.error('  node run-migration.mjs <token> ./supabase/migrations/20260609000001_email_automation.sql\n')
  process.exit(1)
}

const sql = readFileSync(MIGRATION_FILE, 'utf8')

// The whole file is sent as a single query. The Supabase management API runs
// multi-statement scripts in one call, so we don't split on ';' — splitting
// breaks on semicolons that appear inside SQL comments or string literals.
console.log(`\nRunning migration against project: ${PROJECT_REF}`)
console.log(`File: ${MIGRATION_FILE}\n`)

try {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const text = await res.text()

  if (!res.ok) {
    let message = text
    try { message = JSON.parse(text).message || text } catch {}
    console.error(`FAILED (HTTP ${res.status}):\n  ${message}\n`)
    process.exit(1)
  }

  console.log('Migration complete! Your database is ready.\n')
} catch (err) {
  console.error(`ERROR: ${err.message}\n`)
  process.exit(1)
}
