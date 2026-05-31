import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { apiPath } from "@/config/tenant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Search, CreditCard, DollarSign } from "lucide-react"

const EMPTY_PLAN = {
  NOMBRE: "",
  PRECIO: "",
  DURACION_DIAS: "",
  DESCRIPCION: "",
  ACTIVO: true,
}

const EMPTY_ASIGNAR = {
  DNI: "",
  PLAN_ID: "",
  FECHA_INICIO: "",
}

const EMPTY_PAGO = {
  MONTO: "",
  METODO: "efectivo",
  FECHA: "",
  NOTAS: "",
}

function fmtFecha(d) {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return "—"
  }
}

const ESTADO_BADGE = {
  al_dia: "bg-green-500/20 text-green-600",
  vencido: "bg-red-500/20 text-red-600",
  suspendida: "bg-amber-500/20 text-amber-600",
}

const ESTADO_LABEL = {
  al_dia: "Al día",
  vencido: "Vencido",
  suspendida: "Suspendida",
}

export default function MembresiasPage() {
  const { toast } = useToast()

  // ── Planes ────────────────────────────────────────────────────────────────
  const [planes, setPlanes] = useState([])
  const [planSearch, setPlanSearch] = useState("")
  const [planDialog, setPlanDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planForm, setPlanForm] = useState(EMPTY_PLAN)

  // ── Membresías ──────────────────────────────────────────────────────────────
  const [membresias, setMembresias] = useState([])
  const [memSearch, setMemSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [asignarDialog, setAsignarDialog] = useState(false)
  const [asignarForm, setAsignarForm] = useState(EMPTY_ASIGNAR)
  const [pagoDialog, setPagoDialog] = useState(false)
  const [pagoTarget, setPagoTarget] = useState(null)
  const [pagoForm, setPagoForm] = useState(EMPTY_PAGO)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlanes()
    fetchMembresias()
  }, [])

  async function fetchPlanes() {
    try {
      const res = await fetch(apiPath("/api/admin/planes"))
      const data = await res.json()
      setPlanes(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los planes", variant: "destructive" })
    }
  }

  async function fetchMembresias() {
    try {
      const res = await fetch(apiPath("/api/admin/membresias"))
      const data = await res.json()
      setMembresias(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las membresías", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // ── Planes handlers ─────────────────────────────────────────────────────────
  function openPlanDialog(plan = null) {
    if (plan) {
      setEditingPlan(plan)
      setPlanForm({
        NOMBRE: plan.NOMBRE || "",
        PRECIO: plan.PRECIO ?? "",
        DURACION_DIAS: plan.DURACION_DIAS ?? "",
        DESCRIPCION: plan.DESCRIPCION || "",
        ACTIVO: plan.ACTIVO !== undefined ? plan.ACTIVO : true,
      })
    } else {
      setEditingPlan(null)
      setPlanForm(EMPTY_PLAN)
    }
    setPlanDialog(true)
  }

  async function submitPlan(e) {
    e.preventDefault()
    try {
      const method = editingPlan ? "PUT" : "POST"
      const body = editingPlan ? { ...planForm, _id: editingPlan._id } : planForm
      const res = await fetch(apiPath("/api/admin/planes"), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar plan")
      toast({ title: "Éxito", description: `Plan ${editingPlan ? "actualizado" : "creado"}` })
      setPlanDialog(false)
      fetchPlanes()
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  async function deletePlan(plan) {
    if (!confirm(`¿Eliminar el plan "${plan.NOMBRE}"?`)) return
    try {
      const res = await fetch(apiPath(`/api/admin/planes?id=${plan._id}`), { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error al eliminar")
      }
      toast({ title: "Éxito", description: "Plan eliminado" })
      fetchPlanes()
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // ── Membresías handlers ──────────────────────────────────────────────────────
  function openAsignarDialog() {
    setAsignarForm(EMPTY_ASIGNAR)
    setAsignarDialog(true)
  }

  async function submitAsignar(e) {
    e.preventDefault()
    try {
      const body = {
        DNI: asignarForm.DNI,
        PLAN_ID: asignarForm.PLAN_ID,
      }
      if (asignarForm.FECHA_INICIO) body.FECHA_INICIO = asignarForm.FECHA_INICIO
      const res = await fetch(apiPath("/api/admin/membresias"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al asignar membresía")
      toast({ title: "Éxito", description: "Membresía asignada" })
      setAsignarDialog(false)
      fetchMembresias()
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  function openPagoDialog(membresia) {
    setPagoTarget(membresia)
    setPagoForm(EMPTY_PAGO)
    setPagoDialog(true)
  }

  async function submitPago(e) {
    e.preventDefault()
    try {
      const body = {
        membresiaId: pagoTarget._id,
        MONTO: pagoForm.MONTO,
        METODO: pagoForm.METODO,
        NOTAS: pagoForm.NOTAS,
      }
      if (pagoForm.FECHA) body.FECHA = pagoForm.FECHA
      const res = await fetch(apiPath("/api/admin/membresias/pago"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al registrar pago")
      toast({ title: "Éxito", description: "Pago registrado" })
      setPagoDialog(false)
      fetchMembresias()
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  async function suspenderMembresia(membresia) {
    const suspender = membresia.ESTADO !== "suspendida"
    try {
      const res = await fetch(apiPath("/api/admin/membresias"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: membresia._id, ESTADO: suspender ? "suspendida" : "activa" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar")
      toast({ title: "Éxito", description: suspender ? "Membresía suspendida" : "Membresía reactivada" })
      fetchMembresias()
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const planesFiltrados = planes.filter((p) =>
    p.NOMBRE?.toLowerCase().includes(planSearch.toLowerCase())
  )

  const membresiasFiltradas = membresias.filter((m) => {
    const term = memSearch.toLowerCase()
    const matchSearch =
      String(m.DNI).includes(term) ||
      (m.NOMBRE || "").toLowerCase().includes(term) ||
      (m.APELLIDO || "").toLowerCase().includes(term) ||
      (m.PLAN_NOMBRE || "").toLowerCase().includes(term)
    const matchEstado = estadoFilter === "all" || m.estadoCuota === estadoFilter
    return matchSearch && matchEstado
  })

  const planesActivos = planes.filter((p) => p.ACTIVO)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membresías</h1>
          <p className="text-muted-foreground">Planes, membresías y pagos (registro manual)</p>
        </div>

        <Tabs defaultValue="membresias" className="w-full">
          <TabsList>
            <TabsTrigger value="membresias">Membresías</TabsTrigger>
            <TabsTrigger value="planes">Planes</TabsTrigger>
          </TabsList>

          {/* ── Membresías ─────────────────────────────────────────────────── */}
          <TabsContent value="membresias" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar socio o DNI..."
                    value={memSearch}
                    onChange={(e) => setMemSearch(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="h-12 sm:w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="al_dia">Al día</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="suspendida">Suspendida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openAsignarDialog} disabled={planesActivos.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Asignar membresía
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Cargando...</div>
            ) : membresiasFiltradas.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-center">No hay membresías todavía</p>
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
                        <TableHead>Plan</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Fin</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {membresiasFiltradas.map((m) => (
                        <TableRow key={m._id}>
                          <TableCell className="font-mono">{m.DNI}</TableCell>
                          <TableCell>{[m.NOMBRE, m.APELLIDO].filter(Boolean).join(" ") || "—"}</TableCell>
                          <TableCell>{m.PLAN_NOMBRE || "—"}</TableCell>
                          <TableCell>{fmtFecha(m.FECHA_INICIO)}</TableCell>
                          <TableCell>{fmtFecha(m.FECHA_FIN)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[m.estadoCuota] || "bg-muted"}`}>
                              {ESTADO_LABEL[m.estadoCuota] || m.estadoCuota}
                            </span>
                            {typeof m.diasRestantes === "number" && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {m.diasRestantes >= 0 ? `${m.diasRestantes}d` : `${m.diasRestantes}d`}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => openPagoDialog(m)}>
                              <DollarSign className="h-4 w-4 mr-1" /> Pago
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => suspenderMembresia(m)}>
                              {m.ESTADO === "suspendida" ? "Reactivar" : "Suspender"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Planes ─────────────────────────────────────────────────────── */}
          <TabsContent value="planes" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar planes..."
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button onClick={() => openPlanDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo plan
              </Button>
            </div>

            {planesFiltrados.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-center">No hay planes todavía</p>
                  <Button className="mt-4" onClick={() => openPlanDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Crear primer plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {planesFiltrados.map((plan) => (
                  <Card key={plan._id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div
                          className="flex flex-1 flex-col gap-1 p-4 cursor-pointer hover:bg-muted/50 transition-colors min-w-0"
                          onClick={() => openPlanDialog(plan)}
                        >
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="font-semibold text-base truncate">{plan.NOMBRE}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.ACTIVO ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}>
                              {plan.ACTIVO ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ${plan.PRECIO} · {plan.DURACION_DIAS} días
                          </p>
                          {plan.DESCRIPCION && (
                            <p className="text-sm text-muted-foreground truncate">{plan.DESCRIPCION}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deletePlan(plan)}
                          className="px-4 flex items-center justify-center bg-red-500/5 hover:bg-red-500/15 text-red-500 transition-colors border-l"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Dialog Plan ─────────────────────────────────────────────────── */}
        <Dialog open={planDialog} onOpenChange={setPlanDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
              <DialogDescription>Datos del plan de membresía</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitPlan}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-nombre">Nombre *</Label>
                  <Input
                    id="plan-nombre"
                    required
                    value={planForm.NOMBRE}
                    onChange={(e) => setPlanForm({ ...planForm, NOMBRE: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-precio">Precio *</Label>
                    <Input
                      id="plan-precio"
                      type="number"
                      min="0"
                      required
                      value={planForm.PRECIO}
                      onChange={(e) => setPlanForm({ ...planForm, PRECIO: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-duracion">Duración (días) *</Label>
                    <Input
                      id="plan-duracion"
                      type="number"
                      min="1"
                      required
                      value={planForm.DURACION_DIAS}
                      onChange={(e) => setPlanForm({ ...planForm, DURACION_DIAS: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-desc">Descripción</Label>
                  <Input
                    id="plan-desc"
                    value={planForm.DESCRIPCION}
                    onChange={(e) => setPlanForm({ ...planForm, DESCRIPCION: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-activo">Estado</Label>
                  <Select
                    value={planForm.ACTIVO.toString()}
                    onValueChange={(v) => setPlanForm({ ...planForm, ACTIVO: v === "true" })}
                  >
                    <SelectTrigger id="plan-activo" className="sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPlanDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingPlan ? "Guardar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Dialog Asignar membresía ─────────────────────────────────────── */}
        <Dialog open={asignarDialog} onOpenChange={setAsignarDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Asignar membresía</DialogTitle>
              <DialogDescription>Asignar o renovar la membresía de un socio</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitAsignar}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="asig-dni">DNI del socio *</Label>
                  <Input
                    id="asig-dni"
                    type="number"
                    required
                    value={asignarForm.DNI}
                    onChange={(e) => setAsignarForm({ ...asignarForm, DNI: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asig-plan">Plan *</Label>
                  <Select
                    value={asignarForm.PLAN_ID}
                    onValueChange={(v) => setAsignarForm({ ...asignarForm, PLAN_ID: v })}
                  >
                    <SelectTrigger id="asig-plan">
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planesActivos.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.NOMBRE} (${p.PRECIO} · {p.DURACION_DIAS}d)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asig-inicio">Fecha de inicio</Label>
                  <Input
                    id="asig-inicio"
                    type="date"
                    value={asignarForm.FECHA_INICIO}
                    onChange={(e) => setAsignarForm({ ...asignarForm, FECHA_INICIO: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Si se deja vacío, comienza hoy.</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAsignarDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!asignarForm.PLAN_ID}>Asignar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Dialog Registrar pago ────────────────────────────────────────── */}
        <Dialog open={pagoDialog} onOpenChange={setPagoDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar pago</DialogTitle>
              <DialogDescription>
                {pagoTarget
                  ? `Pago manual para ${[pagoTarget.NOMBRE, pagoTarget.APELLIDO].filter(Boolean).join(" ") || pagoTarget.DNI}`
                  : "Pago manual"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitPago}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pago-monto">Monto *</Label>
                    <Input
                      id="pago-monto"
                      type="number"
                      min="1"
                      required
                      value={pagoForm.MONTO}
                      onChange={(e) => setPagoForm({ ...pagoForm, MONTO: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pago-metodo">Método</Label>
                    <Select
                      value={pagoForm.METODO}
                      onValueChange={(v) => setPagoForm({ ...pagoForm, METODO: v })}
                    >
                      <SelectTrigger id="pago-metodo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pago-fecha">Fecha</Label>
                  <Input
                    id="pago-fecha"
                    type="date"
                    value={pagoForm.FECHA}
                    onChange={(e) => setPagoForm({ ...pagoForm, FECHA: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Si se deja vacío, se usa hoy.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pago-notas">Notas</Label>
                  <Input
                    id="pago-notas"
                    value={pagoForm.NOTAS}
                    onChange={(e) => setPagoForm({ ...pagoForm, NOTAS: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPagoDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar pago</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
