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
    logo: null, // sin imagen → usa el wordmark de texto + ícono
    pageTitle: 'LimeFit',
    dark: false,
    fonts: null, // null → stack de sistema por defecto (sin cambios)
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
    subtitle: 'Sistema de Gestión de Gimnasio',
    registerSubtitle: 'Crear nueva cuenta',
    copyright: 'Level Gym © 2026',
    basePath: '/level',
    gymId: 'level',
    favicon: '/tenants/level/favicon.ico',
    logo: '/tenants/level/logo.png', // wordmark LEVELGYM (reemplaza ícono + texto)
    pageTitle: 'Level Gym',
    dark: true,
    // Tipografía del sitio levelgym.com.ar: Bebas Neue (títulos, display
    // condensada, uppercase) + Rajdhani (cuerpo y UI, sans técnica). Se cargan
    // desde Google Fonts y se inyectan como --font-heading / --font-body.
    fonts: {
      heading: "'Bebas Neue', sans-serif",
      body: "'Rajdhani', ui-sans-serif, system-ui, sans-serif",
      googleHref:
        'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap',
    },
    // Paleta extraída de levelgym.com.ar/level/ (negro neutro + rojo de marca):
    // --level-primary-red #da100c, --level-accent #ff4757, --level-bg-dark #0a0a0a,
    // superficies #111/#1a1a1a, texto #fff / gris #b3b3b3.
    theme: {
      primary: '1 90% 45%', // #da100c
      'primary-foreground': '0 0% 100%',
      accent: '0 0% 15%', // hover/focus sutil (no el rojo, para no saturar)
      'accent-foreground': '0 0% 98%',
      ring: '1 90% 45%',
      background: '0 0% 4%', // #0a0a0a
      foreground: '0 0% 98%',
      card: '0 0% 7%', // #121212
      'card-foreground': '0 0% 98%',
      popover: '0 0% 7%',
      'popover-foreground': '0 0% 98%',
      secondary: '0 0% 15%',
      'secondary-foreground': '0 0% 98%',
      muted: '0 0% 15%',
      'muted-foreground': '0 0% 70%', // #b3b3b3
      border: '0 0% 15%',
      input: '0 0% 15%',
    },
  },
}

module.exports = { tenants }
