// Resolver del tenant activo. Funciona en server y cliente:
// - server: process.env.TENANT
// - cliente: NEXT_PUBLIC_TENANT (inlineado en build por next.config.js)
const { tenants } = require('./tenants')

const activeId =
  process.env.NEXT_PUBLIC_TENANT || process.env.TENANT || 'level'

const activeTenant = tenants[activeId] || tenants.level

// Prepende el basePath del tenant a rutas absolutas de la app (fetch, signIn).
// next/link y router ya aplican basePath automáticamente; esto es para fetch().
function apiPath(path) {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${activeTenant.basePath}${clean}`
}

// ADICIÓN aditiva (Fase 5.1 SaaS): helper síncrono y puro que indica si un slug
// corresponde a un tenant ESTÁTICO (build-time: limefit/level). No introduce
// Mongoose ni async, no afecta el build. Lo reusan el endpoint de registro
// (slugs reservados) y el helper utils/branding.js (estáticos primero).
// NO modifica activeTenant/apiPath/activeId: el comportamiento de los tenants
// estáticos queda byte-idéntico.
function isStaticTenant(slug) {
  return Boolean(tenants[String(slug || '').toLowerCase()])
}

module.exports = { activeTenant, apiPath, activeId, isStaticTenant }
