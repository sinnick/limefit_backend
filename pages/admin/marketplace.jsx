import { useState, useEffect, useCallback } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { apiPath } from "@/config/tenant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Search, Store, Copy, Loader2, CalendarDays, Dumbbell, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const NIVEL_LABELS = {
  principiante: "Principiante",
  medio: "Medio",
  avanzado: "Avanzado",
}

function contarEjercicios(dias) {
  if (!Array.isArray(dias)) return 0
  return dias.reduce(
    (total, dia) => total + (Array.isArray(dia?.ejercicios) ? dia.ejercicios.length : 0),
    0
  )
}

export default function MarketplacePage() {
  const [sharedRoutines, setSharedRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [nivelFilter, setNivelFilter] = useState("all")
  const [cloningId, setCloningId] = useState(null)
  const [confirmRoutine, setConfirmRoutine] = useState(null)
  const { toast } = useToast()

  const fetchSharedRoutines = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set("q", searchTerm)
      if (nivelFilter && nivelFilter !== "all") params.set("nivel", nivelFilter)
      const qs = params.toString()
      const res = await fetch(apiPath(`/api/admin/marketplace${qs ? `?${qs}` : ""}`))
      const data = await res.json()
      setSharedRoutines(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las rutinas compartidas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, nivelFilter, toast])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSharedRoutines()
    }, 300)
    return () => clearTimeout(t)
  }, [fetchSharedRoutines])

  async function handleClone(routine) {
    if (!routine) return
    setCloningId(routine.ID)
    try {
      const res = await fetch(apiPath("/api/admin/routines/clone"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: routine.ID }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "No se pudo clonar la rutina")
      }
      toast({
        title: "Rutina clonada",
        description: "Ya está en tu listado de rutinas.",
      })
      setConfirmRoutine(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setCloningId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Marketplace — Rutinas compartidas
            </h1>
            <p className="text-muted-foreground">
              Descubrí rutinas publicadas por otros gimnasios y clonalas a tu gym
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar rutinas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Select value={nivelFilter} onValueChange={setNivelFilter}>
            <SelectTrigger className="h-12 sm:w-56">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="principiante">Principiante</SelectItem>
              <SelectItem value="medio">Medio</SelectItem>
              <SelectItem value="avanzado">Avanzado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listado */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando rutinas compartidas...
          </div>
        ) : sharedRoutines.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Store className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                No hay rutinas compartidas disponibles
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sharedRoutines.map((routine) => {
              const numDias = Array.isArray(routine.DIAS) ? routine.DIAS.length : 0
              const numEjercicios = contarEjercicios(routine.DIAS)
              const isCloning = cloningId === routine.ID
              return (
                <Card key={routine._id || routine.ID} className="overflow-hidden flex flex-col">
                  <CardContent className="p-4 flex flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base leading-tight">
                        {routine.NOMBRE}
                      </h3>
                      {routine.NIVEL && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary capitalize">
                          {NIVEL_LABELS[routine.NIVEL] || routine.NIVEL}
                        </span>
                      )}
                    </div>

                    {routine.ORIGEN_NOMBRE && (
                      <p className="text-xs text-muted-foreground -mt-1">
                        de {routine.ORIGEN_NOMBRE}
                      </p>
                    )}

                    {routine.DESCRIPCION && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {routine.DESCRIPCION}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-auto">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {numDias} {numDias === 1 ? "día" : "días"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="h-4 w-4" />
                        {numEjercicios} {numEjercicios === 1 ? "ejercicio" : "ejercicios"}
                      </span>
                      {routine.DURACION ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {routine.DURACION}
                        </span>
                      ) : null}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => setConfirmRoutine(routine)}
                      disabled={isCloning}
                    >
                      {isCloning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Clonando...
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Clonar
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Dialog
          open={!!confirmRoutine}
          onOpenChange={(open) => {
            if (!open && !cloningId) setConfirmRoutine(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clonar rutina</DialogTitle>
              <DialogDescription>
                {confirmRoutine
                  ? `¿Clonar "${confirmRoutine.NOMBRE}"${
                      confirmRoutine.ORIGEN_NOMBRE ? ` de ${confirmRoutine.ORIGEN_NOMBRE}` : ""
                    }? Se creará una copia en tu listado de rutinas.`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmRoutine(null)}
                disabled={!!cloningId}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleClone(confirmRoutine)}
                disabled={!!cloningId}
              >
                {cloningId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clonando...
                  </>
                ) : (
                  "Clonar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
