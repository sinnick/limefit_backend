import { useState, useEffect, useRef } from "react"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Search, X, CalendarDays, Library, Loader2, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// ── Constantes del contrato (CONTRACT-fase0.md §a.1) ────────────────────────
// DIAS_SEMANA se persiste en minúsculas (lunes, martes, ...). El label es para
// mostrar al admin; el value es lo que se guarda.
const DIAS_SEMANA_OPTIONS = [
  { value: "lunes", label: "Lun" },
  { value: "martes", label: "Mar" },
  { value: "miercoles", label: "Mié" },
  { value: "jueves", label: "Jue" },
  { value: "viernes", label: "Vie" },
  { value: "sabado", label: "Sáb" },
  { value: "domingo", label: "Dom" },
]
const NIVELES = ["principiante", "medio", "avanzado"]
const UNIDADES_PESO = ["kg", "lb"]

// ID temporal de cliente. El backend genera/normaliza los ids estables
// (diaId / ejercicioId) al guardar; estos solo sirven como key estable en React
// y se mandan tal cual (el contrato §a.3 dice: si vienen, se respetan).
function clientId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// Ejercicio nuevo, con la forma del subdocumento del contrato.
function emptyExercise(orden = 0) {
  return {
    ejercicioId: clientId("ej"),
    nombre: "",
    series: 3,
    repeticiones: 10,
    descanso: 60,
    peso: "",        // string vacío = peso corporal (se convierte a null al guardar)
    unidadPeso: "kg",
    notas: "",
    orden,
  }
}

// Día nuevo con un ejercicio en blanco listo para editar.
function emptyDay(orden = 0) {
  return {
    diaId: clientId("dia"),
    nombre: `Día ${orden + 1}`,
    orden,
    ejercicios: [emptyExercise(0)],
  }
}

const emptyForm = () => ({
  NOMBRE: "",
  DESCRIPCION: "",
  DIAS: [emptyDay(0)],
  DIAS_SEMANA: [],
  DURACION: 60,
  DIFICULTAD: 3,
  NIVEL: "medio",
  HABILITADA: true,
})

// ── Normalización al abrir una rutina ───────────────────────────────────────
// Detecta el formato (CONTRACT-fase0.md §a.3 / MIGRATION-fase0.md §7) y devuelve
// SIEMPRE la estructura rica días-con-ejercicios que usa el builder.
function normalizeRoutineToForm(routine) {
  const base = {
    NOMBRE: routine.NOMBRE || "",
    DESCRIPCION: routine.DESCRIPCION || "",
    DURACION: routine.DURACION || 60,
    DIFICULTAD: routine.DIFICULTAD || 3,
    NIVEL: routine.NIVEL || "medio",
    HABILITADA: routine.HABILITADA !== false,
  }

  const dias = Array.isArray(routine.DIAS) ? routine.DIAS : []
  const diasSonObjetos = dias.length > 0 && typeof dias[0] === "object" && dias[0] !== null

  if (diasSonObjetos) {
    // Documento ya migrado: DIAS = días-con-ejercicios anidados.
    return {
      ...base,
      DIAS_SEMANA: (routine.DIAS_SEMANA || []).map((d) => String(d).toLowerCase()),
      DIAS: dias.map((dia, di) => ({
        diaId: dia.diaId || clientId("dia"),
        nombre: dia.nombre || `Día ${di + 1}`,
        orden: typeof dia.orden === "number" ? dia.orden : di,
        ejercicios: (dia.ejercicios || []).map((ej, ei) => normalizeExercise(ej, ei)),
      })),
    }
  }

  // Documento legacy aún sin migrar: DIAS = [String] (días de semana) y los
  // ejercicios viven en el bloque único EJERCICIOS[]. Se agrupan en un único
  // "Día 1" (misma regla que la migración y el adaptador de la app).
  const ejerciciosLegacy = Array.isArray(routine.EJERCICIOS) ? routine.EJERCICIOS : []
  return {
    ...base,
    // En legacy, los nombres de día de la semana estaban en DIAS.
    DIAS_SEMANA: dias.map((d) => String(d).toLowerCase()),
    DIAS:
      ejerciciosLegacy.length > 0
        ? [
            {
              diaId: clientId("dia"),
              nombre: "Día 1",
              orden: 0,
              ejercicios: ejerciciosLegacy.map((ej, ei) => normalizeExercise(ej, ei)),
            },
          ]
        : [emptyDay(0)],
  }
}

// Lleva un ejercicio (legacy con peso String, o ya migrado con peso Number) a la
// forma editable del builder. peso se maneja como string en el input.
function normalizeExercise(ej, orden = 0) {
  return {
    ejercicioId: ej.ejercicioId || clientId("ej"),
    nombre: ej.nombre || "",
    series: Number.isFinite(ej.series) ? ej.series : 3,
    repeticiones: Number.isFinite(ej.repeticiones) ? ej.repeticiones : 10,
    descanso: Number.isFinite(ej.descanso) ? ej.descanso : 60,
    peso: ej.peso === null || ej.peso === undefined ? "" : String(ej.peso),
    unidadPeso: ej.unidadPeso || "kg",
    notas: ej.notas || "",
    orden: typeof ej.orden === "number" ? ej.orden : orden,
  }
}

// ── Serialización al guardar ────────────────────────────────────────────────
// Convierte el form al payload del contrato: peso String "" → null (peso
// corporal), peso "60" → 60 (Number). Recalcula `orden` por posición.
function exerciseToPayload(ej, orden) {
  const pesoStr = String(ej.peso ?? "").trim()
  const pesoNum = pesoStr === "" ? null : parseFloat(pesoStr.replace(/[^0-9.]/g, ""))
  return {
    ejercicioId: ej.ejercicioId,
    nombre: (ej.nombre || "").trim(),
    series: Number(ej.series) || 0,
    repeticiones: Number(ej.repeticiones) || 0,
    descanso: Number(ej.descanso) || 0,
    peso: pesoNum === null || Number.isNaN(pesoNum) ? null : pesoNum,
    unidadPeso: ej.unidadPeso === "lb" ? "lb" : "kg",
    notas: (ej.notas || "").trim(),
    orden,
  }
}

function formToPayload(formData) {
  return {
    NOMBRE: formData.NOMBRE,
    DESCRIPCION: formData.DESCRIPCION,
    DIAS: formData.DIAS.map((dia, di) => ({
      diaId: dia.diaId,
      nombre: (dia.nombre || `Día ${di + 1}`).trim() || `Día ${di + 1}`,
      orden: di,
      ejercicios: dia.ejercicios.map((ej, ei) => exerciseToPayload(ej, ei)),
    })),
    DIAS_SEMANA: formData.DIAS_SEMANA,
    DURACION: formData.DURACION,
    DIFICULTAD: formData.DIFICULTAD,
    NIVEL: formData.NIVEL,
    HABILITADA: formData.HABILITADA,
  }
}

// Cuenta total de ejercicios a lo largo de todos los días (para la lista).
function countEjercicios(routine) {
  const dias = Array.isArray(routine.DIAS) ? routine.DIAS : []
  if (dias.length > 0 && typeof dias[0] === "object" && dias[0] !== null) {
    return dias.reduce((acc, d) => acc + (d.ejercicios?.length || 0), 0)
  }
  // legacy
  return Array.isArray(routine.EJERCICIOS) ? routine.EJERCICIOS.length : 0
}

function countDias(routine) {
  const dias = Array.isArray(routine.DIAS) ? routine.DIAS : []
  if (dias.length > 0 && typeof dias[0] === "object" && dias[0] !== null) {
    return dias.length
  }
  // legacy: EJERCICIOS[] equivale a un único día si hay ejercicios
  return countEjercicios(routine) > 0 ? 1 : 0
}

// ── Autocomplete de ejercicio desde la biblioteca ───────────────────────────
// Input de texto con sugerencias desde GET /api/admin/ejercicios?q= (3.1).
// - Sigue permitiendo tipeo manual libre: lo que se escribe es el valor real.
// - Al elegir una sugerencia copia el NOMBRE (3.2). Es tolerante a fallos: si el
//   endpoint no existe / falla, se comporta como un input de texto normal.
function ExerciseNameAutocomplete({ value, onSelect, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const reqIdRef = useRef(0)

  // Cerrar al hacer click fuera.
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Buscar en la biblioteca con debounce cuando cambia `query` y el menú está abierto.
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const reqId = ++reqIdRef.current
      setLoading(true)
      try {
        const url = apiPath(`/api/admin/ejercicios?q=${encodeURIComponent(query.trim())}&activo=true`)
        const res = await fetch(url)
        if (!res.ok) throw new Error("fetch ejercicios")
        const data = await res.json()
        // Ignorar respuestas viejas (race) y normalizar a array.
        if (reqId !== reqIdRef.current) return
        setResults(Array.isArray(data) ? data : [])
      } catch {
        if (reqId !== reqIdRef.current) return
        // Degradado: sin biblioteca disponible, sin sugerencias (tipeo manual sigue ok).
        setResults([])
      } finally {
        if (reqId === reqIdRef.current) setLoading(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open])

  function handleFocus() {
    setQuery(value || "")
    setHighlight(-1)
    setOpen(true)
  }

  function handleInputChange(e) {
    const v = e.target.value
    setQuery(v)
    setHighlight(-1)
    if (!open) setOpen(true)
    onChange(v) // tipeo manual: el valor real se actualiza siempre
  }

  function choose(ejercicio) {
    onSelect(ejercicio) // copia NOMBRE (+ grupo si el padre lo usa)
    setOpen(false)
    setHighlight(-1)
  }

  function handleKeyDown(e) {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      // Solo capturamos Enter si hay una sugerencia resaltada (no enviar el form).
      if (highlight >= 0 && results[highlight]) {
        e.preventDefault()
        choose(results[highlight])
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Library className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="text-base h-12 pl-10"
          autoComplete="off"
        />
        {loading && open && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {loading
                ? "Buscando en la biblioteca..."
                : "Sin coincidencias en la biblioteca. Podés escribir el nombre a mano."}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((ej, idx) => (
                <li key={ej._id || ej.NOMBRE}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => choose(ej)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      idx === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                    }`}
                  >
                    <span className="truncate font-medium">{ej.NOMBRE}</span>
                    {ej.GRUPO_MUSCULAR && (
                      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                        {ej.GRUPO_MUSCULAR}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [formData, setFormData] = useState(emptyForm())
  const [activeDay, setActiveDay] = useState("0")
  const [sharingId, setSharingId] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchRoutines()
  }, [])

  async function fetchRoutines() {
    try {
      const res = await fetch(apiPath("/api/admin/routines"))
      const data = await res.json()
      setRoutines(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las rutinas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(routine = null) {
    if (routine) {
      setEditingRoutine(routine)
      setFormData(normalizeRoutineToForm(routine))
    } else {
      setEditingRoutine(null)
      setFormData(emptyForm())
    }
    setActiveDay("0")
    setDialogOpen(true)
  }

  // ── Gestión de días ───────────────────────────────────────────────────────
  function addDay() {
    setFormData((prev) => {
      const dias = [...prev.DIAS, emptyDay(prev.DIAS.length)]
      // Activar el día recién creado.
      setActiveDay(String(dias.length - 1))
      return { ...prev, DIAS: dias }
    })
  }

  function removeDay(dayIndex) {
    setFormData((prev) => {
      if (prev.DIAS.length <= 1) {
        // No dejar la rutina sin días: reemplazar por un día vacío.
        setActiveDay("0")
        return { ...prev, DIAS: [emptyDay(0)] }
      }
      const dias = prev.DIAS.filter((_, i) => i !== dayIndex).map((d, i) => ({ ...d, orden: i }))
      setActiveDay(String(Math.max(0, Math.min(dayIndex, dias.length - 1))))
      return { ...prev, DIAS: dias }
    })
  }

  function updateDayName(dayIndex, nombre) {
    setFormData((prev) => {
      const dias = prev.DIAS.map((d, i) => (i === dayIndex ? { ...d, nombre } : d))
      return { ...prev, DIAS: dias }
    })
  }

  // ── Gestión de ejercicios dentro de un día ──────────────────────────────────
  function addExercise(dayIndex) {
    setFormData((prev) => {
      const dias = prev.DIAS.map((d, i) =>
        i === dayIndex
          ? { ...d, ejercicios: [...d.ejercicios, emptyExercise(d.ejercicios.length)] }
          : d
      )
      return { ...prev, DIAS: dias }
    })
  }

  function updateExercise(dayIndex, exIndex, field, value) {
    setFormData((prev) => {
      const dias = prev.DIAS.map((d, i) => {
        if (i !== dayIndex) return d
        const ejercicios = d.ejercicios.map((ej, j) =>
          j === exIndex ? { ...ej, [field]: value } : ej
        )
        return { ...d, ejercicios }
      })
      return { ...prev, DIAS: dias }
    })
  }

  function removeExercise(dayIndex, exIndex) {
    setFormData((prev) => {
      const dias = prev.DIAS.map((d, i) => {
        if (i !== dayIndex) return d
        return {
          ...d,
          ejercicios: d.ejercicios
            .filter((_, j) => j !== exIndex)
            .map((ej, j) => ({ ...ej, orden: j })),
        }
      })
      return { ...prev, DIAS: dias }
    })
  }

  // ── Días de la semana (DIAS_SEMANA) ─────────────────────────────────────────
  function toggleDiaSemana(value) {
    setFormData((prev) => {
      const has = prev.DIAS_SEMANA.includes(value)
      const DIAS_SEMANA = has
        ? prev.DIAS_SEMANA.filter((d) => d !== value)
        : [...prev.DIAS_SEMANA, value]
      return { ...prev, DIAS_SEMANA }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const url = apiPath("/api/admin/routines")
      const method = editingRoutine ? "PUT" : "POST"
      const payload = formToPayload(formData)
      const body = editingRoutine
        ? { ...payload, _id: editingRoutine._id, ID: editingRoutine.ID }
        : payload

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Error al guardar")

      toast({
        title: editingRoutine ? "Rutina actualizada" : "Rutina creada",
        description: "Los cambios se guardaron correctamente",
      })

      setDialogOpen(false)
      fetchRoutines()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la rutina",
        variant: "destructive",
      })
    }
  }

  async function handleDelete(routine) {
    if (!confirm(`¿Eliminar la rutina "${routine.NOMBRE}"?`)) return

    try {
      const res = await fetch(apiPath(`/api/admin/routines?id=${routine.ID}`), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: routine._id, ID: routine.ID }),
      })

      if (!res.ok) throw new Error("Error al eliminar")

      toast({ title: "Rutina eliminada" })
      fetchRoutines()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la rutina",
        variant: "destructive",
      })
    }
  }

  // ── Publicar / despublicar en el marketplace (Fase 5.3, CONTRACT §2 + §5.1) ──
  // Toggle COMPARTIDA vía PUT /api/admin/routines/share. El endpoint filtra por
  // GYM_ID propio, así que solo afecta rutinas del gym activo.
  async function handleShare(routine) {
    const nuevoValor = !routine.COMPARTIDA
    setSharingId(routine.ID)
    try {
      const res = await fetch(apiPath("/api/admin/routines/share"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: routine.ID, COMPARTIDA: nuevoValor }),
      })

      if (!res.ok) throw new Error("Error al compartir")

      toast({
        title: nuevoValor
          ? "Rutina publicada en el marketplace"
          : "Rutina retirada del marketplace",
      })

      fetchRoutines()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de compartido",
        variant: "destructive",
      })
    } finally {
      setSharingId(null)
    }
  }

  const filteredRoutines = routines.filter(
    (r) =>
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
          <div className="text-center py-12 text-muted-foreground">Cargando rutinas...</div>
        ) : filteredRoutines.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">No hay rutinas todavía</p>
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
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                                routine.HABILITADA
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {routine.HABILITADA ? "Activa" : "Inactiva"}
                            </span>
                            {routine.COMPARTIDA && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0 bg-blue-500/20 text-blue-600 flex items-center gap-1">
                                <Share2 className="h-3 w-3" />
                                Compartida
                              </span>
                            )}
                          </div>

                          {routine.DESCRIPCION && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                              {routine.DESCRIPCION}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-foreground">
                                {countDias(routine)}
                              </span>{" "}
                              días
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-foreground">
                                {countEjercicios(routine)}
                              </span>{" "}
                              ejercicios
                            </span>
                            <span className="capitalize flex items-center gap-1">
                              Nivel:{" "}
                              <span className="font-medium text-foreground">
                                {routine.NIVEL || "—"}
                              </span>
                            </span>
                            {routine.DURACION && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium text-foreground">
                                  {routine.DURACION}
                                </span>{" "}
                                min
                              </span>
                            )}
                          </div>

                          {Array.isArray(routine.DIAS_SEMANA) &&
                            routine.DIAS_SEMANA.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {routine.DIAS_SEMANA.map((dia) => (
                                  <span
                                    key={dia}
                                    className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md font-medium capitalize"
                                  >
                                    {String(dia).substring(0, 3)}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>

                        <Edit className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </div>

                    {/* Share / Unshare button (Fase 5.3, CONTRACT §5.1) */}
                    <button
                      onClick={() => handleShare(routine)}
                      disabled={sharingId === routine.ID}
                      title={
                        routine.COMPARTIDA
                          ? "Dejar de compartir en el marketplace"
                          : "Compartir en el marketplace"
                      }
                      className={`px-4 flex flex-col items-center justify-center gap-1 transition-colors border-l text-xs font-medium disabled:opacity-50 ${
                        routine.COMPARTIDA
                          ? "bg-blue-500/15 hover:bg-blue-500/25 text-blue-600"
                          : "bg-muted/30 hover:bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {sharingId === routine.ID ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                      <span className="leading-tight text-center max-w-[5rem]">
                        {routine.COMPARTIDA ? "Dejar de compartir" : "Compartir"}
                      </span>
                    </button>

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
                {editingRoutine
                  ? "Modifica los datos de la rutina"
                  : "Crea una nueva rutina de entrenamiento"}
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
                      {NIVELES.map((nivel) => (
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
                    onChange={(e) =>
                      setFormData({ ...formData, DURACION: parseInt(e.target.value) || 60 })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, DIFICULTAD: parseInt(e.target.value) || 3 })
                    }
                    min="1"
                    max="5"
                    className="h-12 text-base text-center"
                  />
                </div>
              </div>

              {/* Días de la semana (DIAS_SEMANA, no estructura de entrenamiento) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Días de la semana
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cuándo se entrena esta rutina (calendario). No confundir con los días de
                  entrenamiento de abajo.
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA_OPTIONS.map((dia) => {
                    const isSelected = formData.DIAS_SEMANA.includes(dia.value)
                    return (
                      <button
                        key={dia.value}
                        type="button"
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        onClick={() => toggleDiaSemana(dia.value)}
                      >
                        {dia.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Días de entrenamiento (DIAS con ejercicios anidados) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">Días de entrenamiento</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDay}>
                    <Plus className="mr-1 h-4 w-4" /> Agregar día
                  </Button>
                </div>

                <Tabs value={activeDay} onValueChange={setActiveDay}>
                  <TabsList className="flex h-auto flex-wrap justify-start gap-1">
                    {formData.DIAS.map((dia, di) => (
                      <TabsTrigger key={dia.diaId} value={String(di)}>
                        {dia.nombre?.trim() || `Día ${di + 1}`}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {formData.DIAS.map((dia, di) => (
                    <TabsContent key={dia.diaId} value={String(di)} className="space-y-4">
                      {/* Encabezado del día: nombre editable + eliminar día */}
                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">Nombre del día</Label>
                          <Input
                            value={dia.nombre}
                            onChange={(e) => updateDayName(di, e.target.value)}
                            placeholder={`Día ${di + 1} (ej: Push, Pierna...)`}
                            className="h-11 text-base"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDay(di)}
                          className="h-11 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar día
                        </Button>
                      </div>

                      {/* Ejercicios del día */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Ejercicios
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addExercise(di)}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Agregar ejercicio
                        </Button>
                      </div>

                      {dia.ejercicios.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
                          No hay ejercicios en este día. Toca «Agregar ejercicio» para comenzar.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {dia.ejercicios.map((ejercicio, ei) => (
                            <Card key={ejercicio.ejercicioId} className="p-4 bg-muted/30">
                              <div className="space-y-3">
                                {/* Header: número + eliminar */}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Ejercicio {ei + 1}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExercise(di, ei)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 px-2"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Quitar
                                  </Button>
                                </div>

                                {/* Nombre del ejercicio - autocomplete desde biblioteca (3.2).
                                    Permite elegir de la biblioteca o tipear libre. */}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">
                                    Ejercicio (elegí de la biblioteca o escribí a mano)
                                  </Label>
                                  <ExerciseNameAutocomplete
                                    value={ejercicio.nombre}
                                    placeholder="Nombre del ejercicio (ej: Press de banca)"
                                    onChange={(v) => updateExercise(di, ei, "nombre", v)}
                                    onSelect={(ej) => {
                                      updateExercise(di, ei, "nombre", ej.NOMBRE || "")
                                      // Grupo muscular: solo informativo en el builder.
                                      // No se persiste (exerciseToPayload ignora campos extra).
                                      updateExercise(
                                        di,
                                        ei,
                                        "grupoMuscular",
                                        ej.GRUPO_MUSCULAR || ""
                                      )
                                    }}
                                  />
                                  {ejercicio.grupoMuscular && (
                                    <p className="text-xs text-muted-foreground capitalize">
                                      Grupo: {ejercicio.grupoMuscular}
                                    </p>
                                  )}
                                </div>

                                {/* Series, Reps, Descanso */}
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Series</Label>
                                    <Input
                                      type="number"
                                      value={ejercicio.series}
                                      onChange={(e) =>
                                        updateExercise(
                                          di,
                                          ei,
                                          "series",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      min="1"
                                      className="text-center text-lg h-12 font-semibold"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Reps</Label>
                                    <Input
                                      type="number"
                                      value={ejercicio.repeticiones}
                                      onChange={(e) =>
                                        updateExercise(
                                          di,
                                          ei,
                                          "repeticiones",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      min="1"
                                      className="text-center text-lg h-12 font-semibold"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Descanso (s)
                                    </Label>
                                    <Input
                                      type="number"
                                      value={ejercicio.descanso}
                                      onChange={(e) =>
                                        updateExercise(
                                          di,
                                          ei,
                                          "descanso",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      min="0"
                                      className="text-center text-lg h-12 font-semibold"
                                    />
                                  </div>
                                </div>

                                {/* Peso + unidad */}
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="space-y-1 col-span-2">
                                    <Label className="text-xs text-muted-foreground">
                                      Peso (vacío = corporal)
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.5"
                                      value={ejercicio.peso}
                                      onChange={(e) =>
                                        updateExercise(di, ei, "peso", e.target.value)
                                      }
                                      placeholder="—"
                                      className="text-center text-lg h-12"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Unidad</Label>
                                    <Select
                                      value={ejercicio.unidadPeso}
                                      onValueChange={(value) =>
                                        updateExercise(di, ei, "unidadPeso", value)
                                      }
                                    >
                                      <SelectTrigger className="h-12">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {UNIDADES_PESO.map((u) => (
                                          <SelectItem key={u} value={u}>
                                            {u}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Notas */}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Notas</Label>
                                  <Input
                                    value={ejercicio.notas}
                                    onChange={(e) =>
                                      updateExercise(di, ei, "notas", e.target.value)
                                    }
                                    placeholder="Notas para el socio (técnica, tempo...)"
                                    className="text-base h-11"
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
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
