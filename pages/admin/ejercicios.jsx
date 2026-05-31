import { useState, useEffect, useMemo } from "react"
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
import { Plus, Edit, Trash2, Search, Dumbbell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import ImageUpload from "@/components/admin/ImageUpload"

const EMPTY_FORM = {
  NOMBRE: "",
  GRUPO_MUSCULAR: "",
  TIPO: "",
  EQUIPO: "",
  DIFICULTAD: "",
  INSTRUCCIONES: "",
  URL_IMAGEN: "",
  ACTIVO: true,
}

export default function EjerciciosPage() {
  const [ejercicios, setEjercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [grupoFilter, setGrupoFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const { toast } = useToast()

  useEffect(() => {
    fetchEjercicios()
  }, [])

  async function fetchEjercicios() {
    try {
      const res = await fetch(apiPath("/api/admin/ejercicios"))
      const data = await res.json()
      setEjercicios(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los ejercicios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const grupos = useMemo(() => {
    const set = new Set()
    ejercicios.forEach((e) => e.GRUPO_MUSCULAR && set.add(e.GRUPO_MUSCULAR))
    return Array.from(set).sort()
  }, [ejercicios])

  function handleOpenDialog(ejercicio = null) {
    if (ejercicio) {
      setEditing(ejercicio)
      setFormData({
        NOMBRE: ejercicio.NOMBRE || "",
        GRUPO_MUSCULAR: ejercicio.GRUPO_MUSCULAR || "",
        TIPO: ejercicio.TIPO || "",
        EQUIPO: ejercicio.EQUIPO || "",
        DIFICULTAD: ejercicio.DIFICULTAD || "",
        INSTRUCCIONES: ejercicio.INSTRUCCIONES || "",
        URL_IMAGEN: ejercicio.URL_IMAGEN || "",
        ACTIVO: ejercicio.ACTIVO !== undefined ? ejercicio.ACTIVO : true,
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
      const body = editing ? { ...formData, _id: editing._id } : formData
      const res = await fetch(apiPath("/api/admin/ejercicios"), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar ejercicio")
      }

      toast({
        title: "Éxito",
        description: `Ejercicio ${editing ? "actualizado" : "creado"} correctamente`,
      })

      setDialogOpen(false)
      fetchEjercicios()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  async function handleDelete(ejercicio) {
    if (!confirm(`¿Eliminar el ejercicio "${ejercicio.NOMBRE}"?`)) return

    try {
      const res = await fetch(apiPath(`/api/admin/ejercicios?id=${ejercicio._id}`), {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error al eliminar ejercicio")
      }

      toast({ title: "Éxito", description: "Ejercicio eliminado correctamente" })
      fetchEjercicios()
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const filtered = ejercicios.filter((e) => {
    const matchesSearch = e.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrupo = grupoFilter === "all" || e.GRUPO_MUSCULAR === grupoFilter
    return matchesSearch && matchesGrupo
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ejercicios</h1>
            <p className="text-muted-foreground">
              Biblioteca de ejercicios del gimnasio
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ejercicio
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Select value={grupoFilter} onValueChange={setGrupoFilter}>
            <SelectTrigger className="h-12 sm:w-56">
              <SelectValue placeholder="Grupo muscular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grupos</SelectItem>
              {grupos.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Listado */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando ejercicios...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Dumbbell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                No hay ejercicios todavía
              </p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Crear primer ejercicio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ejercicio) => (
              <Card key={ejercicio._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div
                      className="flex flex-1 gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors min-w-0"
                      onClick={() => handleOpenDialog(ejercicio)}
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {ejercicio.URL_IMAGEN ? (
                          <img
                            src={ejercicio.URL_IMAGEN}
                            alt={ejercicio.NOMBRE}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Dumbbell className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">
                            {ejercicio.NOMBRE}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              ejercicio.ACTIVO
                                ? "bg-green-500/20 text-green-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {ejercicio.ACTIVO ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {ejercicio.GRUPO_MUSCULAR && (
                            <p className="capitalize">{ejercicio.GRUPO_MUSCULAR}</p>
                          )}
                          {(ejercicio.EQUIPO || ejercicio.DIFICULTAD) && (
                            <p className="truncate">
                              {[ejercicio.EQUIPO, ejercicio.DIFICULTAD]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <Edit className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>

                    <button
                      onClick={() => handleDelete(ejercicio)}
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar Ejercicio" : "Nuevo Ejercicio"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Modifica los datos del ejercicio"
                  : "Completa el formulario para crear un nuevo ejercicio"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="GRUPO_MUSCULAR">Grupo muscular *</Label>
                    <Input
                      id="GRUPO_MUSCULAR"
                      required
                      list="grupos-list"
                      value={formData.GRUPO_MUSCULAR}
                      onChange={(e) =>
                        setFormData({ ...formData, GRUPO_MUSCULAR: e.target.value })
                      }
                    />
                    <datalist id="grupos-list">
                      {grupos.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="TIPO">Tipo</Label>
                    <Input
                      id="TIPO"
                      value={formData.TIPO}
                      onChange={(e) => setFormData({ ...formData, TIPO: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="EQUIPO">Equipo</Label>
                    <Input
                      id="EQUIPO"
                      value={formData.EQUIPO}
                      onChange={(e) => setFormData({ ...formData, EQUIPO: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="DIFICULTAD">Dificultad</Label>
                    <Select
                      value={formData.DIFICULTAD || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, DIFICULTAD: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger id="DIFICULTAD">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="beginner">Principiante</SelectItem>
                        <SelectItem value="intermediate">Intermedio</SelectItem>
                        <SelectItem value="advanced">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="INSTRUCCIONES">Instrucciones</Label>
                  <textarea
                    id="INSTRUCCIONES"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.INSTRUCCIONES}
                    onChange={(e) =>
                      setFormData({ ...formData, INSTRUCCIONES: e.target.value })
                    }
                  />
                </div>

                <ImageUpload
                  label="Imagen"
                  value={formData.URL_IMAGEN}
                  onChange={(url) => setFormData({ ...formData, URL_IMAGEN: url })}
                />

                <div className="space-y-2">
                  <Label htmlFor="ACTIVO">Estado</Label>
                  <Select
                    value={formData.ACTIVO.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ACTIVO: value === "true" })
                    }
                  >
                    <SelectTrigger id="ACTIVO" className="sm:w-56">
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
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editing ? "Guardar Cambios" : "Crear Ejercicio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
