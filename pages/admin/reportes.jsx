import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import ExportButton from "@/components/admin/ExportButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, Calendar, ClipboardCheck, Activity } from "lucide-react"

// Centro de descargas CSV (Feature 3.7, CONTRACT-fase3.md §2 / §1.5).
// Una tarjeta por tipo. Reusa <ExportButton tipo=... /> que descarga vía blob().
export default function ReportesPage() {
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [dni, setDni] = useState("")

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Exportá los datos del gimnasio en formato CSV
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Usuarios */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Socios</CardTitle>
                  <CardDescription>
                    Listado completo de usuarios del gimnasio
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ExportButton tipo="usuarios" label="Descargar socios" />
            </CardContent>
          </Card>

          {/* Asignaciones */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Asignaciones</CardTitle>
                  <CardDescription>
                    Rutinas asignadas a cada socio
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ExportButton tipo="asignaciones" label="Descargar asignaciones" />
            </CardContent>
          </Card>

          {/* Asistencias */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Asistencias</CardTitle>
                  <CardDescription>
                    Check-ins en un rango de fechas (opcional)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="desde">Desde</Label>
                  <Input
                    id="desde"
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hasta">Hasta</Label>
                  <Input
                    id="hasta"
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                  />
                </div>
              </div>
              <ExportButton
                tipo="asistencias"
                params={{ desde, hasta }}
                label="Descargar asistencias"
              />
            </CardContent>
          </Card>

          {/* Progreso */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Progreso de socio</CardTitle>
                  <CardDescription>
                    Workouts completados de un socio (por DNI)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI del socio *</Label>
                <Input
                  id="dni"
                  type="number"
                  placeholder="Ej: 30123456"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>
              <ExportButton
                tipo="progreso"
                params={{ dni }}
                label="Descargar progreso"
                disabled={!dni}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
