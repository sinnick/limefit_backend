import { Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import GymBranding from "@/components/GymBranding"
import { resolveBranding } from "@/utils/branding"

// Landing pública de un gym (Fase 5.1 SaaS multi-gym).
//
// Vive bajo /g/[slug] DENTRO del basePath del deploy host (ej. /level/g/<slug>).
// No agrega ningún basePath nuevo: next.config.js permanece intacto.
//
// El branding proviene de la DB (o del registro estático para limefit/level),
// resuelto en getServerSideProps. <GymBranding> inyecta el theme en runtime
// ENCIMA del de _document.js (con !important), por lo que las clases Tailwind
// (text-primary, bg-background, ...) leen el branding de ESTE gym.

export default function GymLanding({ branding }) {
  return (
    <div className={GymBranding.wrapClassName(branding)}>
      <GymBranding branding={branding} />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 text-foreground">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            {branding.logo ? (
              <img
                src={branding.logo}
                alt={branding.name}
                className="h-16 w-auto mx-auto mb-4"
              />
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Dumbbell className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 font-heading">
                  {branding.name}
                </h1>
              </>
            )}
            {branding.description ? (
              <p className="text-muted-foreground">{branding.description}</p>
            ) : (
              <p className="text-muted-foreground">
                Sistema de Gestión de Gimnasio
              </p>
            )}
          </div>

          {/* MVP aditivo: el panel operativo para gyms de DB (login + admin con
              GYM_ID resuelto en runtime) es la siguiente iteración. Evitamos un
              link a una ruta inexistente; mostramos el estado real. */}
          <Button className="w-full" disabled>
            Panel de gestión — próximamente
          </Button>

          <p className="mt-8 text-xs text-muted-foreground">
            {branding.name} © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ params }) {
  const branding = await resolveBranding(params.slug)
  if (!branding) {
    return { notFound: true }
  }
  // branding ya es un objeto plano serializable (sin _id de Mongoose, gracias a
  // .lean() + mapeo explícito en resolveBranding).
  return { props: { branding } }
}
