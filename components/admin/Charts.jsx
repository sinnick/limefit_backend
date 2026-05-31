import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

// Wrappers reutilizables sobre recharts (ver CONTRACT-fase3 §3.A.2 / §5).
// Theming consistente con Tailwind/tenant vía CSS vars (--primary, --muted-foreground...).
// Todos reciben data en formato { label, value }[] que devuelve /api/admin/stats.
// Consumidos por 3.5 (dashboard) y 3.3 (métricas del socio).

// hsl(var(--x)) sirve para colores que dependen del tenant en tiempo de render.
const COLOR_PRIMARY = "hsl(var(--primary))"
const COLOR_MUTED = "hsl(var(--muted-foreground))"
const COLOR_GRID = "hsl(var(--border))"

// Paleta para series categóricas (pie). Mezcla el primario del tenant con tonos
// neutros/acento para diferenciar segmentos sin depender de vars inexistentes.
const PIE_PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.7)",
  "hsl(var(--primary) / 0.45)",
  "hsl(var(--muted-foreground) / 0.7)",
  "hsl(var(--muted-foreground) / 0.4)",
]

const axisProps = {
  stroke: COLOR_MUTED,
  fontSize: 12,
  tickLine: false,
}

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--popover-foreground))",
    fontSize: "12px",
  },
  labelStyle: { color: "hsl(var(--popover-foreground))" },
  cursor: { fill: "hsl(var(--muted) / 0.4)" },
}

function EmptyState({ height = 240, message = "Sin datos" }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      {message}
    </div>
  )
}

function hasData(data) {
  return Array.isArray(data) && data.length > 0
}

// Altas de socios por mes (3.5). data: { label: "2026-01", value }[]
export function MonthlySignupsChart({ data, height = 240 }) {
  if (!hasData(data)) return <EmptyState height={height} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLOR_GRID} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey="value"
          name="Altas"
          stroke={COLOR_PRIMARY}
          strokeWidth={2}
          dot={{ r: 3, fill: COLOR_PRIMARY }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Asistencias / workouts por semana (3.5). data: { label: "Sem 1", value }[]
export function WeeklyAttendanceChart({ data, height = 240, name = "Asistencias" }) {
  if (!hasData(data)) return <EmptyState height={height} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLOR_GRID} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="value" name={name} fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Rutinas más asignadas (3.5). data: { label, value }[] (top N)
export function TopRoutinesChart({ data, height = 240 }) {
  if (!hasData(data)) return <EmptyState height={height} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={40}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Evolución de una métrica (3.3, p.ej. peso). data: { label, value }[] cronológico.
// Permite override de keys/nombre por si la página pasa otra forma.
export function MetricLineChart({
  data,
  height = 240,
  dataKey = "value",
  labelKey = "label",
  name = "Peso (kg)",
}) {
  if (!hasData(data)) return <EmptyState height={height} message="Sin métricas" />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLOR_GRID} vertical={false} />
        <XAxis dataKey={labelKey} {...axisProps} />
        <YAxis allowDecimals={true} domain={["auto", "auto"]} {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={COLOR_PRIMARY}
          strokeWidth={2}
          dot={{ r: 3, fill: COLOR_PRIMARY }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
