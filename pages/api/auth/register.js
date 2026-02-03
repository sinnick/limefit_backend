import dbConnect from "@/utils/mongoose"
import Usuario from "@/models/Usuario"
import bcrypt from "bcryptjs"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    await dbConnect()

    const { dni, usuario, password, nombre, apellido, email } = req.body

    // Validations
    if (!dni || !usuario || !password || !nombre || !apellido) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" })
    }

    // Check if user already exists
    const existingUser = await Usuario.findOne({
      $or: [
        { DNI: parseInt(dni) },
        { USUARIO: usuario.toLowerCase() },
        ...(email ? [{ EMAIL: email.toLowerCase() }] : [])
      ]
    })

    if (existingUser) {
      if (existingUser.DNI === parseInt(dni)) {
        return res.status(400).json({ error: "Ya existe un usuario con ese DNI" })
      }
      if (existingUser.USUARIO === usuario.toLowerCase()) {
        return res.status(400).json({ error: "El nombre de usuario ya está en uso" })
      }
      if (email && existingUser.EMAIL === email.toLowerCase()) {
        return res.status(400).json({ error: "El email ya está registrado" })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await Usuario.create({
      DNI: parseInt(dni),
      USUARIO: usuario.toLowerCase(),
      PASSWORD: hashedPassword,
      NOMBRE: nombre,
      APELLIDO: apellido,
      EMAIL: email?.toLowerCase() || "",
      HABILITADO: true,
      ADMIN: false,
      FECHA_CREACION: new Date(),
    })

    return res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      user: {
        id: newUser._id,
        dni: newUser.DNI,
        usuario: newUser.USUARIO,
        nombre: newUser.NOMBRE,
        apellido: newUser.APELLIDO,
      }
    })

  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({ error: "Error al registrar usuario" })
  }
}
