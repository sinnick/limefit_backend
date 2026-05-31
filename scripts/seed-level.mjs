// Seed para el tenant "level" (demo).
//   1. Asigna los documentos existentes sin GYM_ID a GYM_ID='level'.
//   2. Crea usuarios mock (1 admin de prueba + varios miembros), idempotente.
//
// Uso: node scripts/seed-level.mjs   (lee MONGODB_URI de .env.local / entorno)

import { config } from 'dotenv'
config({ path: '.env.local' }) // Next usa .env.local; dotenv no lo lee por defecto
config() // fallback a .env
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const uri = process.env.MONGODB_URI
const GYM_ID = 'level'
const PASSWORD = 'level1234' // password en claro para los mocks (demo)

if (!uri) {
  console.error('Falta MONGODB_URI')
  process.exit(1)
}

const MOCKS = [
  { DNI: 40000001, USUARIO: 'leveladmin', NOMBRE: 'Admin',  APELLIDO: 'Level',   SEXO: 'M', ADMIN: true },
  { DNI: 40000002, USUARIO: 'anaperez',   NOMBRE: 'Ana',    APELLIDO: 'Pérez',   SEXO: 'F', ADMIN: false },
  { DNI: 40000003, USUARIO: 'lucasgomez', NOMBRE: 'Lucas',  APELLIDO: 'Gómez',   SEXO: 'M', ADMIN: false },
  { DNI: 40000004, USUARIO: 'sofiamartin',NOMBRE: 'Sofía',  APELLIDO: 'Martín',  SEXO: 'F', ADMIN: false },
  { DNI: 40000005, USUARIO: 'diegolopez', NOMBRE: 'Diego',  APELLIDO: 'López',   SEXO: 'M', ADMIN: false },
]

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  const db = mongoose.connection.db
  console.log(`DB: ${db.databaseName}`)

  // 1. Asignar datos existentes a level
  for (const c of ['usuarios', 'rutinas', 'records', 'usuariorutinas']) {
    const res = await db.collection(c).updateMany(
      { GYM_ID: { $exists: false } },
      { $set: { GYM_ID } }
    )
    if (res.modifiedCount) console.log(`  ${c}: ${res.modifiedCount} asignados a '${GYM_ID}'`)
  }

  // 2. Sembrar usuarios mock (idempotente por USUARIO + GYM_ID)
  const usuarios = db.collection('usuarios')
  const hash = await bcrypt.hash(PASSWORD, 10)
  for (const m of MOCKS) {
    const exists = await usuarios.findOne({ USUARIO: m.USUARIO, GYM_ID })
    if (exists) { console.log(`  = ${m.USUARIO} ya existe, skip`); continue }
    await usuarios.insertOne({
      DNI: m.DNI,
      USUARIO: m.USUARIO,
      PASSWORD: hash,
      NOMBRE: m.NOMBRE,
      APELLIDO: m.APELLIDO,
      EMAIL: `${m.USUARIO}@level.demo`,
      HABILITADO: true,
      ADMIN: m.ADMIN,
      FECHA_CREACION: new Date(),
      FOTO: '',
      SEXO: m.SEXO,
      GYM_ID,
    })
    console.log(`  + ${m.USUARIO} (${m.ADMIN ? 'admin' : 'miembro'}) creado`)
  }

  const total = await usuarios.countDocuments({ GYM_ID })
  console.log(`Total usuarios en '${GYM_ID}': ${total}`)
  await mongoose.disconnect()
  console.log('Listo.')
}

main().catch((e) => { console.error(e); process.exit(1) })
