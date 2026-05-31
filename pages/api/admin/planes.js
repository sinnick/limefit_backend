import dbConnect from "@/utils/mongoose"
import Plan from "@/models/Plan"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { puede } from "@/utils/permisos"

// CRUD de planes de membresía (Feature 4.1, CONTRACT-fase4.md §2.1).
// Requiere session.user.admin (puerta del panel) y refina por ROL (capacidad
// "planes": dueno/admin). Filtra por GYM_ID. Unicidad (GYM_ID, NOMBRE).
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }
  if (!puede(session, "planes")) {
    return res.status(403).json({ error: "Sin permiso para gestionar planes" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method === "GET") {
    try {
      const { q, activo } = req.query
      const query = { GYM_ID }

      if (q && q.trim() !== "") {
        query.NOMBRE = { $regex: q.trim(), $options: "i" }
      }
      if (activo === "true") query.ACTIVO = true
      if (activo === "false") query.ACTIVO = false

      const planes = await Plan.find(query).sort({ NOMBRE: 1 })
      return res.status(200).json(planes)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      const { NOMBRE, PRECIO, DURACION_DIAS, ACTIVO, DESCRIPCION } = req.body

      if (!NOMBRE || PRECIO === undefined || PRECIO === null || DURACION_DIAS === undefined || DURACION_DIAS === null) {
        return res.status(400).json({ error: "NOMBRE, PRECIO y DURACION_DIAS son obligatorios" })
      }

      const existing = await Plan.findOne({ GYM_ID, NOMBRE })
      if (existing) {
        return res.status(400).json({ error: "Ya existe un plan con ese nombre" })
      }

      const nuevo = await Plan.create({
        NOMBRE,
        PRECIO: Number(PRECIO),
        DURACION_DIAS: Number(DURACION_DIAS),
        ACTIVO: ACTIVO !== undefined ? ACTIVO : true,
        DESCRIPCION: DESCRIPCION || "",
        GYM_ID,
        FECHA_CREACION: new Date(),
        USUARIO_CREACION: session.user.username,
      })

      return res.status(201).json(nuevo)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "PUT") {
    try {
      const { _id, NOMBRE, PRECIO, DURACION_DIAS, ACTIVO, DESCRIPCION } = req.body

      if (!_id) {
        return res.status(400).json({ error: "Falta _id" })
      }

      const plan = await Plan.findOne({ _id, GYM_ID })
      if (!plan) {
        return res.status(404).json({ error: "Plan no encontrado" })
      }

      if (NOMBRE && NOMBRE !== plan.NOMBRE) {
        const dup = await Plan.findOne({ GYM_ID, NOMBRE, _id: { $ne: _id } })
        if (dup) {
          return res.status(400).json({ error: "Ya existe un plan con ese nombre" })
        }
      }

      const updateData = {
        FECHA_MODIFICACION: new Date(),
        USUARIO_MODIFICACION: session.user.username,
      }
      if (NOMBRE !== undefined) updateData.NOMBRE = NOMBRE
      if (PRECIO !== undefined) updateData.PRECIO = Number(PRECIO)
      if (DURACION_DIAS !== undefined) updateData.DURACION_DIAS = Number(DURACION_DIAS)
      if (ACTIVO !== undefined) updateData.ACTIVO = ACTIVO
      if (DESCRIPCION !== undefined) updateData.DESCRIPCION = DESCRIPCION

      const actualizado = await Plan.findOneAndUpdate(
        { _id, GYM_ID },
        updateData,
        { new: true }
      )

      return res.status(200).json(actualizado)
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

      const eliminado = await Plan.findOneAndDelete({ _id: id, GYM_ID })
      if (!eliminado) {
        return res.status(404).json({ error: "Plan no encontrado" })
      }

      return res.status(200).json({ message: "Plan eliminado" })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
