const mongoose = require('mongoose');

// Reserva de clase grupal (Feature 4.3, CONTRACT-fase4.md §1.4).
//
// Un socio reserva un dictado concreto de una clase, identificado por FECHA
// (medianoche UTC del día, mismo criterio que Asistencia.FECHA). Cancelar NO
// borra el doc: pasa a ESTADO "cancelada" para liberar cupo sin perder el
// histórico. Unicidad: un socio reserva la misma clase una sola vez por fecha
// (reactivar una cancelada reutiliza el mismo doc vía upsert).
const schema = mongoose.Schema({
  "DNI": { type: Number, required: true },
  "CLASE_ID": { type: mongoose.Schema.Types.ObjectId, ref: "Clase", required: true },
  "FECHA": { type: Date, required: true },           // medianoche UTC del día reservado
  "ESTADO": { type: String, enum: ["reservada", "cancelada"], default: "reservada" },
  "GYM_ID": { type: String, index: true, required: true },
  "FECHA_CREACION": { type: Date, default: Date.now },
});

// Un socio reserva la misma clase una vez por fecha (cancelar = ESTADO cancelada).
schema.index({ GYM_ID: 1, DNI: 1, CLASE_ID: 1, FECHA: 1 }, { unique: true });

export default mongoose.models.Reserva || mongoose.model('Reserva', schema);
