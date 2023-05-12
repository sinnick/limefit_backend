import { connect, connection } from 'mongoose';

const conn = {
    isConnected : false,
}


export async function dbConnect() {
    const uri  = 'mongodb://localhost:27017/limefit'
    // console.log(`uri - mongoose.js - 8`, '['+typeof(uri)+']'+uri);
    if (conn.isConnected) return;
    const db = await connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    conn.isConnected = db.connections[0].readyState;
    console.log('MongoDB connected, DB:', db.connection.db.databaseName);
}


// connection.on('error', console.error.bind(console, 'connection error:'));
// connection.on('connected', () => {
//     console.log('MongoDB connected');
//     });