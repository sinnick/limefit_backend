// Registro de tenants (white-label). Datos puros en CommonJS para poder
// require() desde next.config.js en build-time. Cada deploy selecciona un
// tenant con la env var TENANT (server) / NEXT_PUBLIC_TENANT (cliente).
//
// theme: valores HSL (sin la función hsl()) con los mismos nombres que las
// variables CSS de styles/globals.css. Se inyectan en _document.js y los
// consumen las clases Tailwind existentes (text-primary, bg-background, ...).

const tenants = {
  limefit: {
    id: 'limefit',
    name: 'LimeFit',
    // Logo bicolor: <span text-primary>{logoPrimary}</span>{logoRest}
    logoPrimary: 'LIME',
    logoRest: 'FIT',
    adminSuffix: ' Admin',
    subtitle: 'Sistema de Gestión de Gimnasio',
    registerSubtitle: 'Crear nueva cuenta',
    copyright: 'LimeFit Gym Management System © 2024',
    basePath: '/limefit',
    gymId: 'limefit',
    favicon: '/tenants/limefit/favicon.ico',
    pageTitle: 'LimeFit',
    dark: false,
    theme: {
      primary: '84 81% 44%',
      'primary-foreground': '0 0% 100%',
      accent: '84 81% 44%',
      'accent-foreground': '0 0% 100%',
      ring: '84 81% 44%',
    },
  },

  level: {
    id: 'level',
    name: 'Level Gym',
    logoPrimary: 'LEVEL',
    logoRest: '',
    adminSuffix: ' Admin',
    subtitle: 'PLACEHOLDER_SUBTITLE',
    registerSubtitle: 'Crear nueva cuenta',
    copyright: 'Level Gym © 2026',
    basePath: '/level',
    gymId: 'level',
    favicon: '/tenants/level/favicon.ico',
    pageTitle: 'Level Gym',
    dark: true,
    // PLACEHOLDER: reemplazar con la paleta extraída de levelgym.com.ar/level/
    theme: {
      primary: '84 81% 44%',
      'primary-foreground': '0 0% 100%',
      accent: '84 81% 44%',
      'accent-foreground': '0 0% 100%',
      ring: '84 81% 44%',
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      card: '240 10% 3.9%',
      'card-foreground': '0 0% 98%',
      border: '240 3.7% 15.9%',
      input: '240 3.7% 15.9%',
      muted: '240 3.7% 15.9%',
      'muted-foreground': '240 5% 64.9%',
      secondary: '240 3.7% 15.9%',
      'secondary-foreground': '0 0% 98%',
      popover: '240 10% 3.9%',
      'popover-foreground': '0 0% 98%',
    },
  },
}

module.exports = { tenants }
