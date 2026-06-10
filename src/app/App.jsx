import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Login, ProtectedRoute } from '../features/auth'
import { Perfil } from '../features/auth/Perfil'
import { Dashboard } from '../features/dashboard'
import { Proyectos } from '../features/proyectos'
import { Usuarios } from '../features/usuarios'
import { Hallazgos } from '../features/hallazgos'
import { Innecesarios } from '../features/innecesarios'
import { Directorio } from '../features/directorio'
import { Tablero } from '../features/tablero'
import { Estadisticas } from '../features/estadisticas'
import { Configuracion } from '../features/config'

const P = ({ children, roles }) => (
  <ProtectedRoute rolesPermitidos={roles}>{children}</ProtectedRoute>
)

// Si hay usuario logueado y va a /login, mandarlo al dashboard
function LoginRoute() {
  const { usuarioActual, cargando } = useStore()
  if (cargando) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--nd-bg)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(66,85,99,0.2)', borderTopColor: 'var(--nd-mid)', animation: 'spin .7s linear infinite' }} />
    </div>
  )
  if (usuarioActual) return <Navigate to="/dashboard" replace />
  return <Login />
}

export default function App() {
  const { initAuth } = useStore()
  useEffect(() => { initAuth() }, [])

  return (
    <Routes>
      <Route path="/login"        element={<LoginRoute />} />
      <Route path="/dashboard"    element={<P><Dashboard /></P>} />
      <Route path="/hallazgos"    element={<P><Hallazgos /></P>} />
      <Route path="/innecesarios" element={<P><Innecesarios /></P>} />
      <Route path="/tablero"      element={<P roles={['admin','direccion','jefe_obra','lider','sh']}><Tablero /></P>} />
      <Route path="/directorio"   element={<P roles={['admin','direccion','jefe_obra','lider','sh']}><Directorio /></P>} />
      <Route path="/estadisticas" element={<P roles={['admin','direccion','jefe_obra','lider','sh']}><Estadisticas /></P>} />
      <Route path="/proyectos"    element={<P roles={['admin']}><Proyectos /></P>} />
      <Route path="/usuarios"     element={<P roles={['admin']}><Usuarios /></P>} />
      <Route path="/config"       element={<P roles={['admin']}><Configuracion /></P>} />
      <Route path="/perfil"       element={<P><Perfil /></P>} />
      <Route path="*"             element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
