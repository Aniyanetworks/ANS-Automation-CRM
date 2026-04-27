import { readFileSync } from 'fs'

const PROJECT_REF = 'lwzrxstmofibqkxudugc'
const ACCESS_TOKEN = process.argv[2]

if (!ACCESS_TOKEN) {
  console.error('\nUsage: node run-migration.mjs <your-access-token>')
  console.error('\nGet your token from: https://supabase.com/dashboard/account/tokens\n')
  process.exit(1)
}

const sql = readFileSync('./supabase/migrations/20260427000001_init.sql', 'utf8')

const statements = sql
  .split(';')
  .map(s => s.replace(/--[^\n]*/g, '').trim())
  .filter(s => s.length > 0)

console.log(`\nRunning ${statements.length} statements against project: ${PROJECT_REF}\n`)

let success = 0
let failed = 0

for (const stmt of statements) {
  const shortStmt = stmt.replace(/\n/g, ' ').slice(0, 60)
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: stmt }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error(`  FAIL: ${shortStmt}...`)
      console.error(`        ${data.message || JSON.stringify(data)}`)
      failed++
    } else {
      console.log(`  OK:   ${shortStmt}...`)
      success++
    }
  } catch (err) {
    console.error(`  ERROR: ${shortStmt}...`)
    console.error(`         ${err.message}`)
    failed++
  }
}

console.log(`\n${success} succeeded, ${failed} failed.\n`)
if (failed === 0) console.log('Migration complete! Your database is ready.')
