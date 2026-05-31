import { Html, Head, Main, NextScript } from 'next/document'
import { activeTenant } from '@/config/tenant'

export default function Document() {
  const t = activeTenant
  // Inyecta las variables HSL del tenant en :root y .dark (gana en ambos
  // selectores). Sobreescribe los defaults de styles/globals.css.
  const vars = Object.entries(t.theme)
    .map(([k, v]) => `--${k}: ${v};`)
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
