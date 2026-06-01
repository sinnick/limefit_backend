import Head from "next/head"

// GymBranding — inyección RUNTIME del branding de un gym de DB ENCIMA de
// _document.js (Fase 5.1 SaaS multi-gym).
//
// _document.js no puede ser async, así que sigue inyectando el theme de
// activeTenant (estático). Para un gym de DB, este componente emite un <style>
// con las variables CSS de `branding.theme` usando `!important`, lo que PISA las
// variables que _document.js puso para activeTenant — sin tocar _document.js.
//
// Recibe el objeto `branding` producido por utils/branding.js (resolveBranding).
// Las páginas /g/[slug]/* lo renderizan y envuelven su contenido en
// <div className={branding.dark ? 'dark' : ''}> (ver más abajo `wrapClassName`).
//
// Uso típico en una página:
//   <GymBranding branding={branding} />
//   <div className={GymBranding.wrapClassName(branding)}> ...contenido... </div>

export default function GymBranding({ branding }) {
  if (!branding) return null

  const theme = branding.theme || {}
  let vars = Object.entries(theme)
    .map(([k, v]) => `--${k}: ${v} !important;`)
    .join("")

  // Fuentes del gym (si las define): se exponen como --font-heading /
  // --font-body, igual que en _document.js para los tenants estáticos.
  if (branding.fonts) {
    if (branding.fonts.heading) {
      vars += `--font-heading: ${branding.fonts.heading} !important;`
    }
    if (branding.fonts.body) {
      vars += `--font-body: ${branding.fonts.body} !important;`
    }
  }

  // Aplica a :root y .dark para que valga tanto en modo claro como oscuro.
  const themeCss = `:root{${vars}}.dark{${vars}}`

  const googleHref = branding.fonts?.googleHref

  return (
    <Head>
      {branding.favicon && <link rel="icon" href={branding.favicon} />}
      {googleHref && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="stylesheet" href={googleHref} />
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
    </Head>
  )
}

// Helper para el contenedor raíz de la página. _document.js fija la clase del
// <Html>; no podemos cambiarla en runtime. Tailwind usa darkMode:["class"], así
// que basta con poner la clase `dark` en un ancestro del contenido del gym para
// activar el tema oscuro en ese subárbol.
GymBranding.wrapClassName = function wrapClassName(branding) {
  if (!branding) return ""
  return branding.dark ? "dark" : ""
}
