// Helper de resolución de branding ADITIVO (Fase 5.1 SaaS multi-gym).
//
// Combina dos planos que conviven:
//   1) Registro ESTÁTICO build-time (config/tenants.js) -> limefit / level.
//   2) DB (models/Gym.js) -> gyms nuevos self-service.
//
// Convivencia (precedencia): estáticos PRIMERO. Si el slug es estático
// (limefit/level) se devuelve el tenant estático y NUNCA se consulta la DB.
// Solo si no es estático se consulta la colección `gyms`.
//
// resolveBranding() es ASYNC y SERVER-ONLY (usa Mongoose). Debe invocarse SOLO
// desde getServerSideProps o API routes (runtime). NUNCA importarse desde
// next.config.js (build-time, síncrono) ni desde el bundle de cliente.
//
// La salida tiene la MISMA forma que _document.js consume para activeTenant:
//   { id, name, theme, fonts, dark, logo, favicon, basePath, source }

import { tenants } from "@/config/tenants"
import { isStaticTenant } from "@/config/tenant"

// Defaults estilo LimeFit (verde lima) — alineados con el subdoc TEMA del modelo
// Gym, para que un gym de DB sin tema configurado se vea bien igualmente.
export const DEFAULT_THEME = {
  primary: "84 81% 44%",
  "primary-foreground": "0 0% 100%",
  accent: "84 81% 44%",
  "accent-foreground": "0 0% 100%",
  ring: "84 81% 44%",
}

// Construye `theme` solo con claves presentes y no vacías, replicando el
// comportamiento de limefit (que define pocas) y dejando que el resto caiga a
// los defaults de styles/globals.css.
function cleanTheme(tema) {
  const out = {}
  if (!tema) return out
  // Soporta tanto un objeto plano (lean) como un subdoc de Mongoose.
  const src = typeof tema.toObject === "function" ? tema.toObject() : tema
  for (const [k, v] of Object.entries(src)) {
    if (v === undefined || v === null) continue
    if (typeof v === "string" && v.trim() === "") continue
    if (k === "_id" || k === "__v") continue // campos internos de Mongoose
    out[k] = v
  }
  return out
}

// SÍNCRONO — solo estáticos. Seguro en cualquier contexto (cliente/server/build).
// Devuelve null si el slug no es estático.
export function getStaticBranding(slug) {
  const id = String(slug || "").toLowerCase()
  if (!isStaticTenant(id)) return null
  const t = tenants[id]
  return {
    id: t.id,
    name: t.name,
    theme: { ...t.theme },
    fonts: t.fonts || null,
    dark: Boolean(t.dark),
    logo: t.logo || null,
    favicon: t.favicon || null,
    basePath: t.basePath || "",
    source: "static",
  }
}

// ASYNC, SERVER-ONLY — combina estáticos + DB. Requiere dbConnect().
// 1) si getStaticBranding(slug) != null -> lo devuelve (NO toca DB).
// 2) si no -> dbConnect() + Gym.findOne({ SLUG, ACTIVO: true }).
// 3) si no existe el gym -> devuelve null (la página hace notFound).
export async function resolveBranding(slug) {
  const id = String(slug || "").toLowerCase()

  // 1) Estáticos primero: nunca tocan la DB.
  const staticBranding = getStaticBranding(id)
  if (staticBranding) return staticBranding

  // 2) Gym de DB. Imports dinámicos server-only para no arrastrar Mongoose al
  //    grafo de módulos hasta que realmente se consulta la DB.
  const { default: dbConnect } = await import("@/utils/mongoose")
  const { default: Gym } = await import("@/models/Gym")

  await dbConnect()
  const gym = await Gym.findOne({ SLUG: id, ACTIVO: true }).lean()
  if (!gym) return null

  const theme = cleanTheme(gym.TEMA)

  return {
    id: gym.SLUG,
    name: gym.NOMBRE,
    description: gym.DESCRIPCION || "",
    // Si el gym no definió ningún valor de tema, caemos a los defaults LimeFit
    // para garantizar un branding mínimo coherente.
    theme: Object.keys(theme).length > 0 ? theme : { ...DEFAULT_THEME },
    fonts: gym.FONTS || null,
    dark: Boolean(gym.DARK),
    logo: gym.LOGO || null,
    favicon: gym.FAVICON || null,
    // Gyms de DB viven DENTRO del basePath del deploy host -> sin basePath propio.
    basePath: "",
    source: "db",
  }
}
