import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Layout, PageWrap, Topbar, Card, Btn, Input, Select, Modal, EmptyState, Avatar, RolBadge, Badge } from '../../components'
import { ROLES } from '../../data/mock'

export function Usuarios() {
  const { usuarios, agregarUsuario, actualizarUsuario, eliminarUsuario, proyectos } = useStore()
  const [modal, setModal]   = useState(null)
  const [form, setForm]     = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const abrirNuevo = () => {
    setForm({ nombre: '', iniciales: '', email: '', rol: 'lider', color: '#425563', telefono: '', activo: true })
    setModal('nuevo')
    setError('')
  }

  const abrirEditar = (u) => {
    setForm({ ...u })
    setModal(u)
    setError('')
  }

  const guardar = async () => {
    if (!form.nombre || !form.rol) { setError('Nombre y rol son obligatorios'); return }
    if (!form.iniciales) form.iniciales = form.nombre.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
    setSaving(true)
    try {
      if (modal === 'nuevo') {
        await agregarUsuario(form)
      } else {
        await actualizarUsuario(modal.id, form)
      }
      setModal(null)
    } catch (e) {
      setError('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (u) => {
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return
    await eliminarUsuario(u.id)
  }

  const COLORES = ['#425563','#5B9BD5','#8E44AD','#27AE60','#C47436','#C0392B','#2980B9','#F39C12']

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Usuarios" subtitle="Roles y accesos al sistema">
          <Btn onClick={abrirNuevo}><Plus size={14} /> Nuevo usuario</Btn>
        </Topbar>

        {usuarios.length === 0 ? (
          <EmptyState icon={Users} title="Sin usuarios" sub="Agregá los usuarios que van a usar el sistema" action={<Btn onClick={abrirNuevo}>+ Agregar usuario</Btn>} />
        ) : (
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--nd-border2)' }}>
                  {['Usuario','Email','Rol','Teléfono','Estado',''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, color: 'var(--nd-mid)', fontFamily: 'var(--font-title)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} style={{ borderBottom: '0.5px solid var(--nd-border)' }}>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar iniciales={u.iniciales} color={u.color} size={28} />
                        <span style={{ fontWeight: 600 }}>{u.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px', color: '#666' }}>{u.email || '-'}</td>
                    <td style={{ padding: '10px' }}><RolBadge rol={u.rol} /></td>
                    <td style={{ padding: '10px', color: '#666' }}>{u.telefono || '-'}</td>
                    <td style={{ padding: '10px' }}>
                      <Badge color={u.activo !== false ? 'green' : 'soft'}>
                        {u.activo !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => abrirEditar(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}><Edit2 size={13} /></button>
                        <button onClick={() => eliminar(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4 }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Nota operarios */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef3c7', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
          Los operarios y referentes no necesitan cuenta. Acceden sin login — su nombre queda guardado en el dispositivo y todas las acciones quedan trazadas con device ID.
        </div>

        {/* Modal */}
        {modal && (
          <Modal title={modal === 'nuevo' ? 'Nuevo usuario' : 'Editar usuario'} onClose={() => setModal(null)} width={460}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Input label="Nombre completo" required placeholder="Juan Pérez" value={form.nombre || ''} onChange={e => {
                const n = e.target.value
                setForm(f => ({ ...f, nombre: n, iniciales: n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() }))
              }} />
              <Input label="Iniciales" placeholder="JP" maxLength={2} value={form.iniciales || ''} onChange={e => setForm(f => ({ ...f, iniciales: e.target.value.toUpperCase() }))} />
            </div>

            <Input label="Email" type="email" placeholder="juan@novadomus.com.ar" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Teléfono (para WhatsApp)" type="tel" placeholder="5491112345678" value={form.telefono || ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />

            <Select label="Rol" required value={form.rol || 'lider'} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
              {Object.entries(ROLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>

            {/* Color picker */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, fontWeight: 600 }}>Color de avatar</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORES.map(c => (
                  <div
                    key={c}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                      outline: form.color === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2
                    }}
                  />
                ))}
              </div>
            </div>

            <Select label="Estado" value={form.activo !== false ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, activo: e.target.value === 'true' }))}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>

            {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
            </div>
          </Modal>
        )}
      </PageWrap>
    </Layout>
  )
}
