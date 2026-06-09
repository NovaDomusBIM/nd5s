import React, { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, Phone, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getCol, setItem, updateItem, deleteItem } from '../../services/firebase'
import {
  Layout, PageWrap, Topbar, Card, Btn,
  Input, Select, Modal, EmptyState, Avatar, Badge
} from '../../components'
import { RUBROS } from '../../data/mock'

const ROLES_DIRECTORIO = ['Jefe de Obra', 'Líder', 'Referente', 'Seguridad e Higiene', 'Capataz', 'Subcontratista', 'Otro']
const COLORES = ['#425563','#5B9BD5','#8E44AD','#27AE60','#C47436','#C0392B','#2980B9','#F39C12']

export function Directorio() {
  const { proyectoActivo } = useStore()
  const [contactos, setContactos] = useState([])
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState({})
  const [rubroInput, setRubroInput] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [busqueda,  setBusqueda]  = useState('')

  useEffect(() => { if (proyectoActivo) cargar() }, [proyectoActivo])

  const cargar = async () => {
    try {
      const todos = await getCol('directorio')
      setContactos(todos.filter(c => c.proyectoId === proyectoActivo?.id))
    } catch (e) { console.error(e) }
  }

  const abrirNuevo = () => {
    setForm({ nombre: '', iniciales: '', rol: 'Líder', rubros: [], telefono: '', email: '', observacion: '', color: '#425563' })
    setRubroInput('')
    setModal('nuevo'); setError('')
  }

  const abrirEditar = (c) => {
    setForm({ ...c, rubros: c.rubros || (c.rubro ? [c.rubro] : []) })
    setRubroInput('')
    setModal(c); setError('')
  }

  // Agregar rubro al array
  const agregarRubro = () => {
    const r = rubroInput.trim()
    if (!r) return
    if (form.rubros?.includes(r)) { setRubroInput(''); return }
    setForm(f => ({ ...f, rubros: [...(f.rubros || []), r] }))
    setRubroInput('')
  }

  const quitarRubro = (r) => {
    setForm(f => ({ ...f, rubros: f.rubros.filter(x => x !== r) }))
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    try {
      const iniciales = form.iniciales || form.nombre.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()
      const data = {
        ...form,
        proyectoId:    proyectoActivo.id,
        iniciales,
        rubros:        Array.isArray(form.rubros) ? form.rubros : (form.rubro ? [form.rubro] : []),
        rubro:         null,  // limpiar campo viejo
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
    c.rubros?.some(r => r.toLowerCase().includes(busqueda.toLowerCase())) ||
    c.rol?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const grupos = lista.reduce((acc, c) => {
    const k = c.rol || 'Otro'
    if (!acc[k]) acc[k] = []
    acc[k].push(c)
    return acc
  }, {})

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Directorio" subtitle={`Líderes y referentes · ${proyectoActivo?.nombre || ''}`}>
          <Btn onClick={abrirNuevo}><Plus size={14} /> Agregar contacto</Btn>
        </Topbar>

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
                            <p style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-title)', marginBottom: 4 }}>{c.nombre}</p>

                            {/* Rubros como chips */}
                            {(c.rubros?.length > 0 || c.rubro) && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                                {(c.rubros?.length > 0 ? c.rubros : [c.rubro]).map(r => (
                                  <span key={r} style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, background: 'rgba(66,85,99,0.08)', color: 'var(--nd-mid)', fontWeight: 500 }}>{r}</span>
                                ))}
                              </div>
                            )}

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

        {modal && (
          <Modal title={modal === 'nuevo' ? 'Nuevo contacto' : 'Editar contacto'} onClose={() => setModal(null)} width={480}>
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

            {/* Rubros múltiples */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                Rubros / Contratos
                <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginLeft: 6 }}>puede tener varios</span>
              </label>

              {/* Chips de rubros agregados */}
              {form.rubros?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {form.rubros.map(r => (
                    <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(66,85,99,0.1)', color: 'var(--nd-mid)', fontWeight: 500 }}>
                      {r}
                      <button onClick={() => quitarRubro(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2 }}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input + botón agregar */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    value={rubroInput}
                    onChange={e => setRubroInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarRubro() } }}
                    placeholder="Escribí el rubro y tocá Agregar o Enter..."
                    style={{ width: '100%', height: 36, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  <datalist id="rubros-list-hidden">
                    {RUBROS.map(r => <option key={r.id} value={r.nombre} />)}
                  </datalist>
                </div>
                <Btn variant="secondary" onClick={agregarRubro} style={{ flexShrink: 0 }}>
                  + Agregar
                </Btn>
              </div>
              {/* Sugerencias rápidas */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {['HyS','Hormigón','Mampostería','Sanitario','Electricidad','Climatización','Herrería','Revoques','Yesería','Pintura','Carpintería','Pisos','Limpieza'].filter(s => !form.rubros?.includes(s)).slice(0,8).map(s => (
                  <button key={s} type="button" onClick={() => { setRubroInput(''); setForm(f => ({ ...f, rubros: [...(f.rubros||[]), s] })) }}
                    style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, border: '0.5px solid var(--nd-border2)', background: 'transparent', cursor: 'pointer', color: '#888', fontFamily: 'var(--font-body)' }}>
                    + {s}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Escribí el nombre y presioná "Agregar" o Enter. También podés tocar las sugerencias de arriba.</p>
            </div>

            <Input label="Teléfono (WhatsApp)" type="tel" placeholder="5491112345678" value={form.telefono || ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            <Input label="Email (opcional)" type="email" placeholder="juan@empresa.com" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Observación (opcional)</label>
              <input value={form.observacion || ''} onChange={e => setForm(f => ({ ...f, observacion: e.target.value }))} placeholder="Ej: Solo lunes y miércoles"
                style={{ width: '100%', height: 36, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }} />
            </div>

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
