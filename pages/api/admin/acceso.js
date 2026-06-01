import dbConnect from "@/utils/mongoose"
import Asistencia from "@/models/Asistencia"
import Usuario from "@/models/Usuario"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { puede } from "@/utils/permisos"

// 4.2 — Control de acceso. Agregados de Asistencia (NO crea modelo nuevo).
// GET /api/admin/acceso?desde=&hasta=&dni=&q=
// Devuelve el historial de check-ins con NOMBRE/APELLIDO del socio.
// Requiere session.user.admin y filtra por GYM_ID. Refina con puede(acceso).
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }
  if (!puede(session, "acceso")) {
    return res.status(403).json({ error: "Sin permiso para ver acceso" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const { desde, hasta, dni, q } = req.query
    const query = { GYM_ID }

    if (desde || hasta) {
      query.FECHA = {}
      if (desde) {
        const d = new Date(desde)
        if (!isNaN(d)) query.FECHA.$gte = d
      }
      if (hasta) {
        const h = new Date(hasta)
        if (!isNaN(h)) {
          // incluir todo el día "hasta": hasta el final del día UTC.
          h.setUTCHours(23, 59, 59, 999)
          query.FECHA.$lte = h
        }
      }
      if (Object.keys(query.FECHA).length === 0) delete query.FECHA
    }

    if (dni && `${dni}`.trim() !== "") {
      const dniNum = parseInt(dni)
      if (!isNaN(dniNum)) query.DNI = dniNum
    }

    // Búsqueda por nombre: resolver DNIs en Usuario y filtrar.
    if (q && q.trim() !== "") {
      const term = q.trim()
      const usuarios = await Usuario.find({
        GYM_ID,
        $or: [
          { NOMBRE: { $regex: term, $options: "i" } },
          { APELLIDO: { $regex: term, $options: "i" } },
        ],
      }).select("DNI")
      const dnis = usuarios.map((u) => u.DNI)
      // Si ya hay un DNI explícito en query, intersectar; si no, usar la lista.
      if (query.DNI !== undefined) {
        if (!dnis.includes(query.DNI)) {
          return res.status(200).json([])
        }
      } else {
        query.DNI = { $in: dnis }
      }
    }

    const checkins = await Asistencia.find(query).sort({
      FECHA: -1,
      HORA_CHECKIN: -1,
    })

    // Anexar NOMBRE/APELLIDO del socio (lookup por DNI en Usuario).
    const dnisUnicos = [...new Set(checkins.map((c) => c.DNI))]
    const socios = await Usuario.find({
      GYM_ID,
      DNI: { $in: dnisUnicos },
    }).select("DNI NOMBRE APELLIDO")
    const mapaSocios = {}
    socios.forEach((s) => {
      mapaSocios[s.DNI] = { NOMBRE: s.NOMBRE, APELLIDO: s.APELLIDO }
    })

    const resultado = checkins.map((c) => {
      const socio = mapaSocios[c.DNI] || {}
      return {
        _id: c._id,
        DNI: c.DNI,
        NOMBRE: socio.NOMBRE || "",
        APELLIDO: socio.APELLIDO || "",
        FECHA: c.FECHA,
        HORA_CHECKIN: c.HORA_CHECKIN,
        METODO: c.METODO,
        NOTAS: c.NOTAS || "",
      }
    })

    return res.status(200).json(resultado)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
