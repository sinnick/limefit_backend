const mongoose = require('mongoose');

// Membresía del socio (Feature 4.1, CONTRACT-fase4.md §1.2).
// Una membresía vigente por socio por gym (índice único GYM_ID+DNI). Al renovar
// se actualiza el mismo doc y se hace $push al array PAGOS. Pagos MANUALES.

// Subdocumento de pago (camelCase interno como Rutina.js NO aplica aquí: el
// contrato lo pide en MAYÚSCULAS para los campos del pago).
const pagoSchema = mongoose.Schema({
  "MONTO": { type: Number, required: true },
  "FECHA": { type: Date, required: true },           // fecha en que se registró el pago
  "METODO": { type: String, enum: ["efectivo", "transferencia", "tarjeta", "otro"], default: "efectivo" },
  "NOTAS": String,
  "USUARIO_REGISTRO": String,                          // session.user.username que registró
}, { _id: false });

const schema = mongoose.Schema({
  "DNI": { type: Number, required: true },
  "PLAN_ID": { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  "PLAN_NOMBRE": String,                               // snapshot del nombre al asignar (histórico)
  "FECHA_INICIO": { type: Date, required: true },
  "FECHA_FIN": { type: Date, required: true },         // = FECHA_INICIO + Plan.DURACION_DIAS
  "ESTADO": { type: String, enum: ["activa", "vencida", "suspendida"], default: "activa" },
  "PAGOS": { type: [pagoSchema], default: [] },
  "GYM_ID": { type: String, index: true, required: true },
  "FECHA_CREACION": { type: Date, default: Date.now },
  "FECHA_MODIFICACION": Date,
});

// Una membresía por socio por gym (renovar = actualizar mismo doc).
schema.index({ GYM_ID: 1, DNI: 1 }, { unique: true });
// Para listados/filtros por estado.
schema.index({ GYM_ID: 1, ESTADO: 1 });

export default mongoose.models.Membresia || mongoose.model('Membresia', schema);
