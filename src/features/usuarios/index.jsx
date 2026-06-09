import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Users, ExternalLink, Copy, Check } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Layout, PageWrap, Topbar, Card, CardTitle, Btn, Input, Select, Modal, EmptyState, Avatar, RolBadge, Badge } from '../../components'
import { ROLES } from '../../data/mock'

const COLORES = ['#425563','#5B9BD5','#8E44AD','#27AE60','#C47436','#C0392B','#2980B9','#F39C12']

export function Usuarios() {
  const { usuarios, agregarUsuario, actualizarUsuario, eliminarUsuario } = useStore()
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState({})
  const [pass,    setPass]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [copiado, setCopiado] = useState(false)

  const passGen = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const abrirNuevo = () => {
    const p = passGen()
    setForm({ nombre: '', iniciales: '', email: '', rol: 'lider', color: '#425563', telefono: '', activo: true })
    setPass(p)
    setModal('nuevo')
    setError('')
  }

  const abrirEditar = (u) => { setForm({ ...u }); setPass(''); setModal(u); setError('') }

  const copiarPass = () => {
    navigator.clipboard.writeText(pass).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000) })
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (modal === 'nuevo' && !form.email.trim()) { setError('El email es obligatorio'); return }
    if (!form.iniciales) form.iniciales = form.nombre.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
    setSaving(true)
    try {
      if (modal === 'nuevo') {
        await agregarUsuario(form)
      } else {
        await actualizarUsuario(modal.id, form)
      }
      setModal(null)
    } catch (e) { setError('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const eliminar = async (u) => {
    if (!confirm(`¿Eliminar a ${u.nombre}? También tenés que borrarlo de Firebase Authentication.`)) return
    await eliminarUsuario(u.id)
  }

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Usuarios" subtitle="Roles y accesos al sistema">
          <Btn onClick={abrirNuevo}><Plus size={14} /> Nuevo usuario</Btn>
        </Topbar>

        {/* Aviso Firebase Auth */}
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>Para que un usuario pueda entrar también necesita cuenta en Firebase Authentication.</span>
          <a href="https://console.firebase.google.com/project/ndtracker-14d4c/authentication/users" target="_blank" rel="noopener noreferrer">
            <Btn variant="amber" style={{ height: 28, fontSize: 12, flexShrink: 0 }}>
              <ExternalLink size={12} /> Abrir Firebase Auth
            </Btn>
          </a>
        </div>

        {usuarios.length === 0
          ? <EmptyState icon={Users} title="Sin usuarios" sub="Agregá los usuarios del sistema" action={<Btn onClick={abrirNuevo}>+ Agregar usuario</Btn>} />
          : <Card>
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
                      <td style={{ padding: '10px' }}>
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
        }

        <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0f4f8', borderRadius: 8, fontSize: 12, color: '#666' }}>
          Los operarios y referentes no necesitan cuenta. Acceden sin login — su nombre queda guardado en el dispositivo y todas las acciones quedan trazadas con device ID.
        </div>

        {/* Modal */}
        {modal && (
          <Modal title={modal === 'nuevo' ? 'Nuevo usuario' : 'Editar usuario'} onClose={() => setModal(null)} width={480}>

            {/* Pasos para nuevo usuario */}
            {modal === 'nuevo' && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: '#f0f9ff', borderRadius: 8, border: '0.5px solid #bae6fd' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>Pasos para crear el acceso completo:</p>
                <div style={{ fontSize: 12, color: '#0369a1', lineHeight: 1.8 }}>
                  <p>1. Completá los datos acá abajo y guardá</p>
                  <p>2. En Firebase Auth creá la cuenta con el mismo email</p>
                  <p>3. Mandále el email y la contraseña generada por WhatsApp</p>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Input label="Nombre completo" required placeholder="Juan Pérez" value={form.nombre || ''} onChange={e => {
                const n = e.target.value
                setForm(f => ({ ...f, nombre: n, iniciales: n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() }))
              }} />
              <Input label="Iniciales" placeholder="JP" maxLength={2} value={form.iniciales || ''} onChange={e => setForm(f => ({ ...f, iniciales: e.target.value.toUpperCase() }))} />
            </div>

            <Input label="Email" required={modal === 'nuevo'} type="email" placeholder="juan@novadomus.com.ar" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Teléfono (para WhatsApp)" type="tel" placeholder="5491112345678" value={form.telefono || ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />

            <Select label="Rol" required value={form.rol || 'lider'} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
              {Object.entries(ROLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>

            {/* Contraseña generada — solo en nuevo */}
            {modal === 'nuevo' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                  Contraseña sugerida
                  <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginLeft: 6 }}>generada automáticamente</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, height: 36, padding: '0 12px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, display: 'flex', alignItems: 'center', fontFamily: 'monospace', background: '#f9f9f9', color: '#333' }}>
                    {pass}
                  </div>
                  <Btn variant="secondary" onClick={copiarPass} style={{ flexShrink: 0 }}>
                    {copiado ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                  </Btn>
                  <Btn variant="secondary" onClick={() => setPass(passGen())} style={{ flexShrink: 0 }}>
                    Nueva
                  </Btn>
                </div>
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  Usá esta contraseña cuando creés la cuenta en Firebase Auth. Después mandásela al usuario.
                </p>
              </div>
            )}

            {/* Color */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, fontWeight: 600 }}>Color de avatar</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORES.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
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
