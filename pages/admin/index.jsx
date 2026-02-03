import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import AdminLayout from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Dumbbell, Calendar, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRoutines: 0,
    activeAssignments: 0,
    newUsersThisMonth: 0
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, routinesRes, assignmentsRes] = await Promise.all([
          fetch("/limefit/api/admin/users"),
          fetch("/limefit/api/admin/routines"),
          fetch("/limefit/api/admin/assignments")
        ])

        const users = await usersRes.json()
        const routines = await routinesRes.json()
        const assignments = await assignmentsRes.json()

        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()

        const newUsersThisMonth = users.filter(user => {
          const created = new Date(user.FECHA_CREACION)
          return created.getMonth() === thisMonth && created.getFullYear() === thisYear
        }).length

        const activeAssignments = assignments.filter(a => a.ACTIVA).length

        setStats({
          totalUsers: users.length,
          totalRoutines: routines.length,
          activeAssignments,
          newUsersThisMonth
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    if (session?.user?.admin) {
      fetchStats()
    }
  }, [session])

  const statCards = [
    {
      title: "Total Usuarios",
      value: stats.totalUsers,
      description: `${stats.newUsersThisMonth} nuevos este mes`,
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: "Total Rutinas",
      value: stats.totalRoutines,
      description: "Rutinas disponibles",
      icon: Dumbbell,
      color: "text-primary"
    },
    {
      title: "Asignaciones Activas",
      value: stats.activeAssignments,
      description: "Rutinas asignadas",
      icon: Calendar,
      color: "text-orange-500"
    },
    {
      title: "Nuevos Usuarios",
      value: stats.newUsersThisMonth,
      description: "Este mes",
      icon: TrendingUp,
      color: "text-green-500"
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {session?.user?.name}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Rápido</CardTitle>
              <CardDescription>
                Acciones comunes del administrador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/admin/users"
                className="block p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Gestionar Usuarios</p>
                    <p className="text-xs text-muted-foreground">
                      Ver, crear y editar usuarios
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/routines"
                className="block p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Gestionar Rutinas</p>
                    <p className="text-xs text-muted-foreground">
                      Crear y modificar rutinas
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/assignments"
                className="block p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Asignar Rutinas</p>
                    <p className="text-xs text-muted-foreground">
                      Asignar rutinas a usuarios
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimas acciones en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sistema iniciado</p>
                    <p className="text-xs text-muted-foreground">
                      El panel de administración está activo
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
