import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { semaforo } from '../utils'
import {
  Home, AlertTriangle, Package, Users, LayoutDashboard, BarChart2,
  Settings, LogOut, User, Building2, Menu, X
} from 'lucide-react'

// ── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
      borderRadius: 6, fontSize: 13, textDecoration: 'none', marginBottom: 2,
      color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
      background: isActive ? 'rgba(167,198,237,0.18)' : 'transparent',
      fontWeight: isActive ? 600 : 400, fontFamily: 'var(--font-body)',
      transition: 'all .15s'
    })}>
      <Icon size={15} />{label}
    </NavLink>
  )
}

// ── SidebarContent ────────────────────────────────────────────────────────────
function SidebarContent({ onNavClick }) {
  const { usuarioActual, logout, proyectoActivo } = useStore()
  const navigate = useNavigate()
  const rol = usuarioActual?.rol

  const handleLogout = async () => {
    try { await logout() } catch {}
    navigate('/login', { replace: true })
  }

  const esAdmin     = rol === 'admin'
  const esDireccion = ['admin', 'direccion'].includes(rol)
  const esLider     = ['admin', 'direccion', 'lider'].includes(rol)

  return (
    <div style={{
      width: 210, background: '#2E2A2B', display: 'flex', flexDirection: 'column',
      padding: '0 14px 20px', height: '100%'
    }}>
      {/* Logo */}
      <div style={{
        padding: '22px 0 18px', textAlign: 'center',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: 16,
        cursor: 'pointer', flexShrink: 0
      }} onClick={() => { navigate('/dashboard'); onNavClick?.() }}>
        <div style={{ fontFamily: 'var(--font-title)', fontSize: 17, fontWeight: 700, letterSpacing: '0.1em' }}>
          <span style={{ color: '#fff' }}>ND</span>
          <span style={{ color: 'var(--nd-light)' }}>TRACKER</span>
          <span style={{ color: 'var(--nd-light)', fontSize: 17, marginLeft: 2 }}>5S</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginTop: 5 }}>
          OBRA
        </div>
      </div>

      {/* Nav principal */}
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px 10px', fontFamily: 'var(--font-title)' }}>Principal</p>
      <NavItem to="/dashboard"   icon={Home}          label="Dashboard"    onClick={onNavClick} />
      <NavItem to="/hallazgos"   icon={AlertTriangle}  label="Hallazgos"    onClick={onNavClick} />
      {esLider && <NavItem to="/innecesarios" icon={Package} label="Innecesarios" onClick={onNavClick} />}

      {esLider && <>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '14px 0 6px 10px', fontFamily: 'var(--font-title)' }}>Gestión</p>
        <NavItem to="/tablero"      icon={LayoutDashboard} label="Tablero 5S"    onClick={onNavClick} />
        <NavItem to="/directorio"   icon={Users}           label="Directorio"    onClick={onNavClick} />
        <NavItem to="/estadisticas" icon={BarChart2}       label="Estadísticas"  onClick={onNavClick} />
      </>}

      {esAdmin && <>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '14px 0 6px 10px', fontFamily: 'var(--font-title)' }}>Admin</p>
        <NavItem to="/proyectos" icon={Building2} label="Proyectos"      onClick={onNavClick} />
        <NavItem to="/usuarios"  icon={Users}     label="Usuarios"       onClick={onNavClick} />
        <NavItem to="/config"    icon={Settings}  label="Configuración"  onClick={onNavClick} />
      </>}

      <NavItem to="/perfil" icon={User} label="Mi perfil" onClick={onNavClick} />

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px' }}>
          <div onClick={() => { navigate('/perfil'); onNavClick?.() }} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Avatar iniciales={usuarioActual?.iniciales} color={usuarioActual?.color} size={28} />
            <div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'block', lineHeight: 1.2 }}>
                {usuarioActual?.nombre?.split(' ')[0]}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>
                {usuarioActual?.rol}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Layout responsive ─────────────────────────────────────────────────────────
export function Layout({ children }) {
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

      {/* Sidebar desktop — siempre visible en pantallas anchas */}
      <div style={{ display: 'flex', flexShrink: 0 }} className="sidebar-wrap">
        <style>{`
          @media (max-width: 768px) {
            .sidebar-wrap { display: none !important; }
            .mobile-topbar { display: flex !important; }
            .page-content { padding: 16px !important; }
          }
          @media (min-width: 769px) {
            .mobile-topbar { display: none !important; }
          }
        `}</style>
        <SidebarContent />
      </div>

      {/* Topbar mobile con hamburguesa */}
      <div className="mobile-topbar" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#2E2A2B', padding: '0 16px', height: 52,
        alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ fontFamily: 'var(--font-title)', fontSize: 15, fontWeight: 700, letterSpacing: '0.1em' }}>
          <span style={{ color: '#fff' }}>ND</span>
          <span style={{ color: 'var(--nd-light)' }}>TRACKER</span>
          <span style={{ color: 'var(--nd-light)', marginLeft: 2 }}>5S</span>
        </div>
        <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
          <Menu size={22} />
        </button>
      </div>

      {/* Overlay menu mobile */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          {/* Fondo oscuro */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMenuOpen(false)} />
          {/* Panel */}
          <div style={{ position: 'relative', width: 240, height: '100vh', overflowY: 'auto', zIndex: 1 }}>
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <SidebarContent onNavClick={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div style={{ flex: 1, background: 'var(--nd-bg)', overflow: 'auto', minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}

// ── PageWrap ─────────────────────────────────────────────────────────────────
export function PageWrap({ children }) {
  return (
    <div style={{ padding: '24px 28px' }} className="page-content fade-in">
      {/* Espaciado extra en mobile para el topbar fijo */}
      <style>{`@media (max-width: 768px) { .page-content { padding-top: 68px !important; } }`}</style>
      {children}
    </div>
  )
}

// ── Topbar ─────────────────────────────────────────────────────────────────────
export function Topbar({ title, subtitle, children }) {
  const { usuarioActual } = useStore()
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 22, fontWeight: 700, color: 'var(--nd-black)', lineHeight: 1.15 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        {children}
        <div onClick={() => navigate('/perfil')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <RolBadge rol={usuarioActual?.rol} />
          <Avatar iniciales={usuarioActual?.iniciales} color={usuarioActual?.color} />
        </div>
      </div>
    </div>
  )
}

// ── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ iniciales, color, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color || 'var(--nd-mid)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: '#fff',
      fontFamily: 'var(--font-title)', flexShrink: 0,
      boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
    }}>
      {iniciales}
    </div>
  )
}

// ── RolBadge ─────────────────────────────────────────────────────────────────
export function RolBadge({ rol }) {
  const map = {
    admin:     { bg: 'rgba(35,31,32,0.1)',   color: '#231F20', label: 'Admin'      },
    direccion: { bg: 'rgba(66,85,99,0.1)',   color: '#425563', label: 'Dirección'  },
    lider:     { bg: 'rgba(26,122,74,0.1)',  color: '#1a7a4a', label: 'Líder'      },
    operario:  { bg: 'rgba(184,106,0,0.1)',  color: '#b86a00', label: 'Operario'   }
  }
  const s = map[rol] || map.operario
  return (
    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600, fontFamily: 'var(--font-title)', letterSpacing: '0.04em' }}>
      {s.label}
    </span>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'mid', style: extra }) {
  const s = {
    mid:    { bg: 'var(--nd-mid)',              color: '#fff'            },
    soft:   { bg: 'rgba(66,85,99,0.1)',         color: 'var(--nd-mid)'  },
    amber:  { bg: 'rgba(196,116,54,0.12)',      color: 'var(--nd-amber)'},
    red:    { bg: '#fee2e2',                    color: '#991b1b'         },
    green:  { bg: '#d1fae5',                    color: '#065f46'         },
    yellow: { bg: '#fef3c7',                    color: '#92400e'         }
  }
  const st = s[color] || s.mid
  return (
    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600, fontFamily: 'var(--font-title)', letterSpacing: '0.04em', ...extra }}>
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div style={{ background: 'var(--nd-white)', border: '0.5px solid var(--nd-border)', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  )
}

// ── CardTitle ─────────────────────────────────────────────────────────────────
export function CardTitle({ children, color }) {
  return (
    <p style={{ fontFamily: 'var(--font-title)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: color || 'var(--nd-mid)', marginBottom: 14 }}>
      {children}
    </p>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────
export function MetricCard({ label, value, sub, color, onClick }) {
  return (
    <Card style={{ borderTop: color ? `3px solid ${color}` : undefined, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ fontSize: 10, color: '#999', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-title)' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-title)', color: color || 'var(--nd-black)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{sub}</div>}
    </Card>
  )
}

// ── Btn ───────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', style, disabled, type = 'button' }) {
  const base = {
    height: 34, padding: '0 14px', borderRadius: 7, fontSize: 13, fontWeight: 600,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    opacity: disabled ? 0.5 : 1, fontFamily: 'var(--font-title)',
    letterSpacing: '0.02em', transition: 'opacity .15s', ...style
  }
  const v = {
    primary:   { background: 'var(--nd-black)',                                       color: 'var(--nd-light)' },
    secondary: { background: 'transparent', border: '0.5px solid var(--nd-border2)', color: '#555' },
    danger:    { background: 'rgba(220,38,38,0.08)', color: '#dc2626',                border: '0.5px solid rgba(220,38,38,0.2)' },
    amber:     { background: 'var(--nd-amber)',                                       color: '#fff' },
    green:     { background: '#1a7a4a',                                               color: '#fff' }
  }
  return (
    <button type={type} style={{ ...base, ...(v[variant] || v.primary) }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, required, error, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
          {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <input style={{
        width: '100%', height: 36, padding: '0 10px',
        border: `0.5px solid ${error ? '#dc2626' : 'var(--nd-border2)'}`,
        borderRadius: 7, fontSize: 14, background: 'var(--nd-white)',
        color: 'var(--nd-black)', boxSizing: 'border-box'
      }} {...props} />
      {error && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{error}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, required, rows = 3, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
          {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <textarea rows={rows} style={{
        width: '100%', padding: '8px 10px',
        border: '0.5px solid var(--nd-border2)', borderRadius: 7,
        fontSize: 14, background: 'var(--nd-white)', color: 'var(--nd-black)',
        boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5,
        fontFamily: 'var(--font-body)'
      }} {...props} />
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, required, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
          {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <select style={{
        width: '100%', height: 36, padding: '0 10px',
        border: '0.5px solid var(--nd-border2)', borderRadius: 7,
        fontSize: 14, background: 'var(--nd-white)', color: 'var(--nd-black)',
        cursor: 'pointer', boxSizing: 'border-box'
      }} {...props}>
        {children}
      </select>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ children, onClose, title, width = 480 }) {
  React.useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(35,31,32,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16
    }} onClick={onClose}>
      <div style={{
        background: 'var(--nd-white)', borderRadius: 12, padding: '28px',
        width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 17, fontWeight: 700 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--nd-mid)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}20`, borderTopColor: color,
      animation: 'spin .7s linear infinite', flexShrink: 0
    }} />
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#aaa' }}>
      {Icon && <Icon size={36} style={{ marginBottom: 12, opacity: 0.4 }} />}
      <p style={{ fontFamily: 'var(--font-title)', fontSize: 15, fontWeight: 600, color: '#888', marginBottom: 6 }}>{title}</p>
      {sub && <p style={{ fontSize: 13, marginBottom: 16 }}>{sub}</p>}
      {action}
    </div>
  )
}

// ── SemaforoChip ──────────────────────────────────────────────────────────────
export function SemaforoChip({ hallazgo }) {
  const s = semaforo(hallazgo)
  return (
    <span style={{
      fontSize: 11, padding: '2px 9px', borderRadius: 20,
      background: s.bg, color: s.color, fontWeight: 600,
      fontFamily: 'var(--font-title)', whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  )
}
