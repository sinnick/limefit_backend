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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
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
                    <TableHead>DNI</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.DNI}>
                      <TableCell className="font-medium">{user.DNI}</TableCell>
                      <TableCell>{user.USUARIO}</TableCell>
                      <TableCell>{`${user.NOMBRE} ${user.APELLIDO}`}</TableCell>
                      <TableCell>{user.EMAIL}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          user.ADMIN ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                        }`}>
                          {user.ADMIN ? "Admin" : "Usuario"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          user.HABILITADO ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        }`}>
                          {user.HABILITADO ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.DNI)}
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
