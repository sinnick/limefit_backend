import dbConnect from "@/utils/mongoose"
import Rutina from "@/models/Rutina"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"

// ── Fase 5.3: Marketplace — Publicar / Despublicar una rutina propia ──────────
// PUT /api/admin/routines/share  body: { ID, COMPARTIDA }
// Toggle del flag COMPARTIDA. Solo opera sobre rutinas del GYM_ID propio, de
// modo que un gym jamás pueda publicar/despublicar rutinas de otro.
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  try {
    const { ID, COMPARTIDA } = req.body

    if (ID === undefined || ID === null || typeof COMPARTIDA !== "boolean") {
      return res
        .status(400)
        .json({ error: "Faltan datos: se requiere ID y COMPARTIDA (boolean)" })
    }

    // Filtro con GYM_ID propio: solo se puede publicar/despublicar lo propio.
    const updated = await Rutina.findOneAndUpdate(
      { ID, GYM_ID },
      {
        COMPARTIDA: Boolean(COMPARTIDA),
        FECHA_MODIFICACION: new Date(),
      },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ error: "Rutina no encontrada" })
    }

    return res.status(200).json(updated)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
