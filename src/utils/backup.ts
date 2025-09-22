// src/utils/backup.ts
// Backup & Restore util — empaqueta todo lo de "circulo-sport-*" en un JSON único.
// Soporta guardar en carpeta (File System Access API) o fallback a descarga.

type Rango = { desde?: string; hasta?: string }; // YYYY-MM-DD

const APP_PREFIX = 'circulo-sport-';
const META_KEY = 'circulo-sport-backup-settings';

export interface BackupMeta {
  app: 'circulo-sport';
  version: 1;
  created_at: string; // ISO
  includes: {
    reservas: boolean;
    caja: boolean;
    clientes: boolean;
    extras: boolean;
  };
  rango?: Rango;
}

export interface BackupFile {
  __meta: BackupMeta;
  // Mapa clave -> contenido (tal cual está en localStorage)
  data: Record<string, unknown>;
}

function getAllKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith(APP_PREFIX)) keys.push(k);
  }
  return keys;
}

function parseJSONSafe<T = any>(s: string | null): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

function filtrarPorRango(items: any[], campoFechaISO: string, rango?: Rango) {
  if (!rango || (!rango.desde && !rango.hasta)) return items;
  const dMin = rango.desde ? new Date(rango.desde + 'T00:00:00') : null;
  const dMax = rango.hasta ? new Date(rango.hasta + 'T23:59:59') : null;
  return items.filter(it => {
    const raw = it[campoFechaISO];
    const fecha = raw ? new Date(raw) : null;
    if (!fecha) return false;
    if (dMin && fecha < dMin) return false;
    if (dMax && fecha > dMax) return false;
    return true;
  });
}

function buildBackup(rango?: Rango, opciones?: Partial<BackupFile['__meta']['includes']>): BackupFile {
  const keys = getAllKeys();
  const includes = {
    reservas: true,
    caja: true,
    clientes: true,
    extras: true,
    ...(opciones || {})
  };

  const data: Record<string, unknown> = {};
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    const parsed = parseJSONSafe<any[]>(raw) ?? [];

    // Filtrado por rango SOLO para reservas y caja
    if (k === 'circulo-sport-reservas' && includes.reservas) {
      // las reservas no tienen fecha ISO; guardamos campo 'fecha' YYYY-MM-DD → convertir a ISO día
      const filtradas = (parsed as any[]).filter(r => !!r?.fecha);
      // Convertimos a ISO día para comparar
      const conISO = filtradas.map(r => ({ ...r, __fechaISO__: new Date(r.fecha + 'T12:00:00').toISOString() }));
      const filtradasRango = filtrarPorRango(conISO, '__fechaISO__', rango).map(r => {
        delete r.__fechaISO__;
        return r;
      });
      data[k] = filtradasRango;
    } else if (k === 'circulo-sport-caja' && includes.caja) {
      // transacciones: fecha_hora ISO
      const filtradas = filtrarPorRango(parsed, 'fecha_hora', rango);
      data[k] = filtradas;
    } else if (k === 'circulo-sport-clientes' && includes.clientes) {
      data[k] = parsed;
    } else if (k === 'circulo-sport-extras' && includes.extras) {
      data[k] = parsed;
    } else if (!['circulo-sport-reservas','circulo-sport-caja','circulo-sport-clientes','circulo-sport-extras'].includes(k)) {
      // Si más adelante agregás otros módulos prefijados, también se incluyen completos:
      data[k] = parsed;
    }
  }

  const backup: BackupFile = {
    __meta: {
      app: 'circulo-sport',
      version: 1,
      created_at: new Date().toISOString(),
      includes: {
        reservas: includes.reservas,
        caja: includes.caja,
        clientes: includes.clientes,
        extras: includes.extras
      },
      rango
    },
    data
  };

  return backup;
}

function toBlobJson(obj: unknown) {
  return new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
}

export async function saveWithFS(filename: string, blob: Blob) {
  // File System Access API (Chromium/Edge). Safari/Firefox no soportan todavía.
  // Guardar en carpeta elegida.
  // @ts-ignore
  if (!('showSaveFilePicker' in window)) throw new Error('FS API no disponible');
  // @ts-ignore
  const handle: FileSystemFileHandle = await window.showSaveFilePicker({
    suggestedName: filename,
    types: [{ description: 'Backup JSON', accept: { 'application/json': ['.json'] } }],
  });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export function saveWithDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function createBackup(options: {
  rango?: Rango;
  includes?: Partial<BackupFile['__meta']['includes']>;
  preferFS?: boolean;
}) {
  const backup = buildBackup(options?.rango, options?.includes);
  const blob = toBlobJson(backup);
  const filename = `backup_circulo_sport_${new Date().toISOString().slice(0,10)}.json`;

  try {
    if (options?.preferFS) {
      await saveWithFS(filename, blob);
    } else {
      saveWithDownload(filename, blob);
    }
    setLastBackupDate(new Date());
    return { ok: true };
  } catch (e) {
    // Fallback a descarga si falló FS
    try {
      saveWithDownload(filename, blob);
      setLastBackupDate(new Date());
      return { ok: true, fallback: true };
    } catch (err) {
      console.error('Backup error:', err);
      return { ok: false, error: String(err) };
    }
  }
}

export async function importBackupFile(file: File, mode: 'replace' | 'merge' = 'replace'): Promise<{ok:true} | {ok:false,error:string}> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as BackupFile;

    if (!parsed?.__meta?.app || parsed.__meta.app !== 'circulo-sport') {
      throw new Error('Archivo no reconocido como backup de Círculo Sport');
    }

    const data = parsed.data || {};
    const keys = Object.keys(data);

    if (mode === 'replace') {
      // Limpiar todas las claves del prefijo antes de reponer
      getAllKeys().forEach(k => localStorage.removeItem(k));
    }

    for (const k of keys) {
      localStorage.setItem(k, JSON.stringify((data as any)[k] ?? []));
    }

    return { ok: true };
  } catch (e:any) {
    console.error('Import error:', e);
    return { ok: false, error: String(e?.message || e) };
  }
}

/** ====== Recordatorio de backup cada N días (mientras la app esté abierta) ====== */
export interface BackupSettings {
  remindEveryDays: number; // ej: 7
  lastBackupISO?: string;
}

export function getBackupSettings(): BackupSettings {
  const raw = localStorage.getItem(META_KEY);
  const def: BackupSettings = { remindEveryDays: 7 };
  return raw ? { ...def, ...parseJSONSafe<BackupSettings>(raw) } : def;
}

export function setBackupSettings(s: BackupSettings) {
  localStorage.setItem(META_KEY, JSON.stringify(s));
}

export function setLastBackupDate(d: Date) {
  const s = getBackupSettings();
  s.lastBackupISO = d.toISOString();
  setBackupSettings(s);
}

export function shouldRemindNow(): boolean {
  const s = getBackupSettings();
  if (!s.remindEveryDays) return false;
  if (!s.lastBackupISO) return true;
  const last = new Date(s.lastBackupISO);
  const now = new Date();
  const diffDays = Math.floor((+now - +last) / (1000*60*60*24));
  return diffDays >= s.remindEveryDays;
}
