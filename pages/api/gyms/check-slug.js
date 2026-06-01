import dbConnect from "@/utils/mongoose"
import Gym from "@/models/Gym"

const RESERVED_SLUGS = ['limefit', 'level']

// Verificación de slug en vivo para el formulario de alta.
// GET /api/gyms/check-slug?slug=<x> -> { available, reason? }
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const slug = String(req.query.slug || "").toLowerCase()

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(200).json({ available: false, reason: "invalid" })
  }

  if (RESERVED_SLUGS.includes(slug)) {
    return res.status(200).json({ available: false, reason: "reserved" })
  }

  try {
    await dbConnect()
    const existing = await Gym.findOne({ SLUG: slug }).lean()
    if (existing) {
      return res.status(200).json({ available: false, reason: "taken" })
    }
    return res.status(200).json({ available: true })
  } catch (error) {
    console.error("check-slug error:", error)
    return res.status(500).json({ error: "Error al verificar slug" })
  }
}
