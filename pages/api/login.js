import { dbConnect } from "utils/mongoose";
import Usuario from "models/Usuario";
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
  console.log('aca', req.body);
  dbConnect();
  // res.status(200).json({ status: "ok" });
  let body = JSON.parse(req.body);
  let { dni } = body;
  console.log("DNI consultado: ", dni);
  try {
    let filter = { "DNI": dni };
    console.log("filter", filter);
    let user = await Usuario.findOne(filter);
    console.log("user", user);
    res.status(200).json({ status: "ok", user: user });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
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