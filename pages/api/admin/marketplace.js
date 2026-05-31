import dbConnect from "@/utils/mongoose"
import Rutina from "@/models/Rutina"
import Gym from "@/models/Gym"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { tenants } from "@/config/tenants"

// Resuelve un GYM_ID (slug) a un nombre legible. Estáticos primero
// (config/tenants.js → limefit/level); si no, se busca en la colección `gyms`.
// Devuelve un map { slug: nombre } para los slugs pedidos.
async function resolveGymNames(slugs) {
  const map = {}
  const dbSlugs = []

  for (const slug of slugs) {
    const t = tenants[slug]
    if (t) {
      map[slug] = t.name
    } else {
      dbSlugs.push(slug)
    }
  }

  if (dbSlugs.length > 0) {
    const gyms = await Gym.find({ SLUG: { $in: dbSlugs } })
      .select("SLUG NOMBRE")
      .lean()
    for (const g of gyms) {
      map[g.SLUG] = g.NOMBRE
    }
  }

  return map
}

// ── Fase 5.3: Marketplace — Catálogo (única lectura cross-gym) ────────────────
// GET /api/admin/marketplace?q=<texto>&nivel=<all|principiante|medio|avanzado>
// Lista SOLO rutinas COMPARTIDA: true de OTROS gyms (GYM_ID != propio) y
// HABILITADA: true. Expone únicamente campos públicos (nunca GYM_ID crudo de
// otros, ni datos privados de socios/usuarios).
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : ""
    const nivel = typeof req.query.nivel === "string" ? req.query.nivel : ""

    const filter = {
      COMPARTIDA: true,
      GYM_ID: { $ne: GYM_ID }, // excluye las propias
      HABILITADA: true, // solo rutinas activas
      ...(q ? { NOMBRE: { $regex: q, $options: "i" } } : {}),
      ...(nivel && nivel !== "all" ? { NIVEL: nivel } : {}),
    }

    // Solo campos públicos. GYM_ID se selecciona para resolver el nombre del
    // gym origen, pero NO se devuelve crudo en la respuesta.
    const routines = await Rutina.find(filter)
      .select(
        "ID NOMBRE DESCRIPCION NIVEL DIFICULTAD DURACION DIAS_SEMANA DIAS ORIGEN_NOMBRE GYM_ID"
      )
      .sort({ FECHA_MODIFICACION: -1 })
      .lean()

    // Resolver nombre legible del gym origen para cada rutina.
    const slugs = [...new Set(routines.map((r) => r.GYM_ID).filter(Boolean))]
    const names = await resolveGymNames(slugs)

    // Mapear a campos públicos, descartando GYM_ID crudo del gym origen.
    const result = routines.map((r) => ({
      _id: r._id,
      ID: r.ID,
      NOMBRE: r.NOMBRE,
      DESCRIPCION: r.DESCRIPCION,
      NIVEL: r.NIVEL,
      DIFICULTAD: r.DIFICULTAD,
      DURACION: r.DURACION,
      DIAS_SEMANA: r.DIAS_SEMANA,
      DIAS: r.DIAS,
      // Atribución: nombre legible resuelto (preferido) o el que ya traía.
      ORIGEN_NOMBRE: names[r.GYM_ID] || r.ORIGEN_NOMBRE || "",
    }))

    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
