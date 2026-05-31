import dbConnect from "@/utils/mongoose"
import Usuario from "@/models/Usuario"
import UsuarioRutina from "@/models/UsuarioRutina"
import Rutina from "@/models/Rutina"
import Asistencia from "@/models/Asistencia"
import WorkoutCompletado from "@/models/WorkoutCompletado"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { Parser } from "json2csv"

// Export CSV (Feature 3.7, CONTRACT-fase3.md §1.5).
// Único endpoint con selector `tipo`. Devuelve text/csv (no JSON).
//   tipo=usuarios       -> DNI, USUARIO, NOMBRE, APELLIDO, EMAIL, ADMIN, HABILITADO
//   tipo=asignaciones   -> DNI, NOMBRE_SOCIO, RUTINA_ID, RUTINA_NOMBRE, ACTIVA, FECHA_INICIO
//   tipo=asistencias    -> DNI, FECHA, METODO   (rango opcional desde/hasta ISO)
//   tipo=progreso&dni=  -> FECHA, RUTINA_NOMBRE, DIA_NOMBRE, DURACION, VOLUMEN_TOTAL, PRS_LOGRADOS
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  const { tipo, dni, desde, hasta } = req.query

  try {
    let fields = []
    let rows = []
    let filename = "export"

    if (tipo === "usuarios") {
      filename = "usuarios"
      fields = ["DNI", "USUARIO", "NOMBRE", "APELLIDO", "EMAIL", "ADMIN", "HABILITADO"]
      const users = await Usuario.find({ GYM_ID })
        .select("-PASSWORD")
        .sort({ APELLIDO: 1, NOMBRE: 1 })
        .lean()
      rows = users.map((u) => ({
        DNI: u.DNI,
        USUARIO: u.USUARIO || "",
        NOMBRE: u.NOMBRE || "",
        APELLIDO: u.APELLIDO || "",
        EMAIL: u.EMAIL || "",
        ADMIN: u.ADMIN ? "Sí" : "No",
        HABILITADO: u.HABILITADO ? "Sí" : "No",
      }))
    } else if (tipo === "asignaciones") {
      filename = "asignaciones"
      fields = ["DNI", "NOMBRE_SOCIO", "RUTINA_ID", "RUTINA_NOMBRE", "ACTIVA", "FECHA_INICIO"]
      const asignaciones = await UsuarioRutina.find({ GYM_ID })
        .sort({ FECHA_ASIGNACION: -1 })
        .lean()

      // Enrichment manual: NOMBRE socio + NOMBRE rutina.
      const dnis = [...new Set(asignaciones.map((a) => a.DNI))]
      const rutinaIds = [...new Set(asignaciones.map((a) => a.RUTINA_ID))]
      const [usuarios, rutinas] = await Promise.all([
        Usuario.find({ GYM_ID, DNI: { $in: dnis } }).select("DNI NOMBRE APELLIDO").lean(),
        Rutina.find({ GYM_ID, ID: { $in: rutinaIds } }).select("ID NOMBRE").lean(),
      ])
      const usuarioMap = new Map(usuarios.map((u) => [u.DNI, u]))
      const rutinaMap = new Map(rutinas.map((r) => [r.ID, r]))

      rows = asignaciones.map((a) => {
        const u = usuarioMap.get(a.DNI)
        const r = rutinaMap.get(a.RUTINA_ID)
        return {
          DNI: a.DNI,
          NOMBRE_SOCIO: u ? `${u.NOMBRE || ""} ${u.APELLIDO || ""}`.trim() : "",
          RUTINA_ID: a.RUTINA_ID,
          RUTINA_NOMBRE: r ? r.NOMBRE : "",
          ACTIVA: a.ACTIVA ? "Sí" : "No",
          FECHA_INICIO: a.FECHA_INICIO ? new Date(a.FECHA_INICIO).toISOString() : "",
        }
      })
    } else if (tipo === "asistencias") {
      filename = "asistencias"
      fields = ["DNI", "FECHA", "METODO"]
      const query = { GYM_ID }
      if (desde || hasta) {
        query.FECHA = {}
        if (desde) query.FECHA.$gte = new Date(desde)
        if (hasta) query.FECHA.$lte = new Date(hasta)
      }
      const asistencias = await Asistencia.find(query).sort({ FECHA: -1 }).lean()
      rows = asistencias.map((a) => ({
        DNI: a.DNI,
        FECHA: a.FECHA ? new Date(a.FECHA).toISOString() : "",
        METODO: a.METODO || "",
      }))
    } else if (tipo === "progreso") {
      if (!dni) {
        return res.status(400).json({ error: "Falta el parámetro dni" })
      }
      filename = `progreso-${dni}`
      fields = ["FECHA", "RUTINA_NOMBRE", "DIA_NOMBRE", "DURACION", "VOLUMEN_TOTAL", "PRS_LOGRADOS"]
      const workouts = await WorkoutCompletado.find({ GYM_ID, DNI: parseInt(dni) })
        .sort({ FECHA: -1 })
        .lean()
      rows = workouts.map((w) => ({
        FECHA: w.FECHA ? new Date(w.FECHA).toISOString() : "",
        RUTINA_NOMBRE: w.RUTINA_NOMBRE || "",
        DIA_NOMBRE: w.DIA_NOMBRE || "",
        DURACION: w.DURACION ?? "",
        VOLUMEN_TOTAL: w.VOLUMEN_TOTAL ?? "",
        PRS_LOGRADOS: w.PRS_LOGRADOS ?? "",
      }))
    } else {
      return res.status(400).json({ error: "Tipo de reporte desconocido" })
    }

    const parser = new Parser({ fields, header: true })
    const csv = parser.parse(rows)

    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`)
    // BOM para que Excel reconozca UTF-8 (acentos correctos).
    return res.status(200).send("﻿" + csv)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
