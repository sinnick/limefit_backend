import { Html, Head, Main, NextScript } from 'next/document'
import { activeTenant } from '@/config/tenant'

export default function Document() {
  const t = activeTenant
  // Inyecta las variables HSL del tenant en :root y .dark. Usa !important para
  // ganar siempre sobre styles/globals.css (que se carga DESPUÉS como <link> y,
  // con igual especificidad, pisaría estos valores por orden de cascada).
  const vars = Object.entries(t.theme)
    .map(([k, v]) => `--${k}: ${v} !important;`)
    .join('')
  const themeCss = `:root{${vars}}.dark{${vars}}`

  return (
    // Tailwind usa darkMode:["class"] → la clase .dark es la que activa el tema
    // oscuro (data-theme por sí solo no lo hacía).
    <Html lang="es" className={t.dark ? 'dark' : ''}>
      <Head>
        <link rel="icon" href={`${t.basePath}${t.favicon}`} />
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
