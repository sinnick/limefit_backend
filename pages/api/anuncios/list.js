import dbConnect from "utils/mongoose";
import Anuncio from "models/Anuncio";
import { applyCors, readJsonBody, resolveGymId } from "utils/mobile";

// Listado de anuncios para la app móvil — Feature 4.4 (CONTRACT-fase4.md §3.6).
//
// Patrón común móvil: CORS+OPTIONS, bodyParser off, tenant por X-Brand.
// La app de socios pide audiencia="socios" → ve "todos"+"socios".
// Staff (futuro) pediría "staff" → ve "todos"+"staff".
// Proyección segura: solo campos públicos del anuncio.

export const config = { api: { bodyParser: false } };

const AUDIENCIAS_VALIDAS = ["socios", "staff", "todos"];

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    // Acepta GET (query) o POST (body). Default audiencia = "socios".
    let audiencia = "socios";
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (body && body.audiencia) audiencia = String(body.audiencia);
    } else if (req.query && req.query.audiencia) {
      audiencia = String(req.query.audiencia);
    }
    if (!AUDIENCIAS_VALIDAS.includes(audiencia)) audiencia = "socios";

    const anuncios = await Anuncio.find({
      GYM_ID,
      ACTIVO: true,
      AUDIENCIA: { $in: ["todos", audiencia] },
    })
      .sort({ FECHA_PUBLICACION: -1 })
      .select("TITULO CUERPO FECHA_PUBLICACION AUDIENCIA")
      .lean();

    return res.status(200).json({
      status: "ok",
      data: anuncios,
    });
  } catch (error) {
    console.log("ANUNCIOS LIST ERROR:", error);
    return res
      .status(500)
      .json({ status: "error", error: String((error && error.message) || error) });
  }
}
