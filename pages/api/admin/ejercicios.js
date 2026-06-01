import dbConnect from "@/utils/mongoose"
import Ejercicio from "@/models/Ejercicio"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"

// CRUD biblioteca de ejercicios (ver CONTRACT-fase3 §1.1 / 3.1).
// Requiere session.user.admin y filtra por GYM_ID. Unicidad (GYM_ID, NOMBRE).
// GET usado también por el autocomplete de 3.2 (routines.jsx).
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method === "GET") {
    try {
      const { q, grupo, activo } = req.query
      const query = { GYM_ID }

      if (q && q.trim() !== "") {
        query.NOMBRE = { $regex: q.trim(), $options: "i" }
      }
      if (grupo && grupo.trim() !== "") {
        query.GRUPO_MUSCULAR = grupo
      }
      if (activo === "true") query.ACTIVO = true
      if (activo === "false") query.ACTIVO = false

      const ejercicios = await Ejercicio.find(query).sort({ NOMBRE: 1 })
      return res.status(200).json(ejercicios)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      const {
        NOMBRE,
        GRUPO_MUSCULAR,
        TIPO,
        EQUIPO,
        DIFICULTAD,
        INSTRUCCIONES,
        URL_IMAGEN,
        ACTIVO,
      } = req.body

      if (!NOMBRE || !GRUPO_MUSCULAR) {
        return res.status(400).json({ error: "NOMBRE y GRUPO_MUSCULAR son obligatorios" })
      }

      const existing = await Ejercicio.findOne({ GYM_ID, NOMBRE })
      if (existing) {
        return res.status(400).json({ error: "Ya existe un ejercicio con ese nombre" })
      }

      const nuevo = await Ejercicio.create({
        NOMBRE,
        GRUPO_MUSCULAR,
        TIPO: TIPO || "",
        EQUIPO: EQUIPO || "",
        DIFICULTAD: DIFICULTAD || "",
        INSTRUCCIONES: INSTRUCCIONES || "",
        URL_IMAGEN: URL_IMAGEN || "",
        ACTIVO: ACTIVO !== undefined ? ACTIVO : true,
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
      const {
        _id,
        NOMBRE,
        GRUPO_MUSCULAR,
        TIPO,
        EQUIPO,
        DIFICULTAD,
        INSTRUCCIONES,
        URL_IMAGEN,
        ACTIVO,
      } = req.body

      if (!_id) {
        return res.status(400).json({ error: "Falta _id" })
      }

      const ejercicio = await Ejercicio.findOne({ _id, GYM_ID })
      if (!ejercicio) {
        return res.status(404).json({ error: "Ejercicio no encontrado" })
      }

      // Revalidar unicidad de NOMBRE si cambia.
      if (NOMBRE && NOMBRE !== ejercicio.NOMBRE) {
        const dup = await Ejercicio.findOne({ GYM_ID, NOMBRE, _id: { $ne: _id } })
        if (dup) {
          return res.status(400).json({ error: "Ya existe un ejercicio con ese nombre" })
        }
      }

      const updateData = {
        FECHA_MODIFICACION: new Date(),
        USUARIO_MODIFICACION: session.user.username,
      }
      if (NOMBRE !== undefined) updateData.NOMBRE = NOMBRE
      if (GRUPO_MUSCULAR !== undefined) updateData.GRUPO_MUSCULAR = GRUPO_MUSCULAR
      if (TIPO !== undefined) updateData.TIPO = TIPO
      if (EQUIPO !== undefined) updateData.EQUIPO = EQUIPO
      if (DIFICULTAD !== undefined) updateData.DIFICULTAD = DIFICULTAD
      if (INSTRUCCIONES !== undefined) updateData.INSTRUCCIONES = INSTRUCCIONES
      if (URL_IMAGEN !== undefined) updateData.URL_IMAGEN = URL_IMAGEN
      if (ACTIVO !== undefined) updateData.ACTIVO = ACTIVO

      const actualizado = await Ejercicio.findOneAndUpdate(
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

      const eliminado = await Ejercicio.findOneAndDelete({ _id: id, GYM_ID })
      if (!eliminado) {
        return res.status(404).json({ error: "Ejercicio no encontrado" })
      }

      return res.status(200).json({ message: "Ejercicio eliminado" })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
