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
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Search, Clock, User, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const DIAS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
]

const DIA_LABEL = DIAS.reduce((acc, d) => ({ ...acc, [d.value]: d.label }), {})

const EMPTY_FORM = {
  NOMBRE: "",
  INSTRUCTOR: "",
  DIA_SEMANA: "lunes",
  HORA: "",
  CUPO: 10,
  ACTIVA: true,
}

export default function ClasesPage() {
  const [clases, setClases] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [diaFilter, setDiaFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const { toast } = useToast()

  useEffect(() => {
    fetchClases()
  }, [])

  async function fetchClases() {
    try {
      const res = await fetch(apiPath("/api/admin/clases"))
      const data = await res.json()
      setClases(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las clases",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(clase = null) {
    if (clase) {
      setEditing(clase)
      setFormData({
        NOMBRE: clase.NOMBRE || "",
        INSTRUCTOR: clase.INSTRUCTOR || "",
        DIA_SEMANA: clase.DIA_SEMANA || "lunes",
        HORA: clase.HORA || "",
        CUPO: clase.CUPO !== undefined ? clase.CUPO : 10,
        ACTIVA: clase.ACTIVA !== undefined ? clase.ACTIVA : true,
      })
    } else {
      setEditing(null)
      setFormData(EMPTY_FORM)
    }
    setDialogOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const method = editing ? "PUT" : "POST"
      const payload = { ...formData, CUPO: Number(formData.CUPO) }
      const body = editing ? { ...payload, _id: editing._id } : payload
      const res = await fetch(apiPath("/api/admin/clases"), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar la clase")
      }

      toast({
        title: "Éxito",
        description: `Clase ${editing ? "actualizada" : "creada"} correctamente`,
      })

      setDialogOpen(false)
      fetchClases()
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  async function handleDelete(clase) {
    if (!confirm(`¿Eliminar la clase "${clase.NOMBRE}"?`)) return

    try {
      const res = await fetch(apiPath(`/api/admin/clases?id=${clase._id}`), {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error al eliminar la clase")
      }

      toast({ title: "Éxito", description: "Clase eliminada correctamente" })
      fetchClases()
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const filtered = clases.filter((c) => {
    const matchesSearch =
      c.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.INSTRUCTOR?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDia = diaFilter === "all" || c.DIA_SEMANA === diaFilter
    return matchesSearch && matchesDia
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clases</h1>
            <p className="text-muted-foreground">
              Clases grupales y reservas del gimnasio
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Clase
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Select value={diaFilter} onValueChange={setDiaFilter}>
            <SelectTrigger className="h-12 sm:w-56">
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los días</SelectItem>
              {DIAS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Listado */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando clases...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                No hay clases todavía
              </p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Crear primera clase
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((clase) => {
              const ocupado = clase.cupoOcupado || 0
              const lleno = ocupado >= clase.CUPO
              return (
                <Card key={clase._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div
                        className="flex flex-1 flex-col gap-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors min-w-0"
                        onClick={() => handleOpenDialog(clase)}
                      >
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-semibold text-base truncate">
                            {clase.NOMBRE}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              clase.ACTIVA
                                ? "bg-green-500/20 text-green-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {clase.ACTIVA ? "Activa" : "Inactiva"}
                          </span>
                          <Edit className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> {clase.INSTRUCTOR}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {DIA_LABEL[clase.DIA_SEMANA] || clase.DIA_SEMANA} · {clase.HORA}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            <span className={lleno ? "text-red-500 font-medium" : ""}>
                              {ocupado} / {clase.CUPO} cupos
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(clase)}
                        className="px-4 flex items-center justify-center bg-red-500/5 hover:bg-red-500/15 text-red-500 transition-colors border-l"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Clase" : "Nueva Clase"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Modifica los datos de la clase"
                  : "Completa el formulario para crear una nueva clase"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="NOMBRE">Nombre *</Label>
                  <Input
                    id="NOMBRE"
                    required
                    value={formData.NOMBRE}
                    onChange={(e) => setFormData({ ...formData, NOMBRE: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="INSTRUCTOR">Instructor *</Label>
                  <Input
                    id="INSTRUCTOR"
                    required
                    value={formData.INSTRUCTOR}
                    onChange={(e) =>
                      setFormData({ ...formData, INSTRUCTOR: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="DIA_SEMANA">Día *</Label>
                    <Select
                      value={formData.DIA_SEMANA}
                      onValueChange={(value) =>
                        setFormData({ ...formData, DIA_SEMANA: value })
                      }
                    >
                      <SelectTrigger id="DIA_SEMANA">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIAS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="HORA">Hora * (HH:mm)</Label>
                    <Input
                      id="HORA"
                      type="time"
                      required
                      value={formData.HORA}
                      onChange={(e) => setFormData({ ...formData, HORA: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="CUPO">Cupo *</Label>
                    <Input
                      id="CUPO"
                      type="number"
                      min={1}
                      required
                      value={formData.CUPO}
                      onChange={(e) => setFormData({ ...formData, CUPO: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ACTIVA">Estado</Label>
                    <Select
                      value={formData.ACTIVA.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ACTIVA: value === "true" })
                      }
                    >
                      <SelectTrigger id="ACTIVA">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Activa</SelectItem>
                        <SelectItem value="false">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editing ? "Guardar Cambios" : "Crear Clase"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
