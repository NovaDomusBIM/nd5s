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
import { Personal } from '../features/personal'
import { Tablero } from '../features/tablero'
import { Estadisticas } from '../features/estadisticas'
import { Configuracion } from '../features/config'
import { CargaPublica } from '../features/carga'
import { LoadingScreen } from '../components/LoadingScreen'

const P = ({ children, roles }) => (
  <ProtectedRoute rolesPermitidos={roles}>{children}</ProtectedRoute>
)

export default function App() {
  const { initAuth, cargando } = useStore()
  useEffect(() => { initAuth() }, [])
  if (cargando) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/cargar"       element={<CargaPublica />} />
      <Route path="/login"        element={<Login />} />
      <Route path="/dashboard"    element={<P><Dashboard /></P>} />
      <Route path="/hallazgos"    element={<P><Hallazgos /></P>} />
      <Route path="/innecesarios" element={<P><Innecesarios /></P>} />
      <Route path="/tablero"      element={<P roles={['admin','direccion','jefe_obra','lider','sh']}><Tablero /></P>} />
      <Route path="/directorio"   element={<P roles={['admin','direccion','jefe_obra','lider','sh']}><Directorio /></P>} />
      <Route path="/personal"     element={<P roles={['admin','direccion','jefe_obra','lider','sh']}><Personal /></P>} />
      <Route path="/estadisticas" element={<P roles={['admin','direccion','jefe_obra','lider','sh']}><Estadisticas /></P>} />
      <Route path="/proyectos"    element={<P roles={['admin']}><Proyectos /></P>} />
      <Route path="/usuarios"     element={<P roles={['admin']}><Usuarios /></P>} />
      <Route path="/config"       element={<P roles={['admin']}><Configuracion /></P>} />
      <Route path="/perfil"       element={<P><Perfil /></P>} />
      <Route path="*"             element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
