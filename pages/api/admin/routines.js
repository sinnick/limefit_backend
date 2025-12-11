import dbConnect from "@/utils/mongoose"
import Rutina from "@/models/Rutina"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  // Check if user is authenticated and is admin
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  await dbConnect()

  if (req.method === "GET") {
    try {
      const routines = await Rutina.find({}).sort({ FECHA_CREACION: -1 })
      return res.status(200).json(routines)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      const {
        NOMBRE,
        DESCRIPCION,
        DIAS,
        DURACION,
        DIFICULTAD,
        IMAGEN,
        NIVEL
      } = req.body

      // Get the highest ID and increment
      const lastRoutine = await Rutina.findOne().sort({ ID: -1 })
      const newId = lastRoutine ? lastRoutine.ID + 1 : 1

      const newRoutine = await Rutina.create({
        ID: newId,
        NOMBRE,
        DESCRIPCION,
        DIAS: DIAS || [],
        HABILITADA: true,
        FECHA_CREACION: new Date(),
        FECHA_MODIFICACION: new Date(),
        USUARIO_CREACION: session.user.username,
        USUARIO_MODIFICACION: session.user.username,
        DURACION,
        DIFICULTAD,
        IMAGEN: IMAGEN || "",
        NIVEL
      })

      return res.status(201).json(newRoutine)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "PUT") {
    try {
      const {
        ID,
        NOMBRE,
        DESCRIPCION,
        DIAS,
        DURACION,
        DIFICULTAD,
        IMAGEN,
        NIVEL,
        HABILITADA
      } = req.body

      const updatedRoutine = await Rutina.findOneAndUpdate(
        { ID },
        {
          NOMBRE,
          DESCRIPCION,
          DIAS,
          DURACION,
          DIFICULTAD,
          IMAGEN,
          NIVEL,
          HABILITADA,
          FECHA_MODIFICACION: new Date(),
          USUARIO_MODIFICACION: session.user.username
        },
        { new: true }
      )

      if (!updatedRoutine) {
        return res.status(404).json({ error: "Rutina no encontrada" })
      }

      return res.status(200).json(updatedRoutine)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query

      const deletedRoutine = await Rutina.findOneAndDelete({ ID: parseInt(id) })

      if (!deletedRoutine) {
        return res.status(404).json({ error: "Rutina no encontrada" })
      }

      return res.status(200).json({ message: "Rutina eliminada" })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
