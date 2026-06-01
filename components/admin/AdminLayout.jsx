import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Dumbbell,
  Calendar,
  LogOut,
  Home,
  Menu,
  X,
  Zap,
  Activity,
  Download,
  CreditCard,
  Clock,
  LogIn,
  Bell,
  Store,
} from "lucide-react"
import { activeTenant, apiPath } from "@/config/tenant"

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session && !session.user.admin) {
      router.push("/")
    }
  }, [session, status, router])

  // Cerrar el drawer al navegar (mobile).
  useEffect(() => {
    setMobileOpen(false)
  }, [router.pathname])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session || !session.user.admin) {
    return null
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "Usuarios", icon: Users },
    { href: "/admin/routines", label: "Rutinas", icon: Dumbbell },
    { href: "/admin/assignments", label: "Asignaciones", icon: Calendar },
    { href: "/admin/ejercicios", label: "Ejercicios", icon: Zap },
    { href: "/admin/socios", label: "Socios", icon: Activity },
    { href: "/admin/membresias", label: "Membresías", icon: CreditCard },
    { href: "/admin/clases", label: "Clases", icon: Clock },
    { href: "/admin/acceso", label: "Acceso", icon: LogIn },
    { href: "/admin/anuncios", label: "Anuncios", icon: Bell },
    { href: "/admin/marketplace", label: "Marketplace", icon: Store },
    { href: "/admin/reportes", label: "Reportes", icon: Download },
  ]

  // Marca activa también las sub-rutas (p.ej. /admin/socios/123).
  const isActive = (href) =>
    href === "/admin"
      ? router.pathname === "/admin"
      : router.pathname === href || router.pathname.startsWith(href + "/")

  const Logo = () => (
    <div className="flex items-center gap-2 min-w-0">
      {activeTenant.logo ? (
        <img src={apiPath(activeTenant.logo)} alt={activeTenant.name} className="h-7 w-auto" />
      ) : (
        <h1 className="text-lg font-bold truncate">
          <span className="text-primary">{activeTenant.logoPrimary}</span>
          {activeTenant.logoRest}
        </h1>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sidebar (fijo en desktop, drawer en mobile) ───────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Usuario + logout (pie del sidebar) */}
        <div className="border-t p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={session.user.image} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {session.user.name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-none">{session.user.name}</p>
              <p className="mt-1 truncate text-xs leading-none text-muted-foreground">
                {session.user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay del drawer (mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Contenido (con margen para el sidebar en desktop) ─────────────── */}
      <div className="md:pl-64">
        {/* Topbar mobile con hamburguesa */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Logo />
        </header>

        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
