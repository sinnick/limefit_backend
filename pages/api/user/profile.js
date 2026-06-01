import dbConnect from "utils/mongoose";
import Usuario from "models/Usuario";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Update de perfil del socio (CONTRACT-fase1.md §2.3). Móvil, sin auth, solo DNI
// (Opción A). Actualiza NOMBRE/APELLIDO/EMAIL/FOTO/SEXO/PESO_OBJETIVO sobre el
// modelo Usuario, respetando GYM_ID (header X-Brand). DNI NUNCA se actualiza (es
// clave). NUNCA expone PASSWORD/ADMIN (se proyectan fuera con .select()).

// Body crudo: inmune al Content-Type y a los quirks de parseo de Turbopack.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni, nombre, apellido, email, foto, sexo, pesoObjetivo } =
      await readJsonBody(req);

    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }

    // updateData SOLO con los campos presentes: no pisar con undefined.
    // DNI NO es editable (es clave). PASSWORD/ADMIN nunca se tocan.
    const updateData = {};
    if (nombre !== undefined) updateData.NOMBRE = nombre;
    if (apellido !== undefined) updateData.APELLIDO = apellido;
    if (email !== undefined) updateData.EMAIL = email;
    if (foto !== undefined) updateData.FOTO = foto;
    if (sexo !== undefined) updateData.SEXO = sexo;
    if (pesoObjetivo !== undefined) updateData.PESO_OBJETIVO = pesoObjetivo;

    const updated = await Usuario.findOneAndUpdate(
      { DNI: dniNum, GYM_ID },
      { $set: updateData },
      { new: true }
    ).select("-PASSWORD -ADMIN");

    // Socio inexistente para este GYM_ID → 404.
    if (!updated) {
      return res
        .status(404)
        .json({ status: "error", error: "Usuario no encontrado" });
    }

    return res.status(200).json({ status: "ok", user: updated });
  } catch (error) {
    console.log("PROFILE UPDATE ERROR:", error);
    return res
      .status(500)
      .json({ status: "error", error: String((error && error.message) || error) });
  }
}
