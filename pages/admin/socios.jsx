import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { apiPath } from "@/config/tenant"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MetricLineChart } from "@/components/admin/Charts"
import { useToast } from "@/hooks/use-toast"
import { Search, Activity, Trophy, Dumbbell, LineChart, User, UserPlus } from "lucide-react"

// 3.3 + 3.6 — Panel de progreso por socio.
// Buscador de socio (DNI o nombre) → fetch a /api/admin/progreso?dni= y
// /api/admin/adherencia?dni=. Tabs: Adherencia / Records / Workouts / Métricas.
export default function SociosPage() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selected, setSelected] = useState(null) // socio elegido (objeto Usuario)
  const [progreso, setProgreso] = useState(null)
  const [adherencia, setAdherencia] = useState(null)
  const [loadingData, setLoadingData] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ DNI: "", NOMBRE: "", APELLIDO: "", EMAIL: "" })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Alta de socio: usuario de la app (login solo-DNI), sin USUARIO ni PASSWORD.
  // Reutiliza POST /api/admin/users, que setea ADMIN:false, HABILITADO:true y el
  // GYM_ID del tenant.
  async function handleCreate(e) {
    e.preventDefault()
    const dni = parseInt(String(form.DNI).trim(), 10)
    if (!dni || !form.NOMBRE.trim()) {
      toast({
        title: "Faltan datos",
        description: "El DNI y el nombre son obligatorios",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(apiPath("/api/admin/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          DNI: dni,
          NOMBRE: form.NOMBRE.trim(),
          APELLIDO: form.APELLIDO.trim(),
          EMAIL: form.EMAIL.trim(),
          ADMIN: false,
          ROL: "usuario",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo crear el socio")
      toast({
        title: "Socio creado",
        description: `${data.NOMBRE} ${data.APELLIDO || ""} — DNI ${data.DNI}. Ya puede entrar a la app con su DNI.`,
      })
      setUsers((prev) => [...prev, data])
      setForm({ DNI: "", NOMBRE: "", APELLIDO: "", EMAIL: "" })
      setDialogOpen(false)
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch(apiPath("/api/admin/users"))
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : [])
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los socios",
          variant: "destructive",
        })
      }
    }
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSelect(user) {
    setSelected(user)
    setSearchTerm("")
    setLoadingData(true)
    setProgreso(null)
    setAdherencia(null)
    try {
      const [progRes, adhRes] = await Promise.all([
        fetch(apiPath(`/api/admin/progreso?dni=${user.DNI}`)),
        fetch(apiPath(`/api/admin/adherencia?dni=${user.DNI}`)),
      ])
      const progData = await progRes.json()
      const adhData = await adhRes.json()
      if (!progRes.ok) throw new Error(progData.error || "Error al cargar progreso")
      if (!adhRes.ok) throw new Error(adhData.error || "Error al cargar adherencia")
      setProgreso(progData)
      setAdherencia(adhData)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const filteredUsers = searchTerm
    ? users
        .filter(
          (u) =>
            u.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.APELLIDO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.DNI?.toString().includes(searchTerm)
        )
        .slice(0, 8)
    : []

  // Serie de métricas para el chart de evolución de peso.
  const metricasChart = (progreso?.metricas || [])
    .filter((m) => m.PESO != null)
    .map((m) => ({
      label: formatDate(m.FECHA),
      value: m.PESO,
    }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Socios</h1>
            <p className="text-muted-foreground">
              Alta de socios, progreso y adherencia
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" /> Nuevo socio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo socio</DialogTitle>
                <DialogDescription>
                  Se da de alta un usuario de la app. Entra solo con su DNI (sin contraseña).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="socio-dni">DNI *</Label>
                  <Input
                    id="socio-dni"
                    inputMode="numeric"
                    placeholder="Ej. 40123456"
                    value={form.DNI}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, DNI: e.target.value.replace(/\D/g, "") }))
                    }
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="socio-nombre">Nombre *</Label>
                    <Input
                      id="socio-nombre"
                      placeholder="Nombre"
                      value={form.NOMBRE}
                      onChange={(e) => setForm((f) => ({ ...f, NOMBRE: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socio-apellido">Apellido</Label>
                    <Input
                      id="socio-apellido"
                      placeholder="Apellido"
                      value={form.APELLIDO}
                      onChange={(e) => setForm((f) => ({ ...f, APELLIDO: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socio-email">Email (opcional)</Label>
                  <Input
                    id="socio-email"
                    type="email"
                    placeholder="socio@email.com"
                    value={form.EMAIL}
                    onChange={(e) => setForm((f) => ({ ...f, EMAIL: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Crear socio"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Buscador de socio */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar socio por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
          {filteredUsers.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
              {filteredUsers.map((u) => (
                <button
                  key={u.DNI}
                  onClick={() => handleSelect(u)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted/60 transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">
                    {u.NOMBRE} {u.APELLIDO}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    DNI: {u.DNI}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Estado vacío */}
        {!selected && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                Buscá un socio para ver su progreso y adherencia
              </p>
            </CardContent>
          </Card>
        )}

        {/* Socio seleccionado */}
        {selected && (
          <>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-full bg-primary/20 p-3">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {selected.NOMBRE} {selected.APELLIDO}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    DNI: {selected.DNI}
                    {selected.EMAIL ? ` • ${selected.EMAIL}` : ""}
                  </p>
                </div>
              </CardContent>
            </Card>

            {loadingData ? (
              <div className="text-center py-12 text-muted-foreground">
                Cargando datos del socio...
              </div>
            ) : (
              <Tabs defaultValue="adherencia" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="adherencia">
                    <Activity className="mr-2 h-4 w-4" /> Adherencia
                  </TabsTrigger>
                  <TabsTrigger value="records">
                    <Trophy className="mr-2 h-4 w-4" /> Records
                  </TabsTrigger>
                  <TabsTrigger value="workouts">
                    <Dumbbell className="mr-2 h-4 w-4" /> Workouts
                  </TabsTrigger>
                  <TabsTrigger value="metricas">
                    <LineChart className="mr-2 h-4 w-4" /> Métricas
                  </TabsTrigger>
                </TabsList>

                {/* ── Adherencia (3.6) ─────────────────────────────── */}
                <TabsContent value="adherencia" className="space-y-4">
                  {adherencia ? (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Adherencia global</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <ProgressBar value={adherencia.global.porcentaje} />
                          <p className="text-sm text-muted-foreground">
                            {adherencia.global.completados} de{" "}
                            {adherencia.global.esperados} entrenamientos esperados
                          </p>
                        </CardContent>
                      </Card>

                      {adherencia.porRutina.length === 0 ? (
                        <EmptyCard message="No tiene rutinas activas asignadas" />
                      ) : (
                        <div className="grid gap-3">
                          {adherencia.porRutina.map((r) => (
                            <Card key={r.RUTINA_ID}>
                              <CardContent className="py-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold">
                                    {r.RUTINA_NOMBRE}
                                  </h3>
                                  <span className="text-sm text-muted-foreground">
                                    {r.diasPorSemana} días/semana
                                  </span>
                                </div>
                                <ProgressBar value={r.porcentaje} />
                                <p className="text-sm text-muted-foreground">
                                  {r.completados} / {r.esperados} • desde{" "}
                                  {formatDate(r.FECHA_INICIO)}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyCard message="Sin datos de adherencia" />
                  )}
                </TabsContent>

                {/* ── Records (3.3) ────────────────────────────────── */}
                <TabsContent value="records">
                  {progreso?.records?.length ? (
                    <div className="grid gap-2">
                      {progreso.records.map((rec) => (
                        <Card key={rec._id}>
                          <CardContent className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rec.EJERCICIO}</span>
                              {rec.ES_RECORD && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                                  PR
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {rec.PESO != null ? `${rec.PESO} kg` : ""}
                              {rec.REPS != null ? ` × ${rec.REPS}` : ""}
                              {" • "}
                              {formatDate(rec.FECHA)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyCard message="Sin records" />
                  )}
                </TabsContent>

                {/* ── Workouts (3.3) ───────────────────────────────── */}
                <TabsContent value="workouts">
                  {progreso?.workouts?.length ? (
                    <div className="grid gap-2">
                      {progreso.workouts.map((w) => (
                        <Card key={w._id}>
                          <CardContent className="py-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {w.RUTINA_NOMBRE || "Workout"}
                                {w.DIA_NOMBRE ? ` — ${w.DIA_NOMBRE}` : ""}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(w.FECHA)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {w.DURACION != null ? `${w.DURACION} min` : ""}
                              {w.VOLUMEN_TOTAL != null
                                ? ` • Vol: ${w.VOLUMEN_TOTAL}`
                                : ""}
                              {w.PRS_LOGRADOS
                                ? ` • ${w.PRS_LOGRADOS} PRs`
                                : ""}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyCard message="Sin workouts completados" />
                  )}
                </TabsContent>

                {/* ── Métricas (3.3) ───────────────────────────────── */}
                <TabsContent value="metricas" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolución de peso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MetricLineChart data={metricasChart} name="Peso (kg)" />
                    </CardContent>
                  </Card>

                  {progreso?.metricas?.length ? (
                    <div className="grid gap-2">
                      {progreso.metricas
                        .slice()
                        .reverse()
                        .map((m) => (
                          <Card key={m._id}>
                            <CardContent className="flex items-center justify-between py-3">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(m.FECHA)}
                              </span>
                              <div className="text-sm">
                                {m.PESO != null ? `${m.PESO} kg` : ""}
                                {m.PORCENTAJE_GRASA != null
                                  ? ` • ${m.PORCENTAJE_GRASA}% grasa`
                                  : ""}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <EmptyCard message="Sin métricas corporales" />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, value || 0))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{pct}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function EmptyCard({ message }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10 text-center text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  )
}

function formatDate(value) {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
