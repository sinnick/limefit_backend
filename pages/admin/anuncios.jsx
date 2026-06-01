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
import { Plus, Edit, Trash2, Search, Bell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const EMPTY_FORM = {
  TITULO: "",
  CUERPO: "",
  AUDIENCIA: "todos",
  ACTIVO: true,
}

const AUDIENCIA_LABEL = {
  todos: "Todos",
  socios: "Socios",
  staff: "Staff",
}

function formatFecha(value) {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [audienciaFilter, setAudienciaFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnuncios()
  }, [])

  async function fetchAnuncios() {
    try {
      const res = await fetch(apiPath("/api/admin/anuncios"))
      const data = await res.json()
      setAnuncios(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los anuncios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(anuncio = null) {
    if (anuncio) {
      setEditing(anuncio)
      setFormData({
        TITULO: anuncio.TITULO || "",
        CUERPO: anuncio.CUERPO || "",
        AUDIENCIA: anuncio.AUDIENCIA || "todos",
        ACTIVO: anuncio.ACTIVO !== undefined ? anuncio.ACTIVO : true,
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
      const res = await fetch(apiPath("/api/admin/anuncios"), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar anuncio")
      }

      toast({
        title: "Éxito",
        description: `Anuncio ${editing ? "actualizado" : "creado"} correctamente`,
      })

      setDialogOpen(false)
      fetchAnuncios()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  async function handleDelete(anuncio) {
    if (!confirm(`¿Eliminar el anuncio "${anuncio.TITULO}"?`)) return

    try {
      const res = await fetch(apiPath(`/api/admin/anuncios?id=${anuncio._id}`), {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error al eliminar anuncio")
      }

      toast({ title: "Éxito", description: "Anuncio eliminado correctamente" })
      fetchAnuncios()
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const filtered = anuncios.filter((a) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      a.TITULO?.toLowerCase().includes(term) || a.CUERPO?.toLowerCase().includes(term)
    const matchesAudiencia =
      audienciaFilter === "all" || a.AUDIENCIA === audienciaFilter
    return matchesSearch && matchesAudiencia
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Anuncios</h1>
            <p className="text-muted-foreground">
              Comunicaciones in-app para socios y staff
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Anuncio
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar anuncios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Select value={audienciaFilter} onValueChange={setAudienciaFilter}>
            <SelectTrigger className="h-12 sm:w-56">
              <SelectValue placeholder="Audiencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las audiencias</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="socios">Socios</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listado timeline */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando anuncios...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                No hay anuncios todavía
              </p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Crear primer anuncio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((anuncio) => (
              <Card key={anuncio._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div
                      className="flex flex-1 gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors min-w-0"
                      onClick={() => handleOpenDialog(anuncio)}
                    >
                      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">
                            {anuncio.TITULO}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-600">
                            {AUDIENCIA_LABEL[anuncio.AUDIENCIA] || anuncio.AUDIENCIA}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              anuncio.ACTIVO
                                ? "bg-green-500/20 text-green-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {anuncio.ACTIVO ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                          {anuncio.CUERPO}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFecha(anuncio.FECHA_PUBLICACION)}
                        </p>
                      </div>
                      <Edit className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>

                    <button
                      onClick={() => handleDelete(anuncio)}
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
                {editing ? "Editar Anuncio" : "Nuevo Anuncio"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Modifica los datos del anuncio"
                  : "Completa el formulario para crear un nuevo anuncio"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="TITULO">Título *</Label>
                  <Input
                    id="TITULO"
                    required
                    value={formData.TITULO}
                    onChange={(e) => setFormData({ ...formData, TITULO: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="CUERPO">Cuerpo *</Label>
                  <textarea
                    id="CUERPO"
                    rows={5}
                    required
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.CUERPO}
                    onChange={(e) => setFormData({ ...formData, CUERPO: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="AUDIENCIA">Audiencia</Label>
                    <Select
                      value={formData.AUDIENCIA}
                      onValueChange={(value) =>
                        setFormData({ ...formData, AUDIENCIA: value })
                      }
                    >
                      <SelectTrigger id="AUDIENCIA">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="socios">Socios</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ACTIVO">Estado</Label>
                    <Select
                      value={formData.ACTIVO.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ACTIVO: value === "true" })
                      }
                    >
                      <SelectTrigger id="ACTIVO">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Activo</SelectItem>
                        <SelectItem value="false">Inactivo</SelectItem>
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
                  {editing ? "Guardar Cambios" : "Crear Anuncio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
