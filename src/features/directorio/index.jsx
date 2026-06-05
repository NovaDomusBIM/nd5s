import React, { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, Phone } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getCol, setItem, updateItem, deleteItem } from '../../services/firebase'
import {
  Layout, PageWrap, Topbar, Card, CardTitle, Btn,
  Input, Select, Modal, EmptyState, Avatar, Badge
} from '../../components'
import { RUBROS } from '../../data/mock'

const ROLES_DIRECTORIO = ['Jefe de Obra', 'Líder', 'Referente', 'Seguridad e Higiene', 'Capataz', 'Subcontratista', 'Otro']

export function Directorio() {
  const { proyectoActivo } = useStore()
  const [contactos, setContactos] = useState([])
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState({})
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [busqueda,  setBusqueda]  = useState('')

  // Cargar contactos del proyecto activo
  useEffect(() => {
    if (!proyectoActivo) return
    cargar()
  }, [proyectoActivo])

  const cargar = async () => {
    try {
      const todos = await getCol('directorio')
      setContactos(todos.filter(c => c.proyectoId === proyectoActivo?.id))
    } catch (e) { console.error(e) }
  }

  const abrirNuevo = () => {
    setForm({ nombre: '', iniciales: '', rol: 'Líder', rubro: '', telefono: '', email: '', observacion: '' })
    setModal('nuevo'); setError('')
  }

  const abrirEditar = (c) => { setForm({ ...c }); setModal(c); setError('') }

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    try {
      const data = {
        ...form,
        proyectoId: proyectoActivo.id,
        iniciales: form.iniciales || form.nombre.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase(),
        actualizadoEn: new Date().toISOString()
      }
      if (modal === 'nuevo') {
        const id = 'dir_' + Date.now()
        await setItem('directorio', id, { ...data, id, creadoEn: new Date().toISOString() })
      } else {
        await updateItem('directorio', modal.id, data)
      }
      await cargar()
      setModal(null)
    } catch (e) { setError('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const eliminar = async (c) => {
    if (!confirm(`¿Eliminar a ${c.nombre}?`)) return
    await deleteItem('directorio', c.id)
    await cargar()
  }

  const lista = contactos.filter(c =>
    !busqueda ||
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.rubro?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.rol?.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Agrupar por rol
  const grupos = lista.reduce((acc, c) => {
    const k = c.rol || 'Otro'
    if (!acc[k]) acc[k] = []
    acc[k].push(c)
    return acc
  }, {})

  const COLORES = ['#425563','#5B9BD5','#8E44AD','#27AE60','#C47436','#C0392B','#2980B9']

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Directorio" subtitle={`Líderes y referentes · ${proyectoActivo?.nombre || ''}`}>
          <Btn onClick={abrirNuevo}><Plus size={14} /> Agregar contacto</Btn>
        </Topbar>

        {/* Búsqueda */}
        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="Buscar por nombre, rubro o rol..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ width: '100%', maxWidth: 400, height: 34, padding: '0 12px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--nd-white)' }}
          />
        </div>

        {contactos.length === 0
          ? <EmptyState icon={Users} title="Sin contactos" sub="Agregá líderes, referentes y responsables de cada rubro" action={<Btn onClick={abrirNuevo}>+ Agregar primero</Btn>} />
          : Object.keys(grupos).length === 0
            ? <EmptyState icon={Users} title="Sin resultados" sub="Ningún contacto coincide con la búsqueda" />
            : Object.entries(grupos).map(([rol, items]) => (
                <div key={rol} style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--nd-mid)', fontFamily: 'var(--font-title)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{rol}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {items.map(c => (
                      <Card key={c.id} style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <Avatar iniciales={c.iniciales || c.nombre?.slice(0,2).toUpperCase()} color={c.color || '#425563'} size={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-title)', marginBottom: 2 }}>{c.nombre}</p>
                            {c.rubro && <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.rubro}</p>}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {c.telefono && (
                                <a href={`https://wa.me/${c.telefono.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#1a7a4a', textDecoration: 'none', fontWeight: 600 }}
                                  onClick={e => e.stopPropagation()}>
                                  <Phone size={12} /> {c.telefono}
                                </a>
                              )}
                              {c.email && <span style={{ fontSize: 12, color: '#aaa' }}>{c.email}</span>}
                            </div>
                            {c.observacion && <p style={{ fontSize: 11, color: '#bbb', marginTop: 6, fontStyle: 'italic' }}>{c.observacion}</p>}
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button onClick={() => abrirEditar(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 3 }}><Edit2 size={13} /></button>
                            <button onClick={() => eliminar(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 3 }}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
        }

        {/* Modal */}
        {modal && (
          <Modal title={modal === 'nuevo' ? 'Nuevo contacto' : 'Editar contacto'} onClose={() => setModal(null)} width={460}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Input label="Nombre completo" required placeholder="Juan Pérez" value={form.nombre || ''} onChange={e => {
                const n = e.target.value
                setForm(f => ({ ...f, nombre: n, iniciales: n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() }))
              }} />
              <Input label="Iniciales" maxLength={2} value={form.iniciales || ''} onChange={e => setForm(f => ({ ...f, iniciales: e.target.value.toUpperCase() }))} />
            </div>

            <Select label="Rol" value={form.rol || 'Líder'} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
              {ROLES_DIRECTORIO.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Rubro / Contrato</label>
              <input list="rubros-list" value={form.rubro || ''} onChange={e => setForm(f => ({ ...f, rubro: e.target.value }))}
                placeholder="Ej: Hormigón, Mampostería..."
                style={{ width: '100%', height: 36, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }} />
              <datalist id="rubros-list">
                {RUBROS.map(r => <option key={r.id} value={r.nombre} />)}
              </datalist>
            </div>

            <Input label="Teléfono (WhatsApp)" type="tel" placeholder="5491112345678" value={form.telefono || ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            <Input label="Email (opcional)" type="email" placeholder="juan@empresa.com" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Observación (opcional)</label>
              <input value={form.observacion || ''} onChange={e => setForm(f => ({ ...f, observacion: e.target.value }))} placeholder="Ej: Solo lunes y miércoles"
                style={{ width: '100%', height: 36, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            {/* Color */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, fontWeight: 600 }}>Color de avatar</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORES.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>

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
