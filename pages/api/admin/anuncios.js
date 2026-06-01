import dbConnect from "@/utils/mongoose"
import Anuncio from "@/models/Anuncio"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { puede } from "@/utils/permisos"

// CRUD de anuncios — Feature 4.4 (CONTRACT-fase4.md §2.6).
// Requiere session.user.admin (puerta del panel) y filtra por GYM_ID.
// Refina por ROL con puede(session, "anuncios") (ADITIVO — §5.2).
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }
  if (!puede(session, "anuncios")) {
    return res.status(403).json({ error: "Sin permisos para gestionar anuncios" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method === "GET") {
    try {
      const { q, audiencia, activo } = req.query
      const query = { GYM_ID }

      if (q && q.trim() !== "") {
        query.$or = [
          { TITULO: { $regex: q.trim(), $options: "i" } },
          { CUERPO: { $regex: q.trim(), $options: "i" } },
        ]
      }
      if (audiencia && audiencia.trim() !== "") {
        query.AUDIENCIA = audiencia
      }
      if (activo === "true") query.ACTIVO = true
      if (activo === "false") query.ACTIVO = false

      const anuncios = await Anuncio.find(query).sort({ FECHA_PUBLICACION: -1 })
      return res.status(200).json(anuncios)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      const { TITULO, CUERPO, AUDIENCIA, FECHA_PUBLICACION, ACTIVO } = req.body

      if (!TITULO || !CUERPO) {
        return res.status(400).json({ error: "TITULO y CUERPO son obligatorios" })
      }

      const nuevo = await Anuncio.create({
        TITULO,
        CUERPO,
        AUDIENCIA: AUDIENCIA || "todos",
        FECHA_PUBLICACION: FECHA_PUBLICACION ? new Date(FECHA_PUBLICACION) : new Date(),
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
      const { _id, TITULO, CUERPO, AUDIENCIA, FECHA_PUBLICACION, ACTIVO } = req.body

      if (!_id) {
        return res.status(400).json({ error: "Falta _id" })
      }

      const anuncio = await Anuncio.findOne({ _id, GYM_ID })
      if (!anuncio) {
        return res.status(404).json({ error: "Anuncio no encontrado" })
      }

      const updateData = { FECHA_MODIFICACION: new Date() }
      if (TITULO !== undefined) updateData.TITULO = TITULO
      if (CUERPO !== undefined) updateData.CUERPO = CUERPO
      if (AUDIENCIA !== undefined) updateData.AUDIENCIA = AUDIENCIA
      if (FECHA_PUBLICACION !== undefined) {
        updateData.FECHA_PUBLICACION = new Date(FECHA_PUBLICACION)
      }
      if (ACTIVO !== undefined) updateData.ACTIVO = ACTIVO

      const actualizado = await Anuncio.findOneAndUpdate(
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

      const eliminado = await Anuncio.findOneAndDelete({ _id: id, GYM_ID })
      if (!eliminado) {
        return res.status(404).json({ error: "Anuncio no encontrado" })
      }

      return res.status(200).json({ message: "Anuncio eliminado" })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
