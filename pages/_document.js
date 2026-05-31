import { Html, Head, Main, NextScript } from 'next/document'
import { activeTenant } from '@/config/tenant'

export default function Document() {
  const t = activeTenant
  // Inyecta las variables HSL del tenant en :root y .dark. Usa !important para
  // ganar siempre sobre styles/globals.css (que se carga DESPUÉS como <link> y,
  // con igual especificidad, pisaría estos valores por orden de cascada).
  let vars = Object.entries(t.theme)
    .map(([k, v]) => `--${k}: ${v} !important;`)
    .join('')
  // Fuentes del tenant (si las define): se exponen como --font-heading /
  // --font-body, que tailwind.config.js mapea a font-heading / font-sans.
  if (t.fonts) {
    vars += `--font-heading: ${t.fonts.heading} !important;`
    vars += `--font-body: ${t.fonts.body} !important;`
  }
  const themeCss = `:root{${vars}}.dark{${vars}}`

  return (
    // Tailwind usa darkMode:["class"] → la clase .dark es la que activa el tema
    // oscuro (data-theme por sí solo no lo hacía). La clase theme-<id> permite
    // reglas estéticas scoped por tenant (ej. títulos uppercase de Level).
    <Html lang="es" className={`theme-${t.id}${t.dark ? ' dark' : ''}`}>
      <Head>
        <link rel="icon" href={`${t.basePath}${t.favicon}`} />
        {t.fonts?.googleHref && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link rel="stylesheet" href={t.fonts.googleHref} />
          </>
        )}
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
