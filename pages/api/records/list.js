import dbConnect from "utils/mongoose";
import Record from "models/Record";
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



export default async function handler(req, res) {
    await runMiddleware(req, res, cors)
    console.log('list records', req.body);
    dbConnect();
    let body = JSON.parse(req.body);
    let { dni } = body;
    console.log("list records DNI consultado: ", dni);
    try {
        let filter = { "DNI": dni };
        console.log("filter", filter);
        let result_records = await Record.find(filter);
        console.log({ result_records});
        res.status(200).json({ status: "ok", result_records });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}