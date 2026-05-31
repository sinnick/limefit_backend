const mongoose = require('mongoose');

// WorkoutCompletado: persiste el historial de entrenamientos completados que hoy
// vive sólo en MMKV en la app (`historialWorkouts`). Es el modelo que respalda
// el endpoint `POST /api/workouts/batch` (CONTRACT-fase0.md §b.4).
//
// Idempotencia: cada workout trae un `CLIENT_ID` (la app reusa el
// `WorkoutCompletado.id` que ya genera con `generarId()`). El endpoint batch hace
// upsert por (GYM_ID, DNI, CLIENT_ID); reenviar = no-op. Lo garantiza el índice
// único compuesto de abajo.

// ── Set completado dentro de un ejercicio ───────────────────────────────────
const setCompletadoSchema = mongoose.Schema({
  setNumero: { type: Number },
  peso: { type: Number, default: null },
  reps: { type: Number },
  completado: { type: Boolean, default: false },
  timestamp: { type: Date },
  esRecord: { type: Boolean, default: false },
  rpe: { type: Number },     // 2.3 — esfuerzo percibido (1-10)
  notas: { type: String },   // 2.3 — nota del set
}, { _id: false });

// ── Ejercicio dentro del workout (con sus sets completados) ─────────────────
const ejercicioWorkoutSchema = mongoose.Schema({
  ejercicioId: { type: String },
  nombre: { type: String, default: "" },
  setsObjetivo: { type: Number },
  repsObjetivo: { type: Number },
  pesoObjetivo: { type: Number, default: null },
  completado: { type: Boolean, default: false },
  setsCompletados: { type: [setCompletadoSchema], default: [] },
}, { _id: false });

// ── Documento raíz: WorkoutCompletado ───────────────────────────────────────
const schema = mongoose.Schema({
  "DNI": Number,
  "CLIENT_ID": String,        // clave de idempotencia (id de la app)
  "RUTINA_ID": String,
  "RUTINA_NOMBRE": String,
  "DIA_ID": String,
  "DIA_NOMBRE": String,
  "FECHA": Date,
  "DURACION": Number,         // minutos
  "VOLUMEN_TOTAL": Number,
  "PRS_LOGRADOS": Number,
  "NOTAS": { type: String, default: "" },
  "EJERCICIOS": { type: [ejercicioWorkoutSchema], default: [] },
  "GYM_ID": { type: String, index: true },
});

// Índice único de idempotencia: reenviar el mismo CLIENT_ID = no-op (upsert).
schema.index(
  { GYM_ID: 1, DNI: 1, CLIENT_ID: 1 },
  { unique: true, partialFilterExpression: { CLIENT_ID: { $type: "string" } } }
);

export default mongoose.models.WorkoutCompletado || mongoose.model('WorkoutCompletado', schema);
