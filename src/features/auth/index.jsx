import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'

export function Login() {
  const { login, usuarioActual, cargando } = useStore()
  const navigate   = useNavigate()
  const [email,    setEmail]    = useState('')
  const [pass,     setPass]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Cuando initAuth termina de resolver el usuario, redirige
  useEffect(() => {
    if (!cargando && usuarioActual) {
      navigate('/dashboard', { replace: true })
    }
  }, [cargando, usuarioActual])

  // Mostrar pantalla de carga mientras initAuth trabaja
  if (cargando) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--nd-bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-title)', fontSize: 18, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 16 }}>
          <span style={{ color: 'var(--nd-black)' }}>ND</span>
          <span style={{ color: 'var(--nd-mid)' }}>TRACKER</span>
          <span style={{ color: 'var(--nd-mid)' }}> 5S</span>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--nd-mid)20', borderTopColor: 'var(--nd-mid)', animation: 'spin .7s linear infinite', margin: '0 auto' }} />
      </div>
    </div>
  )

  const handleLogin = async () => {
    if (!email || !pass) { setError('Completá los campos'); return }
    setLoading(true); setError('')
    try {
      // login() solo hace signIn en Firebase Auth.
      // onAuthStateChanged dispara initAuth() que resuelve el rol desde Firestore.
      // El useEffect de arriba redirige cuando cargando pasa a false y hay usuarioActual.
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
      <div style={{ width: 240, background: 'var(--nd-dark)', display: 'flex', flexDirection: 'column', padding: '40px 24px', flexShrink: 0 }} className="login-panel">
        <style>{`@media (max-width: 600px) { .login-panel { display: none !important; } }`}</style>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 20, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ color: '#fff' }}>ND</span>
            <span style={{ color: 'var(--nd-light)' }}>TRACKER</span>
            <span style={{ color: 'var(--nd-light)', fontSize: 20, marginLeft: 2 }}>5S</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: 6, textTransform: 'uppercase' }}>
            NovaDomus · Obra
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontFamily: 'var(--font-title)' }}>Metodología 5S</p>
          {[['1S','Separar'],['2S','Ordenar'],['3S','Limpiar'],['4S','Estandarizar'],['5S','Autodisciplina']].map(([n,t]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--nd-light)', minWidth: 20 }}>{n}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>V1.7</div>
      </div>

      {/* Panel derecho */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--nd-bg)', padding: 16 }}>
        <div style={{ background: 'var(--nd-white)', border: '0.5px solid var(--nd-border)', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 340 }}>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Iniciar sesión</h1>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>NDTracker 5S · NovaDomus</p>

          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Email</label>
          <input style={inp} type="email" placeholder="tu@novadomus.com.ar" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />

          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Contraseña</label>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <input style={{ ...inp, marginBottom: 0, paddingRight: 44 }}
              type={showPass ? 'text' : 'password'} placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button type="button"
              onMouseDown={() => setShowPass(true)} onMouseUp={() => setShowPass(false)}
              onMouseLeave={() => setShowPass(false)} onTouchStart={() => setShowPass(true)} onTouchEnd={() => setShowPass(false)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4, display: 'flex', alignItems: 'center' }}>
              {showPass
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>

          {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8, marginTop: 4 }}>{error}</p>}

          <button onClick={handleLogin} disabled={loading} style={{
            width: '100%', height: 40, background: 'var(--nd-black)', color: 'var(--nd-light)',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer', marginTop: 12,
            fontFamily: 'var(--font-title)', letterSpacing: '0.06em', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Verificando...' : 'INGRESAR →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children, rolesPermitidos }) {
  const { usuarioActual, cargando } = useStore()

  if (cargando) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--nd-bg)' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--nd-mid)20', borderTopColor: 'var(--nd-mid)', animation: 'spin .7s linear infinite' }} />
    </div>
  )

  if (!usuarioActual) return <Navigate to="/login" replace />
  if (rolesPermitidos && !rolesPermitidos.includes(usuarioActual.rol)) return <Navigate to="/dashboard" replace />

  return children
}
