const mongoose = require('mongoose');

const ejercicioSchema = mongoose.Schema({
  nombre: { type: String, required: true },
  series: { type: Number, default: 3 },
  repeticiones: { type: Number, default: 10 },
  descanso: { type: Number, default: 60 }, // segundos entre series
  peso: { type: String, default: "" }, // ej: "20kg", "bodyweight"
  notas: { type: String, default: "" }
}, { _id: false });

const schema = mongoose.Schema({
  "NOMBRE": { type: String, required: true },
  "DESCRIPCION": String,
  "EJERCICIOS": [ejercicioSchema],
  "DIAS": [String],
  "HABILITADA": { type: Boolean, default: true },
  "FECHA_CREACION": { type: Date, default: Date.now },
  "FECHA_MODIFICACION": Date,
  "DURACION": { type: Number, default: 60 }, // minutos
  "DIFICULTAD": { type: Number, default: 3 }, // 1-5
  "NIVEL": { type: String, default: "medio" },
  "IMAGEN": String,
});

export default mongoose.models.Rutina || mongoose.model('Rutina', schema);
