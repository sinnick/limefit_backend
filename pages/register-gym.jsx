import { useState } from "react"
import Link from "next/link"
import { Dumbbell, Loader2, Building2, UserPlus, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { activeTenant, apiPath } from "@/config/tenant"

const SLUG_REGEX = /^[a-z0-9-]+$/

export default function RegisterGym() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [formData, setFormData] = useState({
    slug: "",
    nombre: "",
    email: "",
    telefono: "",
    admin_nombre: "",
    admin_apellido: "",
    admin_dni: "",
    admin_usuario: "",
    admin_password: "",
    admin_confirmPassword: "",
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const slug = formData.slug.toLowerCase().trim()

    if (!SLUG_REGEX.test(slug)) {
      toast({
        title: "Error",
        description: "El identificador (slug) solo puede contener letras minúsculas, números y guiones",
        variant: "destructive",
      })
      return
    }

    if (formData.admin_password !== formData.admin_confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (formData.admin_password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch(apiPath("/api/gyms/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          admin_dni: formData.admin_dni,
          admin_usuario: formData.admin_usuario,
          admin_password: formData.admin_password,
          admin_nombre: formData.admin_nombre,
          admin_apellido: formData.admin_apellido,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al registrar el gimnasio")
      }

      toast({
        title: "¡Gimnasio registrado!",
        description: "Tu gimnasio ha sido creado correctamente.",
      })

      setSuccess({
        slug: data.gym?.slug || slug,
        nombre: data.gym?.nombre || formData.nombre,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>¡Gimnasio creado!</CardTitle>
              <CardDescription>
                {success.nombre} está listo. Ya puedes acceder a tu gimnasio e iniciar sesión con tu cuenta de administrador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Identificador</p>
                <p className="font-mono text-sm font-medium">{success.slug}</p>
              </div>

              <Button asChild className="w-full">
                <Link href={`/g/${success.slug}`}>
                  Ir a mi gimnasio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href={`/g/${success.slug}/login`}>
                  Iniciar sesión
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          {activeTenant.logo ? (
            <img
              src={apiPath(activeTenant.logo)}
              alt={activeTenant.name}
              className="h-14 w-auto mx-auto mb-4"
            />
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Dumbbell className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                <span className="text-primary">{activeTenant.logoPrimary}</span>{activeTenant.logoRest}
              </h1>
            </>
          )}
          <p className="text-muted-foreground">Crea tu gimnasio y empieza a gestionarlo hoy</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Registrar Gimnasio
            </CardTitle>
            <CardDescription>
              Completa los datos de tu gimnasio y de tu cuenta de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos del Gimnasio */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  Datos del Gimnasio
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del gimnasio</Label>
                  <Input
                    id="nombre"
                    placeholder="Gym Fuerte"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Identificador (slug)</Label>
                  <Input
                    id="slug"
                    placeholder="gym-fuerte"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Solo minúsculas, números y guiones. Será la URL de tu gimnasio: /g/{formData.slug || "tu-slug"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contacto@gym.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono (opcional)</Label>
                    <Input
                      id="telefono"
                      placeholder="11 1234-5678"
                      value={formData.telefono}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Administrador Principal */}
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground pt-2">
                  <UserPlus className="w-4 h-4" />
                  Administrador Principal
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_nombre">Nombre</Label>
                    <Input
                      id="admin_nombre"
                      placeholder="Juan"
                      required
                      value={formData.admin_nombre}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_apellido">Apellido</Label>
                    <Input
                      id="admin_apellido"
                      placeholder="Pérez"
                      required
                      value={formData.admin_apellido}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_dni">DNI</Label>
                  <Input
                    id="admin_dni"
                    type="number"
                    placeholder="12345678"
                    required
                    value={formData.admin_dni}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_usuario">Nombre de usuario</Label>
                  <Input
                    id="admin_usuario"
                    placeholder="juanperez"
                    required
                    value={formData.admin_usuario}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_password">Contraseña</Label>
                    <Input
                      id="admin_password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      required
                      value={formData.admin_password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_confirmPassword">Confirmar</Label>
                    <Input
                      id="admin_confirmPassword"
                      type="password"
                      placeholder="Repetir contraseña"
                      required
                      value={formData.admin_confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando gimnasio...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Crear gimnasio
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
