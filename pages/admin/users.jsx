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
  DialogTrigger,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    DNI: "",
    USUARIO: "",
    PASSWORD: "",
    NOMBRE: "",
    APELLIDO: "",
    EMAIL: "",
    SEXO: "M",
    ADMIN: false,
    HABILITADO: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch("/limefit/api/admin/users")
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(user = null) {
    if (user) {
      setEditingUser(user)
      setFormData({
        DNI: user.DNI,
        USUARIO: user.USUARIO,
        PASSWORD: "",
        NOMBRE: user.NOMBRE,
        APELLIDO: user.APELLIDO,
        EMAIL: user.EMAIL,
        SEXO: user.SEXO,
        ADMIN: user.ADMIN,
        HABILITADO: user.HABILITADO
      })
    } else {
      setEditingUser(null)
      setFormData({
        DNI: "",
        USUARIO: "",
        PASSWORD: "",
        NOMBRE: "",
        APELLIDO: "",
        EMAIL: "",
        SEXO: "M",
        ADMIN: false,
        HABILITADO: true
      })
    }
    setDialogOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const method = editingUser ? "PUT" : "POST"
      const res = await fetch("/limefit/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar usuario")
      }

      toast({
        title: "Éxito",
        description: `Usuario ${editingUser ? "actualizado" : "creado"} correctamente`
      })

      setDialogOpen(false)
      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  async function handleDelete(dni) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return

    try {
      const res = await fetch(`/api/admin/users?dni=${dni}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        throw new Error("Error al eliminar usuario")
      }

      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente"
      })

      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const filteredUsers = users.filter(user =>
    user.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.APELLIDO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.USUARIO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.DNI?.toString().includes(searchTerm)
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
            <p className="text-muted-foreground">
              Gestiona los usuarios del gimnasio
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Users list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando usuarios...
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                No hay usuarios todavía
              </p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Crear primer usuario
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredUsers.map((user) => (
              <Card key={user.DNI} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Main content - clickable to edit */}
                    <div 
                      className="flex-1 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Name + badges */}
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h3 className="font-semibold text-base">
                              {user.NOMBRE} {user.APELLIDO}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.ADMIN 
                                ? "bg-primary/20 text-primary" 
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {user.ADMIN ? "Admin" : "Usuario"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.HABILITADO 
                                ? "bg-green-500/20 text-green-600" 
                                : "bg-red-500/20 text-red-500"
                            }`}>
                              {user.HABILITADO ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          
                          {/* Details */}
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-foreground">@{user.USUARIO}</span>
                              <span className="text-muted-foreground/50">•</span>
                              <span>DNI: {user.DNI}</span>
                            </p>
                            {user.EMAIL && (
                              <p className="truncate">{user.EMAIL}</p>
                            )}
                          </div>
                        </div>
                        
                        <Edit className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(user.DNI)}
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
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Modifica los datos del usuario"
                  : "Completa el formulario para crear un nuevo usuario"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="DNI">DNI *</Label>
                    <Input
                      id="DNI"
                      type="number"
                      required
                      disabled={!!editingUser}
                      value={formData.DNI}
                      onChange={(e) => setFormData({ ...formData, DNI: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="USUARIO">Usuario *</Label>
                    <Input
                      id="USUARIO"
                      required
                      value={formData.USUARIO}
                      onChange={(e) => setFormData({ ...formData, USUARIO: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="PASSWORD">
                    {editingUser ? "Nueva Contraseña (dejar en blanco para mantener)" : "Contraseña *"}
                  </Label>
                  <Input
                    id="PASSWORD"
                    type="password"
                    required={!editingUser}
                    value={formData.PASSWORD}
                    onChange={(e) => setFormData({ ...formData, PASSWORD: e.target.value })}
                  />
                </div>
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
                    <Label htmlFor="APELLIDO">Apellido *</Label>
                    <Input
                      id="APELLIDO"
                      required
                      value={formData.APELLIDO}
                      onChange={(e) => setFormData({ ...formData, APELLIDO: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="EMAIL">Email</Label>
                  <Input
                    id="EMAIL"
                    type="email"
                    value={formData.EMAIL}
                    onChange={(e) => setFormData({ ...formData, EMAIL: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="SEXO">Sexo</Label>
                    <Select
                      value={formData.SEXO}
                      onValueChange={(value) => setFormData({ ...formData, SEXO: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="O">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ADMIN">Rol</Label>
                    <Select
                      value={formData.ADMIN.toString()}
                      onValueChange={(value) => setFormData({ ...formData, ADMIN: value === "true" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Usuario</SelectItem>
                        <SelectItem value="true">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="HABILITADO">Estado</Label>
                    <Select
                      value={formData.HABILITADO.toString()}
                      onValueChange={(value) => setFormData({ ...formData, HABILITADO: value === "true" })}
                    >
                      <SelectTrigger>
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
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
