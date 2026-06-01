const mongoose = require('mongoose');

const schema = mongoose.Schema({
    "DNI": Number,
    "USUARIO": String,
    "PASSWORD": String,
    "NOMBRE": String,
    "APELLIDO": String,
    "EMAIL": String,
    "HABILITADO": Boolean,
    "ADMIN": Boolean,
    "FECHA_CREACION": Date,
    "FOTO": String,
    "SEXO": String,
    "PESO_OBJETIVO": Number,
    "ROL": { type: String, enum: ["dueno", "admin", "entrenador", "recepcion", "usuario"], default: "usuario" },
    "GYM_ID": { type: String, index: true },
});

export default mongoose.models.Usuario || mongoose.model('Usuario', schema);