import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function RoutinesPage() {
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [formData, setFormData] = useState({
    NOMBRE: "",
    DESCRIPCION: "",
    DIAS: [],
    DURACION: 60,
    DIFICULTAD: 3,
    IMAGEN: "",
    NIVEL: "medio",
    HABILITADA: true
  })
  const { toast } = useToast()

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  useEffect(() => {
    fetchRoutines()
  }, [])

  async function fetchRoutines() {
    try {
      const res = await fetch("/api/admin/routines")
      const data = await res.json()
      setRoutines(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las rutinas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(routine = null) {
    if (routine) {
      setEditingRoutine(routine)
      setFormData({
        ID: routine.ID,
        NOMBRE: routine.NOMBRE,
        DESCRIPCION: routine.DESCRIPCION,
        DIAS: routine.DIAS || [],
        DURACION: routine.DURACION,
        DIFICULTAD: routine.DIFICULTAD,
        IMAGEN: routine.IMAGEN || "",
        NIVEL: routine.NIVEL,
        HABILITADA: routine.HABILITADA
      })
    } else {
      setEditingRoutine(null)
      setFormData({
        NOMBRE: "",
        DESCRIPCION: "",
        DIAS: [],
        DURACION: 60,
        DIFICULTAD: 3,
        IMAGEN: "",
        NIVEL: "medio",
        HABILITADA: true
      })
    }
    setDialogOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const method = editingRoutine ? "PUT" : "POST"
      const res = await fetch("/api/admin/routines", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar rutina")
      }

      toast({
        title: "Éxito",
        description: `Rutina ${editingRoutine ? "actualizada" : "creada"} correctamente`
      })

      setDialogOpen(false)
      fetchRoutines()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Estás seguro de eliminar esta rutina?")) return

    try {
      const res = await fetch(`/api/admin/routines?id=${id}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        throw new Error("Error al eliminar rutina")
      }

      toast({
        title: "Éxito",
        description: "Rutina eliminada correctamente"
      })

      fetchRoutines()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const filteredRoutines = routines.filter(routine =>
    routine.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    routine.DESCRIPCION?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    routine.NIVEL?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rutinas</h1>
            <p className="text-muted-foreground">
              Gestiona las rutinas de entrenamiento
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Rutina
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar rutinas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Cargando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Dificultad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutines.map((routine) => (
                    <TableRow key={routine.ID}>
                      <TableCell className="font-medium">{routine.ID}</TableCell>
                      <TableCell>{routine.NOMBRE}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {routine.DESCRIPCION}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{routine.NIVEL}</span>
                      </TableCell>
                      <TableCell>{routine.DURACION} min</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-xs ${
                                i < routine.DIFICULTAD ? "text-primary" : "text-muted"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          routine.HABILITADA ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        }`}>
                          {routine.HABILITADA ? "Activa" : "Inactiva"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(routine)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(routine.ID)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRoutine ? "Editar Rutina" : "Nueva Rutina"}
              </DialogTitle>
              <DialogDescription>
                {editingRoutine
                  ? "Modifica los datos de la rutina"
                  : "Completa el formulario para crear una nueva rutina"}
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
                  <Label htmlFor="DESCRIPCION">Descripción *</Label>
                  <Input
                    id="DESCRIPCION"
                    required
                    value={formData.DESCRIPCION}
                    onChange={(e) => setFormData({ ...formData, DESCRIPCION: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="NIVEL">Nivel *</Label>
                    <Select
                      value={formData.NIVEL}
                      onValueChange={(value) => setFormData({ ...formData, NIVEL: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="principiante">Principiante</SelectItem>
                        <SelectItem value="medio">Medio</SelectItem>
                        <SelectItem value="avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="DURACION">Duración (min)</Label>
                    <Input
                      id="DURACION"
                      type="number"
                      min="1"
                      value={formData.DURACION}
                      onChange={(e) => setFormData({ ...formData, DURACION: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="DIFICULTAD">Dificultad (1-5)</Label>
                    <Input
                      id="DIFICULTAD"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.DIFICULTAD}
                      onChange={(e) => setFormData({ ...formData, DIFICULTAD: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="IMAGEN">URL de Imagen</Label>
                  <Input
                    id="IMAGEN"
                    type="url"
                    value={formData.IMAGEN}
                    onChange={(e) => setFormData({ ...formData, IMAGEN: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="HABILITADA">Estado</Label>
                  <Select
                    value={formData.HABILITADA.toString()}
                    onValueChange={(value) => setFormData({ ...formData, HABILITADA: value === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activa</SelectItem>
                      <SelectItem value="false">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingRoutine ? "Guardar Cambios" : "Crear Rutina"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
