const mongoose = require('mongoose');

const schema = mongoose.Schema({
    "ID": Number, // "ID": "1
    "NOMBRE": String,
    "DESCRIPCION": String,
    "EJERCICIOS": Array,
    "HABILITADO": Boolean,
    "FECHA_CREACION": Date,
    "FECHA_MODIFICACION": Date,
    "USUARIO_CREACION": String,
    "USUARIO_MODIFICACION": String,
    "DURACION" : Number,
    "DIFICULTAD" : Number,
    "IMAGEN" : String,
    "NIVEL" : Array,
});

export default mongoose.models.Rutina || mongoose.model('Rutina', schema);