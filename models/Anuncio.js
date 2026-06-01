const mongoose = require('mongoose');

// Anuncio — Feature 4.4 del CONTRACT-fase4.md §1.5.
//
// Comunicación/anuncios in-app del gym. CRUD desde el panel admin
// (pages/api/admin/anuncios.js) y lectura desde la app móvil del socio
// (pages/api/anuncios/list.js). Esquema en MAYÚSCULAS, multi-tenant por GYM_ID.
//
// AUDIENCIA segmenta quién ve el anuncio: "todos" lo ve cualquiera,
// "socios" solo la app de socios, "staff" solo el panel/staff (futuro).
//
// Push masivo: NO se implementa (requiere prebuild nativo). Solo in-app.
const schema = mongoose.Schema({
  "TITULO": { type: String, required: true },
  "CUERPO": { type: String, required: true },
  "AUDIENCIA": { type: String, enum: ["todos", "socios", "staff"], default: "todos" },
  "FECHA_PUBLICACION": { type: Date, default: Date.now },
  "ACTIVO": { type: Boolean, default: true },
  "GYM_ID": { type: String, index: true, required: true },
  "FECHA_CREACION": { type: Date, default: Date.now },
  "FECHA_MODIFICACION": Date,
  "USUARIO_CREACION": String,
});

// Listado por fecha de publicación descendente (no único).
schema.index({ GYM_ID: 1, FECHA_PUBLICACION: -1 });

export default mongoose.models.Anuncio || mongoose.model('Anuncio', schema);
