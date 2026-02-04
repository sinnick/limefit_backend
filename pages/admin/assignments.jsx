import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
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
import { Plus, Edit, Trash2, Search, Calendar, Dumbbell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [formData, setFormData] = useState({
    DNI: "",
    RUTINA_ID: "",
    NOTAS: "",
    FECHA_INICIO: new Date().toISOString().split('T')[0],
    FECHA_FIN: "",
    ACTIVA: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [assignmentsRes, usersRes, routinesRes] = await Promise.all([
        fetch("/limefit/api/admin/assignments"),
        fetch("/limefit/api/admin/users"),
        fetch("/limefit/api/admin/routines")
      ])

      const assignmentsData = await assignmentsRes.json()
      const usersData = await usersRes.json()
      const routinesData = await routinesRes.json()

      setAssignments(assignmentsData)
      setUsers(usersData)
      setRoutines(routinesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(assignment = null) {
    if (assignment) {
      setEditingAssignment(assignment)
      setFormData({
        id: assignment._id,
        DNI: assignment.DNI,
        RUTINA_ID: assignment.RUTINA_ID,
        NOTAS: assignment.NOTAS || "",
        FECHA_INICIO: assignment.FECHA_INICIO ? new Date(assignment.FECHA_INICIO).toISOString().split('T')[0] : "",
        FECHA_FIN: assignment.FECHA_FIN ? new Date(assignment.FECHA_FIN).toISOString().split('T')[0] : "",
        ACTIVA: assignment.ACTIVA
      })
    } else {
      setEditingAssignment(null)
      setFormData({
        DNI: "",
        RUTINA_ID: "",
        NOTAS: "",
        FECHA_INICIO: new Date().toISOString().split('T')[0],
        FECHA_FIN: "",
        ACTIVA: true
      })
    }
    setDialogOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const method = editingAssignment ? "PUT" : "POST"
      const res = await fetch("/limefit/api/admin/assignments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          DNI: parseInt(formData.DNI),
          RUTINA_ID: parseInt(formData.RUTINA_ID)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar asignación")
      }

      toast({
        title: "Éxito",
        description: `Asignación ${editingAssignment ? "actualizada" : "creada"} correctamente`
      })

      setDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Estás seguro de eliminar esta asignación?")) return

    try {
      const res = await fetch(`/api/admin/assignments?id=${id}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        throw new Error("Error al eliminar asignación")
      }

      toast({
        title: "Éxito",
        description: "Asignación eliminada correctamente"
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const userName = assignment.usuario ? `${assignment.usuario.NOMBRE} ${assignment.usuario.APELLIDO}`.toLowerCase() : ""
    const routineName = assignment.rutina ? assignment.rutina.NOMBRE.toLowerCase() : ""
    const search = searchTerm.toLowerCase()
    return userName.includes(search) || routineName.includes(search) || assignment.DNI.toString().includes(search)
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asignaciones</h1>
            <p className="text-muted-foreground">
              Asigna rutinas a usuarios
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Asignación
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar asignaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Assignments list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando asignaciones...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                No hay asignaciones todavía
              </p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Crear primera asignación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Main content - clickable to edit */}
                    <div 
                      className="flex-1 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleOpenDialog(assignment)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* User name + status badge */}
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h3 className="font-semibold text-base">
                              {assignment.usuario
                                ? `${assignment.usuario.NOMBRE} ${assignment.usuario.APELLIDO}`
                                : "Usuario no encontrado"}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              assignment.ACTIVA 
                                ? "bg-green-500/20 text-green-600" 
                                : "bg-red-500/20 text-red-500"
                            }`}>
                              {assignment.ACTIVA ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                          
                          {/* Routine info */}
                          <div className="flex items-center gap-2 mb-2">
                            <Dumbbell className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-medium text-primary">
                              {assignment.rutina ? assignment.rutina.NOMBRE : "Rutina no encontrada"}
                            </span>
                            {assignment.rutina?.NIVEL && (
                              <>
                                <span className="text-muted-foreground/50">•</span>
                                <span className="text-sm text-muted-foreground capitalize">
                                  {assignment.rutina.NIVEL}
                                </span>
                              </>
                            )}
                          </div>
                          
                          {/* Details */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(assignment.FECHA_INICIO).toLocaleDateString()}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>DNI: {assignment.DNI}</span>
                            {assignment.ASIGNADO_POR && (
                              <>
                                <span className="text-muted-foreground/50">•</span>
                                <span>por {assignment.ASIGNADO_POR}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <Edit className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(assignment._id)}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAssignment ? "Editar Asignación" : "Nueva Asignación"}
              </DialogTitle>
              <DialogDescription>
                {editingAssignment
                  ? "Modifica los datos de la asignación"
                  : "Asigna una rutina a un usuario"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="DNI">Usuario *</Label>
                  <Select
                    value={formData.DNI.toString()}
                    onValueChange={(value) => setFormData({ ...formData, DNI: value })}
                    disabled={!!editingAssignment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.DNI} value={user.DNI.toString()}>
                          {user.NOMBRE} {user.APELLIDO} - DNI: {user.DNI}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="RUTINA_ID">Rutina *</Label>
                  <Select
                    value={formData.RUTINA_ID.toString()}
                    onValueChange={(value) => setFormData({ ...formData, RUTINA_ID: value })}
                    disabled={!!editingAssignment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una rutina" />
                    </SelectTrigger>
                    <SelectContent>
                      {routines.filter(r => r.HABILITADA).map((routine) => (
                        <SelectItem key={routine.ID} value={routine.ID.toString()}>
                          {routine.NOMBRE} - {routine.NIVEL}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="FECHA_INICIO">Fecha Inicio</Label>
                    <Input
                      id="FECHA_INICIO"
                      type="date"
                      value={formData.FECHA_INICIO}
                      onChange={(e) => setFormData({ ...formData, FECHA_INICIO: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="FECHA_FIN">Fecha Fin (opcional)</Label>
                    <Input
                      id="FECHA_FIN"
                      type="date"
                      value={formData.FECHA_FIN}
                      onChange={(e) => setFormData({ ...formData, FECHA_FIN: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="NOTAS">Notas</Label>
                  <Input
                    id="NOTAS"
                    value={formData.NOTAS}
                    onChange={(e) => setFormData({ ...formData, NOTAS: e.target.value })}
                    placeholder="Notas adicionales..."
                  />
                </div>
                {editingAssignment && (
                  <div className="space-y-2">
                    <Label htmlFor="ACTIVA">Estado</Label>
                    <Select
                      value={formData.ACTIVA.toString()}
                      onValueChange={(value) => setFormData({ ...formData, ACTIVA: value === "true" })}
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
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAssignment ? "Guardar Cambios" : "Crear Asignación"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
