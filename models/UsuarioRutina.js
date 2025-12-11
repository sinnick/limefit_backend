import mongoose from 'mongoose';

const UsuarioRutinaSchema = new mongoose.Schema({
  DNI: {
    type: Number,
    required: true,
    ref: 'Usuario'
  },
  RUTINA_ID: {
    type: Number,
    required: true,
    ref: 'Rutina'
  },
  FECHA_ASIGNACION: {
    type: Date,
    default: Date.now
  },
  ASIGNADO_POR: {
    type: String,
    required: true
  },
  ACTIVA: {
    type: Boolean,
    default: true
  },
  FECHA_INICIO: {
    type: Date,
    default: Date.now
  },
  FECHA_FIN: {
    type: Date,
    default: null
  },
  NOTAS: {
    type: String,
    default: ''
  }
});

// Create compound index to ensure a user can't have duplicate active routines
UsuarioRutinaSchema.index({ DNI: 1, RUTINA_ID: 1, ACTIVA: 1 });

export default mongoose.models.UsuarioRutina || mongoose.model('UsuarioRutina', UsuarioRutinaSchema);
