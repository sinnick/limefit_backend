const mongoose = require('mongoose');

// Record (PR / marca de un ejercicio). Ampliado en Fase 0 para soportar la cola
// de sync offline-first (CONTRACT-fase0.md §b.3 "POST /api/records/batch").
//
// Idempotencia: cada record trae un `CLIENT_ID` (UUID generado por la app antes
// de encolar). El endpoint batch hace upsert por (GYM_ID, DNI, CLIENT_ID), de modo
// que reenviar el mismo lote (reintento de red) NO duplica. Ese contrato lo
// garantiza el índice único compuesto de abajo.
const schema = mongoose.Schema({
  "DNI": Number,
  "EJERCICIO": String,        // ejercicioNombre del body
  "EJERCICIO_ID": String,     // NUEVO: ejercicioId estable de la rutina
  "PESO": Number,
  "REPS": Number,             // NUEVO
  "NOTAS": String,            // NUEVO
  "ES_RECORD": Boolean,       // NUEVO: PR detectado por el cliente (verdad local en Fase 0)
  "CLIENT_ID": String,        // NUEVO: clave de idempotencia (UUID de la app)
  "FECHA": Date,
  "GYM_ID": { type: String, index: true },
});

// Índice único de idempotencia: reenviar el mismo CLIENT_ID = no-op (upsert).
// `partialFilterExpression` evita que documentos legacy sin CLIENT_ID choquen
// contra el índice único (sólo aplica cuando CLIENT_ID es string).
schema.index(
  { GYM_ID: 1, DNI: 1, CLIENT_ID: 1 },
  { unique: true, partialFilterExpression: { CLIENT_ID: { $type: "string" } } }
);

export default mongoose.models.Record || mongoose.model('Record', schema);
