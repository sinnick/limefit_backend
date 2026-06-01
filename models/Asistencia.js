const mongoose = require('mongoose');

// Asistencia / check-in (Feature 2.5, CONTRACT-fase2.md §2.5).
//
// Registro de asistencia del socio al gym. Offline-first: la app encola el
// check-in (syncQueue type 'asistencia') con un CLIENT_ID (UUID) y lo reenvía
// hasta confirmar. La verdad de unicidad NO es el CLIENT_ID sino el día: un solo
// check-in por (GYM_ID, DNI, FECHA) donde FECHA es medianoche UTC. Así, dos
// scans del mismo día (con o sin distinto CLIENT_ID) colapsan en un único doc.
const schema = mongoose.Schema({
  "DNI": { type: Number, required: true },
  "GYM_ID": { type: String, index: true, required: true },
  "FECHA": { type: Date, required: true },   // medianoche UTC (unicidad por día)
  "HORA_CHECKIN": Date,                       // ISO con hora real del check-in
  "METODO": { type: String, enum: ["qr", "dni", "manual"], default: "qr" },
  "CLIENT_ID": String,                        // idempotencia offline-first (UUID app)
  "NOTAS": String,
});

// Un check-in por DNI+gym+día: reintentos del mismo día = no-op (upsert).
schema.index({ GYM_ID: 1, DNI: 1, FECHA: 1 }, { unique: true });

export default mongoose.models.Asistencia || mongoose.model('Asistencia', schema);
