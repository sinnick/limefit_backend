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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const emptyExercise = {
  nombre: "",
  series: 3,
  repeticiones: 10,
  descanso: 60,
  peso: "",
  notas: ""
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [formData, setFormData] = useState({
    NOMBRE: "",
    DESCRIPCION: "",
    EJERCICIOS: [],
    DIAS: [],
    DURACION: 60,
    DIFICULTAD: 3,
    NIVEL: "medio",
    HABILITADA: true
  })
  const { toast } = useToast()

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  const niveles = ["principiante", "medio", "avanzado"]

  useEffect(() => {
    fetchRoutines()
  }, [])

  async function fetchRoutines() {
    try {
      const res = await fetch("/limefit/api/admin/routines")
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
        NOMBRE: routine.NOMBRE || "",
        DESCRIPCION: routine.DESCRIPCION || "",
        EJERCICIOS: routine.EJERCICIOS || [],
        DIAS: routine.DIAS || [],
        DURACION: routine.DURACION || 60,
        DIFICULTAD: routine.DIFICULTAD || 3,
        NIVEL: routine.NIVEL || "medio",
        HABILITADA: routine.HABILITADA !== false
      })
    } else {
      setEditingRoutine(null)
      setFormData({
        NOMBRE: "",
        DESCRIPCION: "",
        EJERCICIOS: [],
        DIAS: [],
        DURACION: 60,
        DIFICULTAD: 3,
        NIVEL: "medio",
        HABILITADA: true
      })
    }
    setDialogOpen(true)
  }

  function addExercise() {
    setFormData({
      ...formData,
      EJERCICIOS: [...formData.EJERCICIOS, { ...emptyExercise }]
    })
  }

  function updateExercise(index, field, value) {
    const updated = [...formData.EJERCICIOS]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, EJERCICIOS: updated })
  }

  function removeExercise(index) {
    setFormData({
      ...formData,
      EJERCICIOS: formData.EJERCICIOS.filter((_, i) => i !== index)
    })
  }

  function toggleDay(day) {
    const dias = formData.DIAS.includes(day)
      ? formData.DIAS.filter(d => d !== day)
      : [...formData.DIAS, day]
    setFormData({ ...formData, DIAS: dias })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const url = "/limefit/api/admin/routines"
      const method = editingRoutine ? "PUT" : "POST"
      const body = editingRoutine 
        ? { ...formData, _id: editingRoutine._id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error("Error al guardar")

      toast({
        title: editingRoutine ? "Rutina actualizada" : "Rutina creada",
        description: "Los cambios se guardaron correctamente"
      })

      setDialogOpen(false)
      fetchRoutines()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la rutina",
        variant: "destructive"
      })
    }
  }

  async function handleDelete(routine) {
    if (!confirm(`¿Eliminar la rutina "${routine.NOMBRE}"?`)) return

    try {
      const res = await fetch("/limefit/api/admin/routines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: routine._id })
      })

      if (!res.ok) throw new Error("Error al eliminar")

      toast({ title: "Rutina eliminada" })
      fetchRoutines()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la rutina",
        variant: "destructive"
      })
    }
  }

  const filteredRoutines = routines.filter(r =>
    r.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.DESCRIPCION?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rutinas</h1>
            <p className="text-muted-foreground">Gestiona las rutinas de entrenamiento</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Rutina
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar rutinas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Rutinas list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando rutinas...
          </div>
        ) : filteredRoutines.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                No hay rutinas todavía
              </p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Crear primera rutina
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRoutines.map((routine) => (
              <Card key={routine._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Main content */}
                    <div 
                      className="flex-1 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleOpenDialog(routine)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base truncate">
                              {routine.NOMBRE || "Sin nombre"}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                              routine.HABILITADA 
                                ? "bg-green-500/20 text-green-600" 
                                : "bg-red-500/20 text-red-500"
                            }`}>
                              {routine.HABILITADA ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                          
                          {routine.DESCRIPCION && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                              {routine.DESCRIPCION}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-foreground">
                                {routine.EJERCICIOS?.length || 0}
                              </span> ejercicios
                            </span>
                            <span className="capitalize flex items-center gap-1">
                              Nivel: <span className="font-medium text-foreground">{routine.NIVEL || "—"}</span>
                            </span>
                            {routine.DURACION && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium text-foreground">{routine.DURACION}</span> min
                              </span>
                            )}
                          </div>
                          
                          {routine.DIAS?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {routine.DIAS.map(dia => (
                                <span 
                                  key={dia} 
                                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md font-medium"
                                >
                                  {dia.substring(0, 3)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Edit className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(routine)}
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoutine ? "Editar Rutina" : "Nueva Rutina"}</DialogTitle>
              <DialogDescription>
                {editingRoutine ? "Modifica los datos de la rutina" : "Crea una nueva rutina de entrenamiento"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la rutina</Label>
                  <Input
                    id="nombre"
                    value={formData.NOMBRE}
                    onChange={(e) => setFormData({ ...formData, NOMBRE: e.target.value })}
                    placeholder="Ej: Full Body Principiante"
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nivel">Nivel</Label>
                  <Select
                    value={formData.NIVEL}
                    onValueChange={(value) => setFormData({ ...formData, NIVEL: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {niveles.map(nivel => (
                        <SelectItem key={nivel} value={nivel} className="capitalize">
                          {nivel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.DESCRIPCION}
                  onChange={(e) => setFormData({ ...formData, DESCRIPCION: e.target.value })}
                  placeholder="Breve descripción de la rutina"
                  className="h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duración (min)</Label>
                  <Input
                    type="number"
                    value={formData.DURACION}
                    onChange={(e) => setFormData({ ...formData, DURACION: parseInt(e.target.value) || 60 })}
                    min="10"
                    max="180"
                    className="h-12 text-base text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dificultad (1-5)</Label>
                  <Input
                    type="number"
                    value={formData.DIFICULTAD}
                    onChange={(e) => setFormData({ ...formData, DIFICULTAD: parseInt(e.target.value) || 3 })}
                    min="1"
                    max="5"
                    className="h-12 text-base text-center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Días de la semana</Label>
                <div className="flex flex-wrap gap-2">
                  {diasSemana.map(dia => {
                    const isSelected = formData.DIAS.includes(dia)
                    return (
                      <button
                        key={dia}
                        type="button"
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleDay(dia)
                        }}
                      >
                        {dia.substring(0, 3)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Ejercicios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">Ejercicios</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                    <Plus className="mr-1 h-4 w-4" /> Agregar ejercicio
                  </Button>
                </div>

                {formData.EJERCICIOS.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
                    No hay ejercicios. Toca «Agregar ejercicio» para comenzar.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.EJERCICIOS.map((ejercicio, index) => (
                      <Card key={index} className="p-4 bg-muted/30">
                        <div className="space-y-3">
                          {/* Header: número + eliminar */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Ejercicio {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(index)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 px-2"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                          
                          {/* Nombre del ejercicio - full width */}
                          <Input
                            value={ejercicio.nombre}
                            onChange={(e) => updateExercise(index, "nombre", e.target.value)}
                            placeholder="Nombre del ejercicio (ej: Press de banca)"
                            className="text-base h-12"
                          />
                          
                          {/* Series, Reps, Peso en fila */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Series</Label>
                              <Input
                                type="number"
                                value={ejercicio.series}
                                onChange={(e) => updateExercise(index, "series", parseInt(e.target.value) || 0)}
                                min="1"
                                className="text-center text-lg h-12 font-semibold"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Reps</Label>
                              <Input
                                type="number"
                                value={ejercicio.repeticiones}
                                onChange={(e) => updateExercise(index, "repeticiones", parseInt(e.target.value) || 0)}
                                min="1"
                                className="text-center text-lg h-12 font-semibold"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Peso</Label>
                              <Input
                                value={ejercicio.peso}
                                onChange={(e) => updateExercise(index, "peso", e.target.value)}
                                placeholder="—"
                                className="text-center text-lg h-12"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="habilitada"
                  checked={formData.HABILITADA}
                  onChange={(e) => setFormData({ ...formData, HABILITADA: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="habilitada">Rutina habilitada</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingRoutine ? "Guardar cambios" : "Crear rutina"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
