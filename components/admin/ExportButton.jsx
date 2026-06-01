import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiPath } from "@/config/tenant"

// Componente reutilizable (ver CONTRACT-fase3 §3.A.4): descarga un CSV desde
// /api/admin/export?tipo=... vía blob() + <a download>. No abre pestaña nueva.
// Props:
//   - tipo: "usuarios" | "asignaciones" | "asistencias" | "progreso"
//   - params: objeto opcional de query extra ({ dni, desde, hasta })
//   - children / label: texto del botón
export default function ExportButton({
  tipo,
  params = {},
  label,
  children,
  variant = "default",
  size = "default",
  disabled = false,
  className,
}) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ tipo, ...params })
      // Limpiar params vacíos
      for (const [k, v] of [...qs.entries()]) {
        if (v === "" || v == null) qs.delete(k)
      }
      const res = await fetch(apiPath(`/api/admin/export?${qs.toString()}`))
      if (!res.ok) {
        let msg = "No se pudo generar el reporte"
        try {
          const data = await res.json()
          msg = data.error || msg
        } catch {}
        throw new Error(msg)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${tipo}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({
        title: "Error al exportar",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || loading}
      onClick={handleDownload}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {children || label || "Descargar CSV"}
    </Button>
  )
}
