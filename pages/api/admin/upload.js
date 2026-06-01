import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

// Estrategia de upload (ver CONTRACT-fase3 §4): NO se escribe en disco ni Mongo.
// Se parsea el multipart manualmente con Node nativo (sin multer/formidable/sharp),
// se valida MIME y tamaño, y se devuelve un data-URL base64 que el form persiste
// como string en URL_IMAGEN / FOTO al guardar el recurso.
export const config = { api: { bodyParser: false } }

const MAX_BYTES = 500 * 1024 // 500 KB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]

// Acumula el stream completo del request en un Buffer.
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let total = 0
    req.on("data", (chunk) => {
      total += chunk.length
      // Cortar temprano si excede ampliamente el límite + overhead multipart.
      if (total > MAX_BYTES * 2 + 8192) {
        reject(new Error("PAYLOAD_TOO_LARGE"))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", reject)
  })
}

// Extrae la primera parte de tipo file de un body multipart/form-data.
// Devuelve { filename, contentType, data: Buffer } o null.
function parseMultipart(buffer, boundary) {
  const boundaryBuf = Buffer.from(`--${boundary}`)
  const parts = []
  let start = buffer.indexOf(boundaryBuf)
  if (start === -1) return null

  while (start !== -1) {
    const next = buffer.indexOf(boundaryBuf, start + boundaryBuf.length)
    if (next === -1) break
    // Saltear el CRLF que sigue al boundary
    const partStart = start + boundaryBuf.length + 2
    // El contenido de la parte termina 2 bytes (CRLF) antes del próximo boundary
    const part = buffer.slice(partStart, next - 2)
    parts.push(part)
    start = next
  }

  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n")
    if (headerEnd === -1) continue
    const header = part.slice(0, headerEnd).toString("utf-8")
    if (!/Content-Disposition:.*filename=/i.test(header)) continue

    const ctMatch = header.match(/Content-Type:\s*([^\r\n]+)/i)
    const fnMatch = header.match(/filename="([^"]*)"/i)
    const data = part.slice(headerEnd + 4)
    return {
      filename: fnMatch ? fnMatch[1] : "",
      contentType: ctMatch ? ctMatch[1].trim() : "",
      data,
    }
  }
  return null
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  const contentType = req.headers["content-type"] || ""
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  if (!contentType.includes("multipart/form-data") || !boundaryMatch) {
    return res.status(400).json({ error: "Se esperaba multipart/form-data" })
  }
  const boundary = boundaryMatch[1] || boundaryMatch[2]

  let body
  try {
    body = await readBody(req)
  } catch (err) {
    if (err.message === "PAYLOAD_TOO_LARGE") {
      return res.status(400).json({ error: "La imagen supera el máximo de 500 KB" })
    }
    return res.status(400).json({ error: "No se pudo leer la imagen" })
  }

  const file = parseMultipart(body, boundary)
  if (!file || !file.data || file.data.length === 0) {
    return res.status(400).json({ error: "No se encontró el campo 'image'" })
  }

  if (!ALLOWED_MIME.includes(file.contentType)) {
    return res.status(400).json({ error: "Formato no permitido (jpeg, png o webp)" })
  }

  if (file.data.length > MAX_BYTES) {
    return res.status(400).json({ error: "La imagen supera el máximo de 500 KB" })
  }

  const base64 = file.data.toString("base64")
  const url = `data:${file.contentType};base64,${base64}`
  return res.status(200).json({ url })
}
