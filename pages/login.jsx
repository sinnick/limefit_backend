import { useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      // Get CSRF token first
      const csrfRes = await fetch("/limefit/api/auth/csrf")
      const { csrfToken } = await csrfRes.json()

      // Call credentials callback directly
      const res = await fetch("/limefit/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          csrfToken,
          username: formData.username,
          password: formData.password,
          json: "true",
        }),
      })

      const data = await res.json()

      if (data.error) {
        toast({
          title: "Error de autenticación",
          description: "Usuario o contraseña incorrectos",
          variant: "destructive"
        })
      } else if (data.url) {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Redirigiendo..."
        })
        router.push("/admin")
      } else {
        // Check if session was created
        const sessionRes = await fetch("/limefit/api/auth/session")
        const session = await sessionRes.json()
        
        if (session?.user) {
          toast({
            title: "Inicio de sesión exitoso",
            description: "Redirigiendo..."
          })
          router.push("/admin")
        } else {
          toast({
            title: "Error",
            description: "No se pudo iniciar sesión",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al iniciar sesión",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span className="text-primary">LIME</span>FIT
          </h1>
          <p className="text-muted-foreground">
            Sistema de Gestión de Gimnasio
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario o DNI</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario o DNI"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            LimeFit Gym Management System © 2024
          </p>
        </div>
      </div>
    </div>
  )
}
