import dbConnect from "@/utils/mongoose"
import Membresia from "@/models/Membresia"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { puede } from "@/utils/permisos"

// Registrar pago MANUAL en una membresía (Feature 4.1, CONTRACT-fase4.md §2.3).
// Solo POST. Hace $push al array PAGOS. Por defecto el pago NO mueve FECHA_FIN
// (renovar es POST a /api/admin/membresias). Requiere capacidad "membresias".
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }
  if (!puede(session, "membresias")) {
    return res.status(403).json({ error: "Sin permiso para registrar pagos" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const { membresiaId, DNI, MONTO, FECHA, METODO, NOTAS } = req.body

    const monto = Number(MONTO)
    if (!Number.isFinite(monto) || monto <= 0) {
      return res.status(400).json({ error: "MONTO debe ser mayor a 0" })
    }

    let filtro = null
    if (membresiaId) {
      filtro = { _id: membresiaId, GYM_ID }
    } else if (DNI !== undefined && DNI !== null && String(DNI) !== "") {
      const dniNum = Number(DNI)
      if (!Number.isFinite(dniNum)) {
        return res.status(400).json({ error: "DNI inválido" })
      }
      filtro = { GYM_ID, DNI: dniNum }
    } else {
      return res.status(400).json({ error: "Falta membresiaId o DNI" })
    }

    const pago = {
      MONTO: monto,
      FECHA: FECHA ? new Date(FECHA) : new Date(),
      METODO: METODO || "efectivo",
      NOTAS: NOTAS || "",
      USUARIO_REGISTRO: session.user.username,
    }

    const actualizada = await Membresia.findOneAndUpdate(
      filtro,
      {
        $push: { PAGOS: pago },
        $set: { FECHA_MODIFICACION: new Date() },
      },
      { new: true }
    )

    if (!actualizada) {
      return res.status(404).json({ error: "Membresía no encontrada" })
    }

    return res.status(201).json(actualizada)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
