import dbConnect from "utils/mongoose";
import Rutina from "models/Rutina";
import Cors from 'cors'

const cors = Cors({
    methods: ['POST', 'GET', 'HEAD'],
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
    console.log('req.body : ', typeof(req.body));
    let result_rutinas;
    dbConnect();
    // let body = JSON.parse(req.body);
    let {rutinas} = req.body;
    console.log("RUTINAS CONSULTADAS", rutinas);
    try {
        if (rutinas) {
            let filter = { "ID": rutinas };
            console.log("filter", filter);
            result_rutinas = await Rutina.find(filter);
            console.log({result_rutinas});
        } else {
            result_rutinas = await Rutina.find({});
        }
        res.status(200).json({ status: "ok", result_rutinas: result_rutinas });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }

}