import { useRef, useState } from "react"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiPath } from "@/config/tenant"
import { cn } from "@/lib/utils"

// Componente reutilizable (ver CONTRACT-fase3 §3.A.3): input file + preview +
// POST a /api/admin/upload. Devuelve la data-URL base64 vía onChange(url).
// El form que lo usa persiste esa URL como string en URL_IMAGEN / FOTO.
export default function ImageUpload({ value, onChange, label = "Imagen", className }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFile = async (file) => {
    if (!file) return

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast({
        title: "Formato no permitido",
        description: "Usá una imagen JPEG, PNG o WEBP.",
        variant: "destructive",
      })
      return
    }
    if (file.size > 500 * 1024) {
      toast({
        title: "Imagen muy grande",
        description: "El máximo permitido es 500 KB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const res = await fetch(apiPath("/api/admin/upload"), {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir la imagen")
      }
      onChange(data.url)
    } catch (err) {
      toast({
        title: "Error al subir",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    onChange("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <span className="text-sm font-medium">{label}</span>}

      <div className="flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-input bg-muted">
          {value ? (
            <img src={value} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {value ? "Cambiar" : "Subir imagen"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={handleClear}
            >
              <X className="mr-2 h-4 w-4" />
              Quitar
            </Button>
          )}
          <p className="text-xs text-muted-foreground">JPEG, PNG o WEBP · máx 500 KB</p>
        </div>
      </div>
    </div>
  )
}
