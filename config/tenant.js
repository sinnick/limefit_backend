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

module.exports = { activeTenant, apiPath, activeId }
