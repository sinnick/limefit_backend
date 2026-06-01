const mongoose = require('mongoose');

// Ejercicio (biblioteca) — Feature 2.1 del CONTRACT-fase2.md §2.1.
//
// Catálogo de ejercicios por gym, sembrado desde rutinas/*.json (seed inglés)
// vía scripts/seed-ejercicios.mjs. Esquema en MAYÚSCULAS (la app adapta a
// camelCase via EjercicioBiblioteca). Es lectura pública del gym: NO es
// offline-first, no usa CLIENT_ID.
//
// Idempotencia del seed: índice único (GYM_ID, NOMBRE) → re-ejecutar el seed
// hace upsert, nunca duplica.
const schema = mongoose.Schema({
  "NOMBRE": { type: String, required: true },
  "GRUPO_MUSCULAR": { type: String, required: true, index: true },
  "TIPO": String,
  "EQUIPO": String,
  "DIFICULTAD": String, // "beginner" | "intermediate" | "advanced"
  "INSTRUCCIONES": String,
  "URL_IMAGEN": String,
  "ACTIVO": { type: Boolean, default: true },
  "GYM_ID": { type: String, index: true },
  "FECHA_CREACION": { type: Date, default: Date.now },
});

schema.index({ GYM_ID: 1, NOMBRE: 1 }, { unique: true }); // idempotencia del seed

export default mongoose.models.Ejercicio || mongoose.model('Ejercicio', schema);
