/**
 * Migración: modelo Rutina de BLOQUE ÚNICO (EJERCICIOS[] + DIAS[] de días-de-semana)
 * a DÍAS-CON-EJERCICIOS anidados (DIAS: [{ ejercicios: [...] }] + DIAS_SEMANA[]).
 *
 * Implementa MIGRATION-fase0.md §3 (reglas de transformación) y §4 (idempotencia).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  REGLA DE SEGURIDAD DE DATOS (NO NEGOCIABLE) — MIGRATION-fase0.md §"REGLA"
 * ─────────────────────────────────────────────────────────────────────────────
 * MONGODB_URI en .env.local apunta a un host Tailscale con DATOS REALES.
 * ESTE SCRIPT SE CORRE SIEMPRE Y ÚNICAMENTE CONTRA `limefit_test` PRIMERO.
 * NUNCA contra la base real.
 *
 * Forma de invocación de prueba (la URI de test se pasa por CLI para
 * sobreescribir la de .env.local y evitar apuntar sin querer a producción):
 *
 *   MONGODB_URI=mongodb://127.0.0.1:27017/limefit_test \
 *   MIGRATION_CONFIRM=limefit_test \
 *   node scripts/migrate-rutinas.js --dry-run
 *
 *   # run real contra test (sólo tras verificar el dry-run):
 *   MONGODB_URI=mongodb://127.0.0.1:27017/limefit_test \
 *   MIGRATION_CONFIRM=limefit_test \
 *   node scripts/migrate-rutinas.js
 *
 * Guard-rails (abortan ANTES de escribir nada):
 *   1. Exige MIGRATION_CONFIRM=limefit_test y que coincida con el nombre de DB
 *      derivado de MONGODB_URI.
 *   2. Tras conectar, valida mongoose.connection.db.databaseName === 'limefit_test'.
 *   3. Lista negra de hosts: rechaza cualquier URI cuyo host sea de producción
 *      (Tailscale), aunque la DB diga "test".
 *
 * `--dry-run` es seguro: no escribe; sólo imprime el plan por documento.
 */

const { config } = require('dotenv');
config({ path: '.env.local' }); // Next usa .env.local; dotenv no lo lee por defecto
config();                       // fallback a .env
const mongoose = require('mongoose');

// ── Config / flags ──────────────────────────────────────────────────────────
const uri = process.env.MONGODB_URI;
const CONFIRM = process.env.MIGRATION_CONFIRM;
const DRY_RUN = process.argv.includes('--dry-run');

const EXPECTED_DB = 'limefit_test';

// Lista negra de hosts de PRODUCCIÓN (Tailscale). Si la URI apunta a cualquiera
// de estos hosts, abortamos aunque la DB se llame "test". Ajustar si cambia el
// host real; por seguridad se bloquea todo el dominio .ts.net (Tailscale MagicDNS)
// y el rango de IPs CGNAT 100.64.0.0/10 que usa Tailscale.
const HOST_BLACKLIST_SUBSTR = ['.ts.net', 'tailscale'];
const TAILSCALE_CGNAT_PREFIX = /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./; // 100.64-127.x.x

// ── Helpers de transformación (MIGRATION-fase0.md §3.3) ──────────────────────

// parsePeso: String → Number | null.
//   "20kg" -> 20, "20" -> 20, "bodyweight" -> null, "" -> null, null -> null.
function parsePeso(p) {
  if (p === null || p === undefined) return null;
  if (typeof p === 'number') return Number.isNaN(p) ? null : p;
  const cleaned = String(p).replace(/[^0-9.]/g, '');
  if (cleaned === '') return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

// parseUnidad: si el string contiene "lb" → "lb"; en otro caso → "kg".
function parseUnidad(p) {
  if (p && /lb/i.test(String(p))) return 'lb';
  return 'kg';
}

// Detecta si un documento YA está migrado (MIGRATION-fase0.md §4):
//   - DIAS es array de OBJETOS (no de strings), o
//   - DIAS_SEMANA ya existe.
function yaMigrado(doc) {
  if (Array.isArray(doc.DIAS_SEMANA)) return true;
  const dias = doc.DIAS;
  if (Array.isArray(dias) && dias.length > 0 && typeof dias[0] === 'object' && dias[0] !== null) {
    return true;
  }
  return false;
}

// Construye los campos nuevos a partir del documento legacy.
function construirNuevo(doc) {
  const _id = doc._id;
  const ejerciciosLegacy = Array.isArray(doc.EJERCICIOS) ? doc.EJERCICIOS : [];
  const diasSemanaRaw = Array.isArray(doc.DIAS) ? doc.DIAS : [];

  const DIAS_SEMANA = diasSemanaRaw.map((d) => String(d).toLowerCase());

  // Si EJERCICIOS está vacío/ausente => DIAS = [] (rutina sin ejercicios).
  let DIAS = [];
  if (ejerciciosLegacy.length > 0) {
    DIAS = [
      {
        diaId: `${_id}-dia-0`,
        nombre: 'Día 1',
        orden: 0,
        ejercicios: ejerciciosLegacy.map((e, i) => ({
          ejercicioId: `${_id}-0-${i}`,
          nombre: e.nombre ?? '',
          series: e.series ?? 3,
          repeticiones: e.repeticiones ?? 10,
          descanso: e.descanso ?? 60,
          peso: parsePeso(e.peso),
          unidadPeso: parseUnidad(e.peso),
          notas: e.notas ?? '',
          orden: i,
        })),
      },
    ];
  }

  return {
    DIAS,
    DIAS_SEMANA,
    EJERCICIOS: [], // vaciar legacy
    FECHA_MODIFICACION: new Date(), // touch de auditoría de migración
  };
}

// ── Guard-rails de seguridad ─────────────────────────────────────────────────
function dbNameFromUri(u) {
  // mongodb://host:port/dbname?opts  /  mongodb+srv://host/dbname?opts
  try {
    const afterAuthority = u.replace(/^mongodb(\+srv)?:\/\//, '');
    const slash = afterAuthority.indexOf('/');
    if (slash === -1) return '';
    return afterAuthority.slice(slash + 1).split('?')[0].split('/')[0];
  } catch {
    return '';
  }
}

function hostFromUri(u) {
  try {
    const afterAuthority = u.replace(/^mongodb(\+srv)?:\/\//, '');
    // strip credentials, then take up to first '/' or '?'
    const authority = afterAuthority.split('/')[0].split('?')[0];
    const noCreds = authority.includes('@') ? authority.split('@').pop() : authority;
    // host:port (puede haber lista de hosts separados por coma)
    return noCreds.split(',').map((h) => h.split(':')[0]).join(',');
  } catch {
    return '';
  }
}

function abort(msg) {
  console.error(`\n❌ ABORTADO (guard-rail): ${msg}\n`);
  process.exit(1);
}

function checkGuardRails() {
  if (!uri) abort('Falta MONGODB_URI en el entorno.');

  // (3) Lista negra de hosts de producción.
  const host = hostFromUri(uri);
  for (const part of host.split(',')) {
    const h = part.trim();
    if (HOST_BLACKLIST_SUBSTR.some((bad) => h.includes(bad)) || TAILSCALE_CGNAT_PREFIX.test(h)) {
      abort(`El host '${h}' parece de PRODUCCIÓN (Tailscale). Esta migración sólo corre contra ${EXPECTED_DB} local.`);
    }
  }

  // (1) MIGRATION_CONFIRM debe existir, valer 'limefit_test' y coincidir con la DB de la URI.
  const dbName = dbNameFromUri(uri);
  if (CONFIRM !== EXPECTED_DB) {
    abort(`Falta o no coincide MIGRATION_CONFIRM. Esperado MIGRATION_CONFIRM=${EXPECTED_DB} (recibido: ${CONFIRM ?? '<vacío>'}).`);
  }
  if (dbName !== EXPECTED_DB) {
    abort(`La DB de MONGODB_URI es '${dbName}', no '${EXPECTED_DB}'. Pasá MONGODB_URI=mongodb://127.0.0.1:27017/${EXPECTED_DB} por CLI.`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  checkGuardRails();

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // (2) Verificación post-conexión: la DB EFECTIVA debe ser limefit_test.
  if (db.databaseName !== EXPECTED_DB) {
    await mongoose.disconnect();
    abort(`La DB conectada es '${db.databaseName}', no '${EXPECTED_DB}'. No se escribe nada.`);
  }

  console.log(`DB: ${db.databaseName} ${DRY_RUN ? '(DRY-RUN: no escribe)' : '(RUN REAL contra test)'}`);

  const col = db.collection('rutinas');
  const cursor = col.find({});

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  // eslint-disable-next-line no-await-in-loop
  for await (const doc of cursor) {
    try {
      if (yaMigrado(doc)) {
        skipped++;
        console.log(`  skip   ID=${doc.ID} _id=${doc._id} (ya migrado)`);
        continue;
      }

      const nuevo = construirNuevo(doc);
      const nEj = nuevo.DIAS[0] ? nuevo.DIAS[0].ejercicios.length : 0;

      console.log(
        `  migrate ID=${doc.ID} _id=${doc._id} ejercicios=${nEj} ` +
        `DIAS_SEMANA=[${nuevo.DIAS_SEMANA.join(',')}]`
      );
      if (nEj > 0) {
        nuevo.DIAS[0].ejercicios.forEach((e) => {
          console.log(`      - ${e.nombre}: peso=${e.peso} ${e.unidadPeso}`);
        });
      }

      if (!DRY_RUN) {
        await col.updateOne({ _id: doc._id }, { $set: nuevo });
      }
      migrated++;
    } catch (err) {
      failed++;
      console.error(`  FAIL   _id=${doc._id}: ${err.message}`);
    }
  }

  await mongoose.disconnect();

  console.log('\nResumen:', JSON.stringify({ migrated, skipped, failed }));
  if (DRY_RUN) {
    console.log('(Dry-run: nada fue escrito. Verificá el log y corré sin --dry-run contra limefit_test.)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
