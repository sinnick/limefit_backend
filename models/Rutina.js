const mongoose = require('mongoose');

// ── Subdocumento: ejercicio dentro de un día ────────────────────────────────
// Convención de naming (CONTRACT-fase0.md §"Convención de naming"):
// los subdocumentos anidados usan camelCase (ya era así para nombre/series/etc).
const ejercicioRutinaSchema = mongoose.Schema({
  // NUEVO: identificador estable del ejercicio dentro de la rutina.
  // Lo genera el backend al crear/guardar (`<RUTINA._id>-<diaIndex>-<ejIndex>`).
  // Reemplaza el id temporal `${id}-ej-${i}` que fabricaba el adaptador de la app.
  ejercicioId: { type: String, required: true },
  nombre: { type: String, default: "", required: true },
  series: { type: Number, default: 3 },        // App: sets
  repeticiones: { type: Number, default: 10 }, // App: reps
  descanso: { type: Number, default: 60 },     // segundos entre series
  // CAMBIO DE TIPO: antes era String ("20kg", "bodyweight"). Ahora Number (kg).
  // Peso corporal => peso: null (o 0) + unidadPeso.
  peso: { type: Number, default: null },
  // NUEVO: para no perder semántica al pasar `peso` a Number. "kg" | "lb".
  unidadPeso: { type: String, default: "kg" },
  notas: { type: String, default: "" },
  // NUEVO: orden del ejercicio dentro del día (la app reordena).
  orden: { type: Number, default: 0 },
}, { _id: false }); // identidad estable la da `ejercicioId`, no `_id`

// ── Subdocumento: día con sus ejercicios ────────────────────────────────────
const diaRutinaSchema = mongoose.Schema({
  // NUEVO: identificador estable del día (`<RUTINA._id>-dia-<index>` o UUID).
  // Reemplaza el `${id}-dia-0` temporal del adaptador de la app.
  diaId: { type: String, required: true },
  nombre: { type: String, default: "Día 1" }, // "Día 1", "Push", "Pierna"...
  orden: { type: Number, default: 0 },         // NUEVO: orden del día en la rutina
  ejercicios: { type: [ejercicioRutinaSchema], default: [] },
}, { _id: false });

// ── Documento raíz: Rutina (días-con-ejercicios) ────────────────────────────
const schema = mongoose.Schema({
  // ID secuencial scoped a tenant que usan los endpoints admin (rutinas.js,
  // admin/routines.js). Se conserva tal cual.
  "ID": { type: Number },
  "NOMBRE": { type: String, required: true },
  "DESCRIPCION": { type: String, default: "" },

  // CAMBIO ESTRUCTURAL: antes `DIAS` era [String] (días de la semana). Ahora es
  // un array de días-con-ejercicios anidados.
  "DIAS": { type: [diaRutinaSchema], default: [] },

  // NUEVO: recibe lo que antes vivía en DIAS (["lunes","martes",...] en minúsculas).
  "DIAS_SEMANA": { type: [String], default: [] },

  // DEPRECADO / legacy: se conserva para back-compat de lectura. Tras la
  // migración queda vacío. No se escribe más.
  "EJERCICIOS": { type: [ejercicioRutinaSchema], default: [] },

  "HABILITADA": { type: Boolean, default: true },
  "FECHA_CREACION": { type: Date, default: Date.now },
  "FECHA_MODIFICACION": { type: Date, default: Date.now },
  "DURACION": { type: Number, default: 60 },  // minutos. App: tiempoEstimado
  "DIFICULTAD": { type: Number, default: 3 }, // 1-5
  "NIVEL": { type: String, default: "medio" },
  "IMAGEN": { type: String, default: "" },
  "GYM_ID": { type: String, index: true },
});

export default mongoose.models.Rutina || mongoose.model('Rutina', schema);
