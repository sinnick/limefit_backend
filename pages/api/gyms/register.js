import dbConnect from "@/utils/mongoose"
import Gym from "@/models/Gym"
import Usuario from "@/models/Usuario"
import bcrypt from "bcryptjs"

// Slugs reservados: corresponden a los tenants build-time (config/tenants.js).
// Garantía núcleo de no-colisión: un gym de DB nunca puede registrarse con un
// slug build-time, por lo que resolveBranding para esos slugs siempre devuelve
// el estático y jamás consulta la DB.
const RESERVED_SLUGS = ['limefit', 'level']

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const {
      slug,
      nombre,
      email,
      telefono,
      admin_dni,
      admin_usuario,
      admin_password,
      admin_nombre,
      admin_apellido,
    } = req.body || {}

    // 1. Campos obligatorios
    if (
      !slug ||
      !nombre ||
      !admin_dni ||
      !admin_usuario ||
      !admin_password ||
      !admin_nombre ||
      !admin_apellido
    ) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" })
    }

    const slugLower = String(slug).toLowerCase()
    const usuarioLower = String(admin_usuario).toLowerCase()

    // 2. Slug reservado (no-colisión con tenants build-time)
    if (RESERVED_SLUGS.includes(slugLower)) {
      return res.status(400).json({ error: `El slug '${slugLower}' está reservado` })
    }

    // 3. Formato slug
    if (!/^[a-z0-9-]+$/.test(slugLower)) {
      return res.status(400).json({
        error: "El slug solo puede contener letras minúsculas, números y guiones",
      })
    }

    // 6. Password mínima (defensa server)
    if (String(admin_password).length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" })
    }

    await dbConnect()

    // 4. Slug único en DB
    const existingGym = await Gym.findOne({ SLUG: slugLower })
    if (existingGym) {
      return res.status(400).json({ error: "El slug ya está en uso" })
    }

    // 5. Admin único POR GYM (el resto del sistema trata DNI/USUARIO como únicos
    //    por GYM_ID). El gym es nuevo (slug único), así que este chequeo siempre
    //    pasa; reusar un DNI/usuario que existe en OTRO gym es válido (multi-tenant).
    const dniInt = parseInt(admin_dni)
    const existingUser = await Usuario.findOne({
      GYM_ID: slugLower,
      $or: [{ DNI: dniInt }, { USUARIO: usuarioLower }],
    })
    if (existingUser) {
      if (existingUser.DNI === dniInt) {
        return res.status(400).json({ error: "Ya existe un usuario con ese DNI" })
      }
      return res.status(400).json({ error: "El nombre de usuario ya está en uso" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(admin_password, 12)

    // Crear Gym
    const gym = await Gym.create({
      SLUG: slugLower,
      NOMBRE: nombre,
      FONTS: null,
      ACTIVO: true,
      CONTACTO_EMAIL: email || "",
      TELEFONO: telefono || "",
      FECHA_CREACION: new Date(),
    })

    // Crear primer Usuario admin (dueño). Rollback del Gym si falla.
    let admin
    try {
      admin = await Usuario.create({
        DNI: dniInt,
        USUARIO: usuarioLower,
        PASSWORD: hashedPassword,
        NOMBRE: admin_nombre,
        APELLIDO: admin_apellido,
        EMAIL: email?.toLowerCase() || "",
        HABILITADO: true,
        ADMIN: true,
        ROL: "dueno",
        GYM_ID: gym.SLUG,
        FECHA_CREACION: new Date(),
      })
    } catch (userError) {
      // Rollback simple (MVP, sin transacciones): borrar el gym huérfano.
      await Gym.deleteOne({ _id: gym._id })
      throw userError
    }

    return res.status(201).json({
      success: true,
      message: "Gimnasio registrado correctamente",
      gym: {
        id: gym._id,
        slug: gym.SLUG,
        nombre: gym.NOMBRE,
      },
      admin: {
        id: admin._id,
        dni: admin.DNI,
        usuario: admin.USUARIO,
        nombre: admin.NOMBRE,
        apellido: admin.APELLIDO,
        rol: admin.ROL,
      },
    })
  } catch (error) {
    console.error("Gym registration error:", error)
    return res.status(500).json({ error: "Error al registrar gimnasio" })
  }
}
