/** @type {import('next').NextConfig} */
const { tenants } = require('./config/tenants')

const activeId = process.env.TENANT || 'level'
const tenant = tenants[activeId] || tenants.level

const nextConfig = {
  reactStrictMode: true,
  basePath: tenant.basePath,
  // Expone el tenant activo al bundle del cliente, garantizando que server y
  // cliente resuelvan el mismo tenant aunque .env solo defina TENANT.
  env: {
    NEXT_PUBLIC_TENANT: tenant.id,
  },
}

module.exports = nextConfig
