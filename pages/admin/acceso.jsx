import { useState, useEffect, useCallback } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { apiPath } from "@/config/tenant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { LogIn, Search, RefreshCw, Users } from "lucide-react"
import ExportButton from "@/components/admin/ExportButton"

// 4.2 — Control de acceso (CONTRACT-fase4 §6.1).
// Sub-tabs: "Historial" (check-ins con filtros fecha/dni/nombre + export CSV)
// y "Aforo" (ocupación de hoy vs capacidad). Consume /api/admin/acceso y
// /api/admin/acceso/aforo. Reusa el modelo Asistencia (no crea modelo nuevo).

const METODO_LABEL = {
  qr: "QR",
  dni: "DNI",
  manual: "Manual",
}

function formatFecha(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d)) return "—"
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatHora(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d)) return "—"
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AccesoPage() {
  const { toast } = useToast()

  // Historial
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [dni, setDni] = useState("")
  const [q, setQ] = useState("")

  // Aforo
  const [aforo, setAforo] = useState(null)
  const [aforoLoading, setAforoLoading] = useState(true)
  const [capacidadInput, setCapacidadInput] = useState("")

  const fetchCheckins = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      if (dni.trim()) params.set("dni", dni.trim())
      if (q.trim()) params.set("q", q.trim())
      const qs = params.toString()
      const res = await fetch(apiPath(`/api/admin/acceso${qs ? `?${qs}` : ""}`))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar asistencias")
      setCheckins(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setCheckins([])
    } finally {
      setLoading(false)
    }
  }, [desde, hasta, dni, q, toast])

  const fetchAforo = useCallback(async () => {
    setAforoLoading(true)
    try {
      const params = new URLSearchParams()
      if (capacidadInput.trim()) params.set("capacidad", capacidadInput.trim())
      const qs = params.toString()
      const res = await fetch(
        apiPath(`/api/admin/acceso/aforo${qs ? `?${qs}` : ""}`)
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar aforo")
      setAforo(data)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setAforo(null)
    } finally {
      setAforoLoading(false)
    }
  }, [capacidadInput, toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCheckins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAforo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleBuscar(e) {
    e.preventDefault()
    fetchCheckins()
  }

  function handleLimpiar() {
    setDesde("")
    setHasta("")
    setDni("")
    setQ("")
    // fetch tras limpiar via microtask para tomar el estado vacío
    setTimeout(() => fetchCheckins(), 0)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Acceso</h1>
            <p className="text-muted-foreground">
              Historial de asistencias y aforo del gimnasio
            </p>
          </div>
        </div>

        <Tabs defaultValue="historial" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
            <TabsTrigger value="historial">
              <LogIn className="mr-2 h-4 w-4" /> Historial
            </TabsTrigger>
            <TabsTrigger value="aforo">
              <Users className="mr-2 h-4 w-4" /> Aforo
            </TabsTrigger>
          </TabsList>

          {/* ----------------------- HISTORIAL ----------------------- */}
          <TabsContent value="historial" className="space-y-4">
            <form
              onSubmit={handleBuscar}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
            >
              <div className="space-y-1">
                <Label htmlFor="desde">Desde</Label>
                <Input
                  id="desde"
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hasta">Hasta</Label>
                <Input
                  id="hasta"
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  inputMode="numeric"
                  placeholder="DNI exacto"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="q">Socio</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="q"
                    placeholder="Nombre o apellido"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Search className="mr-2 h-4 w-4" /> Buscar
                </Button>
                <Button type="button" variant="outline" onClick={handleLimpiar}>
                  Limpiar
                </Button>
              </div>
            </form>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Cargando..."
                  : `${checkins.length} check-in${checkins.length === 1 ? "" : "s"}`}
              </p>
              <ExportButton
                tipo="asistencias"
                params={{ desde, hasta, dni: dni.trim() }}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                Exportar CSV
              </ExportButton>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Cargando asistencias...
              </div>
            ) : checkins.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <LogIn className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-center">
                    No hay asistencias para los filtros seleccionados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DNI</TableHead>
                        <TableHead>Socio</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkins.map((c) => (
                        <TableRow key={c._id}>
                          <TableCell className="font-medium">{c.DNI}</TableCell>
                          <TableCell>
                            {[c.NOMBRE, c.APELLIDO].filter(Boolean).join(" ") ||
                              "—"}
                          </TableCell>
                          <TableCell>{formatFecha(c.FECHA)}</TableCell>
                          <TableCell>{formatHora(c.HORA_CHECKIN)}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              {METODO_LABEL[c.METODO] || c.METODO || "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ------------------------- AFORO ------------------------- */}
          <TabsContent value="aforo" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-1">
                <Label htmlFor="capacidad">Capacidad máxima</Label>
                <Input
                  id="capacidad"
                  inputMode="numeric"
                  placeholder="(opcional)"
                  value={capacidadInput}
                  onChange={(e) => setCapacidadInput(e.target.value)}
                  className="sm:w-48"
                />
              </div>
              <Button type="button" onClick={fetchAforo} disabled={aforoLoading}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${aforoLoading ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Aforo de hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aforoLoading ? (
                  <p className="text-muted-foreground">Cargando aforo...</p>
                ) : !aforo ? (
                  <p className="text-muted-foreground">Sin datos de aforo</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        {aforo.ocupacion}
                      </span>
                      <span className="text-muted-foreground">
                        {aforo.capacidad != null
                          ? `/ ${aforo.capacidad} personas`
                          : "personas hoy"}
                      </span>
                    </div>

                    {aforo.capacidad != null && (
                      <>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (aforo.porcentaje || 0) >= 100
                                ? "bg-red-500"
                                : (aforo.porcentaje || 0) >= 80
                                ? "bg-amber-500"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(100, aforo.porcentaje || 0)}%`,
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {aforo.porcentaje}% de ocupación
                        </p>
                      </>
                    )}

                    {aforo.capacidad == null && (
                      <p className="text-sm text-muted-foreground">
                        Defina una capacidad máxima para ver el porcentaje de
                        ocupación.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              El aforo se calcula como la cantidad de check-ins registrados hoy
              (el sistema no modela salida del gimnasio).
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
