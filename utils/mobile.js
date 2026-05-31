// Helpers compartidos por los endpoints MÓVILES de la Fase 0
// (CONTRACT-fase0.md §b "Reglas comunes a TODOS los endpoints móviles").
//
// Unifica el patrón que ya vivía duplicado en login.js / records/list.js:
//   - CORS con methods POST/GET/HEAD/OPTIONS y header X-Brand permitido.
//   - Preflight OPTIONS → 204.
//   - readJsonBody: body crudo (bodyParser de Next desactivado), inmune al
//     Content-Type y a los quirks de Turbopack.
//   - resolveGymId: resuelve el GYM_ID por header X-Brand contra config/tenants,
//     con fallback al tenant del deploy (activeTenant.gymId).
//
// Recordá poner en cada endpoint que use readJsonBody:
//   export const config = { api: { bodyParser: false } };

import Cors from "cors";
import { tenants } from "config/tenants";
import { activeTenant } from "config/tenant";

// La app manda Content-Type: application/json y el header X-Brand.
const cors = Cors({
  methods: ["POST", "GET", "HEAD", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Brand"],
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Corre CORS y, si es preflight (OPTIONS), responde 204 y devuelve true para
// que el handler corte temprano. Devuelve false si hay que seguir procesando.
export async function applyCors(req, res) {
  await runMiddleware(req, res, cors);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

// Lee el body crudo y lo parsea como JSON. Requiere
// `export const config = { api: { bodyParser: false } }` en el endpoint.
export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

// Resolución de tenant por X-Brand (CONTRACT-fase0.md §b "CAMBIO DE CONTRATO"):
// leer X-Brand, validarlo contra config/tenants; si es válido usar
// tenants[xBrand].gymId; si falta o es inválido, caer a activeTenant.gymId.
export function resolveGymId(req) {
  const header = req.headers["x-brand"];
  const xBrand = Array.isArray(header) ? header[0] : header;
  if (xBrand && tenants[xBrand] && tenants[xBrand].gymId) {
    return tenants[xBrand].gymId;
  }
  return activeTenant.gymId;
}

// Normaliza el DNI del borde del endpoint: la app lo manda como string, el
// backend lo persiste/consulta como Number. Devuelve Number válido o null.
export function normalizeDni(dni) {
  if (dni === undefined || dni === null || dni === "") return null;
  const n = Number(dni);
  return Number.isFinite(n) ? n : null;
}
