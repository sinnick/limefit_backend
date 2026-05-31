import dbConnect from "@/utils/mongoose"
import Membresia from "@/models/Membresia"
import Plan from "@/models/Plan"
import Usuario from "@/models/Usuario"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { puede } from "@/utils/permisos"
import { calcularEstadoCuota, calcularFechaFin } from "@/utils/membresias"

// Asignar/renovar membresías + estado de cuota (Feature 4.1, CONTRACT-fase4.md §2.2).
// Requiere session.user.admin y capacidad "membresias" (dueno/admin/recepcion).
// Una membresía por socio por gym (índice único GYM_ID+DNI).
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }
  if (!puede(session, "membresias")) {
    return res.status(403).json({ error: "Sin permiso para gestionar membresías" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method === "GET") {
    try {
      const { q, estado, dni } = req.query
      const query = { GYM_ID }

      if (dni && String(dni).trim() !== "") {
        const dniNum = Number(dni)
        if (Number.isFinite(dniNum)) query.DNI = dniNum
      }
      if (estado && estado.trim() !== "") query.ESTADO = estado

      const membresias = await Membresia.find(query).sort({ FECHA_FIN: 1 }).lean()

      // Join de NOMBRE/APELLIDO del socio por DNI.
      const dnis = membresias.map((m) => m.DNI)
      const socios = await Usuario.find(
        { GYM_ID, DNI: { $in: dnis } },
        { DNI: 1, NOMBRE: 1, APELLIDO: 1 }
      ).lean()
      const socioPorDni = {}
      socios.forEach((s) => { socioPorDni[s.DNI] = s })

      let result = membresias.map((m) => {
        const { estadoCuota, diasRestantes } = calcularEstadoCuota(m)
        const socio = socioPorDni[m.DNI]
        return {
          ...m,
          NOMBRE: socio ? socio.NOMBRE : "",
          APELLIDO: socio ? socio.APELLIDO : "",
          estadoCuota,
          diasRestantes,
        }
      })

      // Filtro por texto (nombre/apellido/dni) si se pasó q.
      if (q && q.trim() !== "") {
        const term = q.trim().toLowerCase()
        result = result.filter((m) =>
          String(m.DNI).includes(term) ||
          (m.NOMBRE || "").toLowerCase().includes(term) ||
          (m.APELLIDO || "").toLowerCase().includes(term) ||
          (m.PLAN_NOMBRE || "").toLowerCase().includes(term)
        )
      }

      return res.status(200).json(result)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      const { DNI, PLAN_ID, FECHA_INICIO } = req.body

      const dniNum = Number(DNI)
      if (!Number.isFinite(dniNum) || !PLAN_ID) {
        return res.status(400).json({ error: "DNI y PLAN_ID son obligatorios" })
      }

      const plan = await Plan.findOne({ _id: PLAN_ID, GYM_ID })
      if (!plan) {
        return res.status(404).json({ error: "Plan no encontrado" })
      }

      const inicio = FECHA_INICIO ? new Date(FECHA_INICIO) : new Date()
      const fin = calcularFechaFin(inicio, plan.DURACION_DIAS)

      const existente = await Membresia.findOne({ GYM_ID, DNI: dniNum })

      const actualizada = await Membresia.findOneAndUpdate(
        { GYM_ID, DNI: dniNum },
        {
          $set: {
            PLAN_ID: plan._id,
            PLAN_NOMBRE: plan.NOMBRE,
            FECHA_INICIO: inicio,
            FECHA_FIN: fin,
            ESTADO: "activa",
            GYM_ID,
            DNI: dniNum,
            FECHA_MODIFICACION: new Date(),
          },
          $setOnInsert: { FECHA_CREACION: new Date() },
        },
        { new: true, upsert: true }
      )

      return res.status(existente ? 200 : 201).json(actualizada)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "PUT") {
    try {
      const { _id, ESTADO, FECHA_FIN, FECHA_INICIO } = req.body
      if (!_id) {
        return res.status(400).json({ error: "Falta _id" })
      }

      const membresia = await Membresia.findOne({ _id, GYM_ID })
      if (!membresia) {
        return res.status(404).json({ error: "Membresía no encontrada" })
      }

      const updateData = { FECHA_MODIFICACION: new Date() }
      if (ESTADO !== undefined) updateData.ESTADO = ESTADO
      if (FECHA_FIN !== undefined) updateData.FECHA_FIN = new Date(FECHA_FIN)
      if (FECHA_INICIO !== undefined) updateData.FECHA_INICIO = new Date(FECHA_INICIO)

      const actualizada = await Membresia.findOneAndUpdate(
        { _id, GYM_ID },
        updateData,
        { new: true }
      )

      return res.status(200).json(actualizada)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query
      if (!id) {
        return res.status(400).json({ error: "Falta id" })
      }

      const eliminada = await Membresia.findOneAndDelete({ _id: id, GYM_ID })
      if (!eliminada) {
        return res.status(404).json({ error: "Membresía no encontrada" })
      }

      return res.status(200).json({ message: "Membresía eliminada" })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
