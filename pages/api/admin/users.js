import dbConnect from "@/utils/mongoose"
import Usuario from "@/models/Usuario"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import bcrypt from "bcryptjs"
import { activeTenant } from "@/config/tenant"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  // Check if user is authenticated and is admin
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method === "GET") {
    try {
      const users = await Usuario.find({ GYM_ID }).select('-PASSWORD').sort({ FECHA_CREACION: -1 })
      return res.status(200).json(users)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      const { DNI, USUARIO, PASSWORD, NOMBRE, APELLIDO, EMAIL, SEXO, ADMIN, ROL } = req.body

      // Unicidad por tenant: siempre por DNI; por USUARIO solo si viene (los
      // socios se crean sin USUARIO/PASSWORD — login móvil es solo-DNI).
      const orUnico = [{ DNI }]
      if (USUARIO) orUnico.push({ USUARIO })
      const existingUser = await Usuario.findOne({ GYM_ID, $or: orUnico })

      if (existingUser) {
        return res.status(400).json({ error: "Usuario o DNI ya existe" })
      }

      // Password opcional: solo se hashea si viene (los socios no tienen).
      const hashedPassword = PASSWORD ? await bcrypt.hash(PASSWORD, 10) : undefined

      const newUser = await Usuario.create({
        DNI,
        USUARIO,
        PASSWORD: hashedPassword,
        NOMBRE,
        APELLIDO,
        EMAIL,
        SEXO,
        ADMIN: ADMIN || false,
        ROL: ROL || (ADMIN ? "admin" : "usuario"),
        HABILITADO: true,
        FECHA_CREACION: new Date(),
        FOTO: "",
        GYM_ID
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
      const { DNI, NOMBRE, APELLIDO, EMAIL, SEXO, ADMIN, HABILITADO, PASSWORD, ROL } = req.body

      const updateData = {
        NOMBRE,
        APELLIDO,
        EMAIL,
        SEXO,
        ADMIN,
        HABILITADO
      }

      // Aditivo: solo setear ROL si viene en el body (no pisa con undefined)
      if (ROL !== undefined) {
        updateData.ROL = ROL
      }

      // Only update password if provided
      if (PASSWORD && PASSWORD.trim() !== "") {
        updateData.PASSWORD = await bcrypt.hash(PASSWORD, 10)
      }

      const updatedUser = await Usuario.findOneAndUpdate(
        { DNI, GYM_ID },
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

      const deletedUser = await Usuario.findOneAndDelete({ DNI: parseInt(dni), GYM_ID })

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
