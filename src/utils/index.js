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
const ROLES_GESTION = ['admin', 'direccion', 'jefe_obra', 'lider', 'sh']
export const puedeAsignar  = (rol) => ROLES_GESTION.includes(rol)
export const puedeCerrar   = (rol) => ROLES_GESTION.includes(rol)
export const puedeExportar = (rol) => ['admin', 'direccion', 'jefe_obra'].includes(rol)
export const puedeBorrar   = (rol) => ['admin', 'direccion', 'jefe_obra'].includes(rol)
export const estaAdmin     = (rol) => rol === 'admin'
export const esDireccion   = (rol) => ['admin', 'direccion', 'jefe_obra'].includes(rol)

// ── Etiqueta de responsable en selects (Nombre — Contrato / Nombre — Rol) ────
// Capataz y Jefe de Obra → se muestran por rol (suelen tener varios contratos).
// El resto → por sus rubros sin la palabra "Contrato", separados por coma.
const ROLES_POR_ROL = ['Capataz', 'Jefe de Obra']

export const infoResponsable = (persona) => {
  const rol = persona.rol || persona.rolLabel || ''
  if (ROLES_POR_ROL.includes(rol)) return rol
  const rubros = Array.isArray(persona.rubros) ? persona.rubros : (persona.rubro ? [persona.rubro] : [])
  if (rubros.length) {
    return rubros.map(r => r.replace(/^contrato\s+/i, '').trim()).join(', ')
  }
  return rol
}

// Construye la lista de responsables = directorio del proyecto + usuarios de gestión
export const construirResponsables = (directorio, usuarios, proyectoId) => {
  const ROLES_GESTION_USR = ['admin', 'direccion', 'jefe_obra', 'lider', 'sh']
  return [
    ...directorio
      .filter(d => d.proyectoId === proyectoId)
      .map(d => ({ id: d.id, nombre: d.nombre, telefono: d.telefono, info: infoResponsable(d) })),
    ...usuarios
      .filter(u => ROLES_GESTION_USR.includes(u.rol) && u.activo !== false && !directorio.find(d => d.nombre === u.nombre))
      .map(u => ({ id: u.id, nombre: u.nombre, telefono: u.telefono, info: u.rol }))
  ]
}
