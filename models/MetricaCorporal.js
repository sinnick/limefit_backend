const mongoose = require('mongoose');

// MetricaCorporal — registro de peso corporal, % grasa y perímetros en una fecha
// (CONTRACT-fase1.md §2.1, feature 1.3). Offline-first igual que Record: cada
// métrica trae un CLIENT_ID (UUID generado por la app antes de encolar) y el
// endpoint batch hace upsert por (GYM_ID, DNI, CLIENT_ID), de modo que reenviar
// el mismo lote (reintento de red) NO duplica. Ese contrato lo garantiza el
// índice único compuesto de abajo.
const schema = mongoose.Schema({
  "DNI": Number,
  "GYM_ID": { type: String, index: true },
  "FECHA": Date,
  "PESO": Number,                // peso corporal
  "PORCENTAJE_GRASA": Number,    // %
  "MEDIDAS": Object,             // { pecho?, cintura?, cadera?, brazo?, muslo? }
  "NOTAS": String,
  "CLIENT_ID": String,           // idempotencia (UUID de la app)
});

// Índice único de idempotencia: reenviar el mismo CLIENT_ID = no-op (upsert).
// `partialFilterExpression` evita que documentos legacy sin CLIENT_ID choquen
// contra el índice único (sólo aplica cuando CLIENT_ID es string).
schema.index(
  { GYM_ID: 1, DNI: 1, CLIENT_ID: 1 },
  { unique: true, partialFilterExpression: { CLIENT_ID: { $type: "string" } } }
);

export default mongoose.models.MetricaCorporal || mongoose.model('MetricaCorporal', schema);
