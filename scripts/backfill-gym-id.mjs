// Migración única: asigna GYM_ID a los documentos existentes que no lo tienen.
//
// Contexto: al activar el aislamiento multi-tenant, todas las queries se scopean
// por GYM_ID. Los datos creados antes de este cambio no tienen el campo y, sin
// back-fill, dejarían de aparecer. Este script los asigna al tenant indicado.
//
// Uso:
//   node scripts/backfill-gym-id.mjs            # asigna GYM_ID='limefit' (default)
//   GYM_ID=level node scripts/backfill-gym-id.mjs
//
// Requiere MONGODB_URI en el entorno (o en .env / .env.local).

import 'dotenv/config'
import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI
const GYM_ID = process.env.GYM_ID || 'limefit'

if (!uri) {
  console.error('Falta MONGODB_URI en el entorno.')
  process.exit(1)
}

const COLLECTIONS = ['usuarios', 'rutinas', 'records', 'usuariorutinas']

async function main() {
  await mongoose.connect(uri)
  const db = mongoose.connection.db
  console.log(`DB: ${db.databaseName} — asignando GYM_ID='${GYM_ID}' a docs sin GYM_ID`)

  for (const name of COLLECTIONS) {
    const col = db.collection(name)
    const res = await col.updateMany(
      { GYM_ID: { $exists: false } },
      { $set: { GYM_ID } }
    )
    console.log(`  ${name}: ${res.modifiedCount} actualizados`)
  }

  await mongoose.disconnect()
  console.log('Listo.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
