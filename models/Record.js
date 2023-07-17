const mongoose = require('mongoose');

const schema = mongoose.Schema({
    "DNI": Number,
    "EJERCICIO": String,
    "PESO": Number,
    "FECHA": Date,
});

export default mongoose.models.Record || mongoose.model('Record', schema);