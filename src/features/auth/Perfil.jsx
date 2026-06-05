import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, getNombreGuardado, setNombreGuardado } from '../../store/useStore'
import { Layout, PageWrap, Topbar, Card, CardTitle, Btn, Input, Avatar, RolBadge } from '../../components'

export function Perfil() {
  const { usuarioActual, logout } = useStore()
  const navigate = useNavigate()
  const [nombreGuardado, setNombre] = useState(getNombreGuardado)
  const [saved, setSaved] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const guardarNombre = () => {
    setNombreGuardado(nombreGuardado.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Mi perfil" />

        <div style={{ maxWidth: 480 }}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar iniciales={usuarioActual?.iniciales} color={usuarioActual?.color} size={48} />
              <div>
                <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 18, fontWeight: 700 }}>{usuarioActual?.nombre}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <RolBadge rol={usuarioActual?.rol} />
                  {usuarioActual?.email && <span style={{ fontSize: 12, color: '#aaa' }}>{usuarioActual.email}</span>}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '0.5px solid var(--nd-border)', paddingTop: 16 }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                {[
                  ['Rol', usuarioActual?.rol],
                  ['Device ID', localStorage.getItem('nd5s_device_id')?.slice(0, 20) + '...'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: '#888', padding: '5px 0', width: 100 }}>{k}</td>
                    <td style={{ fontWeight: 500 }}>{v}</td>
                  </tr>
                ))}
              </table>
            </div>
          </Card>

          {/* Nombre para carga rápida (operarios) */}
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>Nombre para carga rápida</CardTitle>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
              Este nombre se usa al cargar hallazgos sin login completo. Queda guardado en este dispositivo.
            </p>
            <Input
              label="Tu nombre"
              placeholder="Ej: Juan Pérez"
              value={nombreGuardado}
              onChange={e => { setNombre(e.target.value); setSaved(false) }}
            />
            <Btn onClick={guardarNombre} variant={saved ? 'green' : 'primary'}>
              {saved ? '✓ Guardado' : 'Guardar nombre'}
            </Btn>
          </Card>

          <Btn variant="danger" onClick={handleLogout}>Cerrar sesión</Btn>
        </div>
      </PageWrap>
    </Layout>
  )
}
