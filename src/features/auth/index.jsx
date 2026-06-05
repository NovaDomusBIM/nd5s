import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../../store/useStore'

export function Login() {
  const { login, usuarioActual, cargando } = useStore()
  const navigate = useNavigate()
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (usuarioActual) navigate('/dashboard', { replace: true })
  }, [usuarioActual])

  if (cargando) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-title)', color: '#aaa', fontSize: 13 }}>
      Cargando...
    </div>
  )

  const handleLogin = async () => {
    if (!email || !pass) { setError('Completá los campos'); return }
    setLoading(true); setError('')
    try {
      await login(email.trim(), pass)
    } catch {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', height: 38, padding: '0 12px',
    border: '0.5px solid var(--nd-border2)', borderRadius: 8,
    fontSize: 14, marginBottom: 14, boxSizing: 'border-box',
    fontFamily: 'var(--font-body)', background: 'var(--nd-white)'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Panel izquierdo */}
      <div style={{
        width: 240, background: 'var(--nd-dark)', display: 'flex',
        flexDirection: 'column', padding: '40px 24px', flexShrink: 0
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 20, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ color: '#fff' }}>ND</span>
            <span style={{ color: 'var(--nd-light)' }}>TRACKER</span>
            <span style={{ color: 'rgba(167,198,237,0.55)', fontSize: 13, marginLeft: 4 }}>5S</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: 6, textTransform: 'uppercase' }}>
            NovaDomus · Obra
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontFamily: 'var(--font-title)' }}>Metodología 5S</p>
          {[
            ['1S', 'Separar'],
            ['2S', 'Ordenar'],
            ['3S', 'Limpiar'],
            ['4S', 'Estandarizar'],
            ['5S', 'Autodisciplina']
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--nd-light)', minWidth: 20 }}>{n}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{t}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>V1.0</div>
      </div>

      {/* Panel derecho — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--nd-bg)' }}>
        <div style={{ background: 'var(--nd-white)', border: '0.5px solid var(--nd-border)', borderRadius: 12, padding: '40px 36px', width: 340 }}>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Iniciar sesión
          </h1>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>NDTracker 5S · NovaDomus</p>

          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Email</label>
          <input
            style={inp} type="email" placeholder="tu@novadomus.com.ar"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />

          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Contraseña</label>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <input
              style={{ ...inp, marginBottom: 0, paddingRight: 44 }}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              onMouseDown={() => setShowPass(true)}
              onMouseUp={() => setShowPass(false)}
              onMouseLeave={() => setShowPass(false)}
              onTouchStart={() => setShowPass(true)}
              onTouchEnd={() => setShowPass(false)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', lineHeight: 1, padding: 4, display: 'flex', alignItems: 'center' }}
            >
              {showPass
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>

          {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8, marginTop: 4 }}>{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', height: 40, background: 'var(--nd-black)', color: 'var(--nd-light)',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', marginTop: 12,
              fontFamily: 'var(--font-title)', letterSpacing: '0.06em',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Ingresando...' : 'INGRESAR →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ProtectedRoute ─────────────────────────────────────────────────────────
export function ProtectedRoute({ children, rolesPermitidos }) {
  const { usuarioActual, cargando } = useStore()
  const location = useLocation()

  if (cargando) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-title)', color: '#aaa', fontSize: 13 }}>
      Cargando...
    </div>
  )

  if (!usuarioActual) return <Navigate to="/login" replace />

  if (rolesPermitidos && !rolesPermitidos.includes(usuarioActual.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
