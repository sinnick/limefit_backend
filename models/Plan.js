const mongoose = require('mongoose');

// Plan de membresía (Feature 4.1, CONTRACT-fase4.md §1.1).
// Registro MANUAL: el PRECIO es informativo, no hay pasarela de pago.
const schema = mongoose.Schema({
  "NOMBRE": { type: String, required: true },
  "PRECIO": { type: Number, required: true },        // moneda local, registro manual
  "DURACION_DIAS": { type: Number, required: true },  // p.ej. 30, 90, 365
  "ACTIVO": { type: Boolean, default: true },          // plan disponible para asignar
  "DESCRIPCION": String,
  "GYM_ID": { type: String, index: true, required: true },
  "FECHA_CREACION": { type: Date, default: Date.now },
  "FECHA_MODIFICACION": Date,
  "USUARIO_CREACION": String,
  "USUARIO_MODIFICACION": String,
});

// Unicidad por nombre dentro del gym.
schema.index({ GYM_ID: 1, NOMBRE: 1 }, { unique: true });

export default mongoose.models.Plan || mongoose.model('Plan', schema);
