import dbConnect from "utils/mongoose";
import Usuario from "models/Usuario";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Login móvil por DNI (CONTRACT-fase0.md §b.1). Sin auth (la app entra solo con
// DNI, sin password). Proyecta SOLO campos seguros: nunca expone ADMIN/PASSWORD.

// Body crudo: inmune al Content-Type y a los quirks de parseo de Turbopack.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni } = await readJsonBody(req);
    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }

    const user = await Usuario.findOne({ DNI: dniNum, GYM_ID });

    // DNI inexistente → 200 con user: null (la app ya tolera user: null).
    if (!user) {
      return res.status(200).json({ status: "ok", user: null });
    }

    // Socio deshabilitado → 403.
    if (user.HABILITADO !== true) {
      return res.status(403).json({ status: "error", error: "Usuario deshabilitado" });
    }

    // Proyección segura: SOLO { DNI, NAME, FOTO, email }. NUNCA ADMIN/PASSWORD.
    const NAME = [user.NOMBRE, user.APELLIDO].filter(Boolean).join(" ").trim() || user.NOMBRE || "";
    const safeUser = {
      DNI: String(user.DNI),
      NAME,
      FOTO: user.FOTO || "",
      email: user.EMAIL || "",
    };

    return res.status(200).json({ status: "ok", user: safeUser });
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
