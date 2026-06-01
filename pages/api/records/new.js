// POST /api/records/new — alias del endpoint batch idempotente de records.
//
// El contrato (CONTRACT-fase0.md §b.3) define `POST /api/records/batch` como
// endpoint principal de la cola de sync. Este archivo estaba vacío; lo
// implementamos reusando el MISMO handler batch para no duplicar lógica, de modo
// que /api/records/new acepta el mismo body { dni, records:[...] } y es igual de
// idempotente (upsert por GYM_ID, DNI, CLIENT_ID).
// `config` debe declararse DIRECTO en el archivo de la route: Turbopack no admite
// reexportar el campo `config` de una API route (lo parsea estáticamente en build).
export const config = { api: { bodyParser: false } };
export { default } from "./batch";
