const mongoose = require('mongoose');

const schema = mongoose.Schema({
    "DNI": Number,
    "EJERCICIO": String,
    "PESO": Number,
    "FECHA": Date,
    "GYM_ID": { type: String, index: true },
});

export default mongoose.models.Record || mongoose.model('Record', schema);