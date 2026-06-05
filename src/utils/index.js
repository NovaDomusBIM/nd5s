import { format, parseISO, differenceInDays, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Fechas ──────────────────────────────────────────────────────────────────
export const fmtFecha = (iso) => {
  if (!iso) return '-'
  try { return format(parseISO(iso), 'dd/MM/yyyy', { locale: es }) } catch { return '-' }
}

export const fmtFechaHora = (iso) => {
  if (!iso) return '-'
  try { return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: es }) } catch { return '-' }
}

export const hoy = () => new Date().toISOString().slice(0, 10)

export const diasRestantes = (fechaLimiteISO) => {
  if (!fechaLimiteISO) return null
  try {
    return differenceInDays(parseISO(fechaLimiteISO), new Date())
  } catch { return null }
}

// ── Semáforo de vencimiento ─────────────────────────────────────────────────
export const semaforo = (hallazgo) => {
  if (hallazgo.estado === 'cerrado') return { color: '#1a7a4a', bg: '#d1fae5', label: 'Cerrado' }
  const dias = diasRestantes(hallazgo.fechaLimite)
  if (dias === null) return { color: '#425563', bg: '#f1efea', label: 'Sin fecha' }
  if (dias < 0)  return { color: '#a32d2d', bg: '#fee2e2', label: `Vencido ${Math.abs(dias)}d` }
  if (dias <= 2) return { color: '#b86a00', bg: '#fef3c7', label: `Vence en ${dias}d` }
  if (dias <= 7) return { color: '#854f0b', bg: '#faeeda', label: `${dias}d restantes` }
  return { color: '#1a7a4a', bg: '#d1fae5', label: `${dias}d restantes` }
}

// ── WhatsApp link ───────────────────────────────────────────────────────────
export const wappLink = (telefono, hallazgo, proyectoNombre) => {
  const texto = [
    `*NDTracker 5S — Nuevo hallazgo*`,
    `Proyecto: ${proyectoNombre}`,
    `Sector: ${hallazgo.nivel}${hallazgo.zona ? ' · ' + hallazgo.zona : ''}`,
    `Categoría: ${hallazgo.categoria}`,
    `Descripción: ${hallazgo.descripcion}`,
    hallazgo.responsable ? `Responsable: ${hallazgo.responsable}` : '',
    hallazgo.fechaLimite ? `Fecha límite: ${fmtFecha(hallazgo.fechaLimite)}` : '',
    `Cargado por: ${hallazgo.creadoPor}`,
  ].filter(Boolean).join('\n')
  const num = telefono.replace(/\D/g, '')
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
}

// ── Formateo ─────────────────────────────────────────────────────────────────
export const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

export const truncar = (s, n = 60) => s && s.length > n ? s.slice(0, n) + '…' : (s || '')

// ── Permisos por rol ─────────────────────────────────────────────────────────
export const puedeAsignar  = (rol) => ['admin', 'direccion', 'lider'].includes(rol)
export const puedeCerrar   = (rol) => ['admin', 'direccion', 'lider'].includes(rol)
export const puedeExportar = (rol) => ['admin', 'direccion'].includes(rol)
export const estaAdmin     = (rol) => rol === 'admin'
export const esDireccion   = (rol) => ['admin', 'direccion'].includes(rol)
