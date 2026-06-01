const mongoose = require('mongoose');

// Clase grupal (Feature 4.3, CONTRACT-fase4.md §1.3).
//
// Define una clase recurrente del gym (p.ej. "Spinning" los lunes 18:00). El
// dictado concreto se identifica luego por FECHA en las Reservas; aquí solo vive
// la definición semanal. Unicidad: no se puede duplicar la misma clase en el
// mismo día/hora dentro de un gym.
const schema = mongoose.Schema({
  "NOMBRE": { type: String, required: true },
  "INSTRUCTOR": { type: String, required: true },
  "DIA_SEMANA": {
    type: String,
    enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
    required: true,
  },
  "HORA": { type: String, required: true },          // "HH:mm" 24h
  "CUPO": { type: Number, required: true },          // máximo de plazas
  "ACTIVA": { type: Boolean, default: true },
  "GYM_ID": { type: String, index: true, required: true },
  "FECHA_CREACION": { type: Date, default: Date.now },
  "FECHA_MODIFICACION": Date,
});

// No duplicar la misma clase en el mismo día/hora dentro de un gym.
schema.index({ GYM_ID: 1, NOMBRE: 1, DIA_SEMANA: 1, HORA: 1 }, { unique: true });

export default mongoose.models.Clase || mongoose.model('Clase', schema);
