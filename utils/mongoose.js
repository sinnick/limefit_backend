import { connect, connection } from 'mongoose';
const uri = process.env.MONGODB_URI;
console.log('uri', uri);
const conn = {
    isConnected: false,
}

async function dbConnect() {
    console.log('empieza dbConnect');

    if (conn.isConnected) return;
    const db = await connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    conn.isConnected = db.connections[0].readyState;
    // Acceso seguro: en cold-start db.connection.db puede no estar listo todavía;
    // sin el optional chaining, leer .databaseName tiraba y devolvía 500.
    console.log('MongoDB connected, DB:', db.connection?.db?.databaseName ?? '(conectando)');
}

export default dbConnect;

connection.on('error', console.error.bind(console, 'connection error:'));
connection.on('connected', () => {
    console.log('MongoDB connected');
});