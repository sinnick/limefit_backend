import dbConnect from "utils/mongoose";
import Record from "models/Record";
import { activeTenant } from "config/tenant";
import Cors from 'cors'

const cors = Cors({
    methods: ['POST', 'GET', 'HEAD', 'DELETE', 'PUT'],
})

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result)
            }
            return resolve(result)
        })
    })
}

// Body crudo (bodyParser de Next desactivado): funciona con cualquier Content-Type
// (app mobile application/json, web text/plain) sin depender del parseo de Turbopack.
export const config = { api: { bodyParser: false } };

async function readJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
    try {
        await runMiddleware(req, res, cors)
        await dbConnect();
        const { dni } = await readJsonBody(req);
        console.log("list records DNI consultado: ", dni);
        let filter = { "DNI": dni, "GYM_ID": activeTenant.gymId };
        console.log("filter", filter);
        let result_records = await Record.find(filter);
        res.status(200).json({ status: "ok", result_records });
    } catch (error) {
        console.log('RECORDS LIST ERROR:', error);
        res.status(500).json({ error: String(error && error.message || error) });
    }
}