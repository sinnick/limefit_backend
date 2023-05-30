const mongoose = require('mongoose');

const schema = mongoose.Schema({
    "DNI": Number,
    "USUARIO": String,
    "NOMBRE": String,
    "APELLIDO": String,
    "EMAIL": String,	
    "HABILITADO": Boolean,
    "ADMIN": Boolean,
    "FECHA_CREACION": Date,
    "FOTO": String,
    "SEXO": String,
});

export default mongoose.models.Usuario || mongoose.model('Usuario', schema);