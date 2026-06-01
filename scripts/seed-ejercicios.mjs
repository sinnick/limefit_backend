// Seed de la biblioteca de ejercicios — Feature 2.1 (CONTRACT-fase2.md §3).
//
// Importa rutinas/*.json (seed inglés) a la colección `ejercicios`, idempotente
// por (GYM_ID, NOMBRE). Re-ejecutable sin duplicar.
//
// SEGURIDAD DE DATOS: por defecto SOLO corre contra una DB cuyo nombre contiene
// `limefit_test`. Para apuntar a otra DB hay que pasar --force explícitamente.
//
// Uso:
//   MONGODB_URI="mongodb://127.0.0.1:27017/limefit_test" TENANT=level node scripts/seed-ejercicios.mjs
//   # o por argumentos posicionales (db, tenant):
//   node scripts/seed-ejercicios.mjs limefit_test level
//   # forzar otra DB (bajo tu responsabilidad):
//   MONGODB_URI="mongodb://127.0.0.1:27017/otra" node scripts/seed-ejercicios.mjs --force

import { config } from 'dotenv'
config({ path: '.env.local' }) // Next usa .env.local; dotenv no lo lee por defecto
config() // fallback a .env
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RUTINAS_DIR = path.resolve(__dirname, '..', 'rutinas')

// --- Parseo de argumentos ----------------------------------------------------
const argv = process.argv.slice(2)
const force = argv.includes('--force')
const positional = argv.filter((a) => !a.startsWith('--'))

// db: 1er posicional → arma URI local; si no, MONGODB_URI del entorno.
const dbArg = positional[0]
const tenantArg = positional[1]

const uri = dbArg
  ? `mongodb://127.0.0.1:27017/${dbArg}`
  : process.env.MONGODB_URI

const GYM_ID = tenantArg || process.env.TENANT || 'level'

if (!uri) {
  console.error('Falta MONGODB_URI (o pasá el nombre de la DB como 1er argumento).')
  process.exit(1)
}

// --- Guardarraíl: no tocar la DB real ---------------------------------------
if (!uri.includes('limefit_test') && !force) {
  console.error(
    `ABORTADO: la URI ("${uri}") no apunta a 'limefit_test'.\n` +
    `Para correr contra otra DB pasá --force explícitamente.`
  )
  process.exit(1)
}

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  const db = mongoose.connection.db
  console.log(`DB: ${db.databaseName} — sembrando ejercicios en GYM_ID='${GYM_ID}'`)

  const ejercicios = db.collection('ejercicios')

  // Índice único de idempotencia (alineado con models/Ejercicio.js).
  await ejercicios.createIndex({ GYM_ID: 1, NOMBRE: 1 }, { unique: true })

  const files = fs.readdirSync(RUTINAS_DIR).filter((f) => f.endsWith('.json'))

  let totalInsertados = 0
  let totalActualizados = 0

  for (const file of files) {
    const full = path.join(RUTINAS_DIR, file)
    const raw = fs.readFileSync(full, 'utf8').trim()
    if (!raw) {
      console.log(`  ${file}: vacío, skip`)
      continue
    }

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      console.log(`  ${file}: JSON inválido (${e.message}), skip`)
      continue
    }

    const lista = Array.isArray(parsed) ? parsed : parsed.EJERCICIOS
    if (!Array.isArray(lista) || lista.length === 0) {
      console.log(`  ${file}: sin EJERCICIOS, skip`)
      continue
    }

    let ins = 0
    let upd = 0
    for (const e of lista) {
      if (!e || !e.name) continue
      const res = await ejercicios.updateOne(
        { GYM_ID, NOMBRE: e.name },
        {
          $set: {
            GRUPO_MUSCULAR: e.muscle,
            TIPO: e.type,
            EQUIPO: e.equipment,
            DIFICULTAD: e.difficulty,
            INSTRUCCIONES: e.instructions,
            URL_IMAGEN: "",
            ACTIVO: true,
            GYM_ID,
          },
          $setOnInsert: { NOMBRE: e.name, FECHA_CREACION: new Date() },
        },
        { upsert: true }
      )
      if (res.upsertedCount) ins += 1
      else if (res.modifiedCount) upd += 1
    }

    totalInsertados += ins
    totalActualizados += upd
    console.log(`  ${file}: ${ins} insertados, ${upd} actualizados (${lista.length} en archivo)`)
  }

  const total = await ejercicios.countDocuments({ GYM_ID })
  console.log(
    `Total: ${totalInsertados} insertados, ${totalActualizados} actualizados. ` +
    `Colección 'ejercicios' en GYM_ID='${GYM_ID}': ${total} documentos.`
  )

  await mongoose.disconnect()
  console.log('Listo.')
}

main().catch((e) => { console.error(e); process.exit(1) })
