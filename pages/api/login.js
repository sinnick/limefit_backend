import dbConnect from "utils/mongoose";
import Usuario from "models/Usuario";
import { activeTenant } from "config/tenant";
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

// Desactivamos el bodyParser de Next y leemos el body crudo, así el endpoint
// funciona con cualquier Content-Type (la app mobile manda application/json,
// el cliente web text/plain) y es inmune a los quirks de parseo de Turbopack.
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
    console.log("DNI consultado: ", dni);
    let filter = { "DNI": dni, "GYM_ID": activeTenant.gymId };
    console.log("filter", filter);
    let user = await Usuario.findOne(filter);
    console.log("user", user);
    res.status(200).json({ status: "ok", user: user });
  } catch (error) {
    console.log('LOGIN ERROR:', error);
    res.status(500).json({ error: String(error && error.message || error) });
  }
}











// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware


// export default async function handler(req,res) {
//   // Run the middleware
//   await runMiddleware(req, res, cors)

//   // Rest of the API logic
//   res.json({ message: 'Hello Everyone!' })
// }