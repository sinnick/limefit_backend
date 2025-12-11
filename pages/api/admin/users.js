import dbConnect from "@/utils/mongoose"
import Usuario from "@/models/Usuario"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import bcrypt from "bcryptjs"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  // Check if user is authenticated and is admin
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  await dbConnect()

  if (req.method === "GET") {
    try {
      const users = await Usuario.find({}).select('-PASSWORD').sort({ FECHA_CREACION: -1 })
      return res.status(200).json(users)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      const { DNI, USUARIO, PASSWORD, NOMBRE, APELLIDO, EMAIL, SEXO, ADMIN } = req.body

      // Check if user already exists
      const existingUser = await Usuario.findOne({
        $or: [{ DNI }, { USUARIO }]
      })

      if (existingUser) {
        return res.status(400).json({ error: "Usuario o DNI ya existe" })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(PASSWORD, 10)

      const newUser = await Usuario.create({
        DNI,
        USUARIO,
        PASSWORD: hashedPassword,
        NOMBRE,
        APELLIDO,
        EMAIL,
        SEXO,
        ADMIN: ADMIN || false,
        HABILITADO: true,
        FECHA_CREACION: new Date(),
        FOTO: ""
      })

      const userResponse = newUser.toObject()
      delete userResponse.PASSWORD

      return res.status(201).json(userResponse)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "PUT") {
    try {
      const { DNI, NOMBRE, APELLIDO, EMAIL, SEXO, ADMIN, HABILITADO, PASSWORD } = req.body

      const updateData = {
        NOMBRE,
        APELLIDO,
        EMAIL,
        SEXO,
        ADMIN,
        HABILITADO
      }

      // Only update password if provided
      if (PASSWORD && PASSWORD.trim() !== "") {
        updateData.PASSWORD = await bcrypt.hash(PASSWORD, 10)
      }

      const updatedUser = await Usuario.findOneAndUpdate(
        { DNI },
        updateData,
        { new: true }
      ).select('-PASSWORD')

      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" })
      }

      return res.status(200).json(updatedUser)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "DELETE") {
    try {
      const { dni } = req.query

      const deletedUser = await Usuario.findOneAndDelete({ DNI: parseInt(dni) })

      if (!deletedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" })
      }

      return res.status(200).json({ message: "Usuario eliminado" })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
