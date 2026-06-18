import React, { useState, useMemo, useRef } from 'react'
import { Package, Plus, Camera, X, CheckCircle } from 'lucide-react'
import { useStore, getNombreGuardado, setNombreGuardado } from '../../store/useStore'
import { subirFoto, comprimirImagen } from '../../services/firebase'
import { updateItem } from '../../services/firebase'
import {
  Layout, PageWrap, Topbar, Card, CardTitle, Btn,
  Input, Select, Modal, EmptyState, Badge, Spinner
} from '../../components'
import { fmtFecha, fmtFechaHora, truncar } from '../../utils'
import { DESTINOS_INNECESARIO, RUBROS } from '../../data/mock'

const ESTADOS = {
  pendiente: { label: 'Pendiente', color: '#b86a00', bg: '#fef3c7' },
  cerrado:   { label: 'Cerrado',   color: '#1a7a4a', bg: '#d1fae5' }
}

// ── Formulario nuevo innecesario ─────────────────────────────────────────────
function FormNuevo({ onClose }) {
  const { proyectoActivo, agregarInnecesario } = useStore()
  const [nombre,   setNombre]   = useState(getNombreGuardado)
  const [nivel,    setNivel]    = useState('')
  const [detalle,  setDetalle]  = useState('')
  const [cantidad, setCantidad] = useState('')
  const [causa,    setCausa]    = useState('')
  const [foto,     setFoto]     = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const fileRef = useRef()

  const niveles = proyectoActivo?.niveles || []

  const handleFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const blob = await comprimirImagen(file, 150)
      setFoto(blob); setFotoPreview(URL.createObjectURL(blob))
    } catch { setError('Error al procesar la foto') }
  }

  const guardar = async () => {
    if (!nombre.trim()) { setError('Escribí tu nombre'); return }
    if (!nivel)         { setError('Seleccioná el sector'); return }
    if (!detalle.trim()){ setError('Describí el elemento innecesario'); return }
    setSaving(true); setError('')
    try {
      setNombreGuardado(nombre.trim())
      const id = await agregarInnecesario({
        nombreCargador: nombre.trim(),
        nivel,
        detalle:  detalle.trim(),
        cantidad: cantidad.trim(),
        causa:    causa.trim(),
        destino:  null,
        responsable: null,
        fechaSolucion: null
      })
      if (foto) {
        const url = await subirFoto(proyectoActivo.id, id, foto, 'innec')
        await updateItem('innecesarios', id, { foto: url })
      }
      onClose()
    } catch (e) {
      setError('Error: ' + e.message)
      setSaving(false)
    }
  }

  return (
    <div>
      <Input label="Tu nombre" required placeholder="Ej: Juan Pérez" value={nombre} onChange={e => setNombre(e.target.value)} />

      <Select label="Sector / piso" required value={nivel} onChange={e => setNivel(e.target.value)}>
        <option value="">Seleccioná el sector...</option>
        {niveles.map(n => <option key={n} value={n}>{n}</option>)}
      </Select>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
          Detalle del innecesario <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <textarea rows={2} placeholder="Qué es el elemento innecesario..." value={detalle} onChange={e => setDetalle(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Cantidad" placeholder="Ej: 3 unidades, 2 bolsas" value={cantidad} onChange={e => setCantidad(e.target.value)} />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Causa</label>
          <input placeholder="Por qué está ahí..." value={causa} onChange={e => setCausa(e.target.value)}
            style={{ width: '100%', height: 36, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Foto */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, fontWeight: 600 }}>Foto (opcional)</label>
        {fotoPreview
          ? <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={fotoPreview} alt="preview" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '0.5px solid var(--nd-border2)' }} />
              <button onClick={() => { setFoto(null); setFotoPreview(null) }} style={{ position: 'absolute', top: -6, right: -6, background: '#dc2626', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={11} /></button>
            </div>
          : <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '0.5px dashed var(--nd-border2)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#888', fontFamily: 'var(--font-body)' }}>
              <Camera size={16} /> Sacar o subir foto
            </button>
        }
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />
      </div>

      {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Btn>
        <Btn onClick={guardar} disabled={saving}>
          {saving ? <><Spinner size={14} color="#A7C6ED" /> Guardando...</> : '+ Registrar'}
        </Btn>
      </div>
    </div>
  )
}

// ── Modal detalle innecesario ─────────────────────────────────────────────────
function ModalDetalle({ item, onClose }) {
  const { actualizarInnecesario, usuarioActual, usuarios, proyectoActivo } = useStore()
  const rol = usuarioActual?.rol
  const puedeGestionar = ['admin','direccion','jefe_obra','lider','sh'].includes(rol)
  const [editando, setEditando] = useState(false)
  const [form, setForm]         = useState({ ...item })
  const [saving, setSaving]     = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [obs, setObs]           = useState('')

  const { directorio } = useStore()
  const lideres = [
    ...directorio.filter(d => d.proyectoId === proyectoActivo?.id).map(d => ({ id: d.id, nombre: d.nombre, info: d.rubros?.join(', ') || d.rol || '' })),
    ...usuarios.filter(u => ['admin','direccion','jefe_obra','lider','sh'].includes(u.rol) && u.activo !== false && !directorio.find(d => d.nombre === u.nombre)).map(u => ({ id: u.id, nombre: u.nombre, info: u.rol }))
  ]
  const est = ESTADOS[item.estado] || ESTADOS.pendiente

  const guardar = async () => {
    setSaving(true)
    try {
      await actualizarInnecesario(item.id, {
        destino:      form.destino      || null,
        responsable:  form.responsable  || null,
        fechaSolucion:form.fechaSolucion|| null,
        observacion:  form.observacion  || null
      })
      setEditando(false)
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const cerrar = async () => {
    setSaving(true)
    try {
      await actualizarInnecesario(item.id, {
        estado: 'cerrado',
        observacionCierre: obs.trim(),
        cerradoEn: new Date().toISOString()
      })
      onClose()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Innecesario" onClose={onClose} width={500}>
      {/* Estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: est.bg, borderRadius: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: est.color }}>{est.label}</span>
        <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>{fmtFechaHora(item.creadoEn)} · {item.creadoPor}</span>
      </div>

      {/* Foto */}
      {item.foto && <img src={item.foto} alt="Innecesario" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16, border: '0.5px solid var(--nd-border)' }} />}

      {/* Info */}
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 16 }}>
        {[
          ['Sector',    item.nivel],
          ['Detalle',   item.detalle],
          item.cantidad ? ['Cantidad', item.cantidad] : null,
          item.causa    ? ['Causa',    item.causa]    : null,
        ].filter(Boolean).map(([k, v]) => (
          <tr key={k} style={{ borderBottom: '0.5px solid var(--nd-border)' }}>
            <td style={{ color: '#888', padding: '7px 0', width: 100, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-title)' }}>{k}</td>
            <td style={{ padding: '7px 0 7px 8px' }}>{v}</td>
          </tr>
        ))}
      </table>

      {/* Gestión */}
      {puedeGestionar && item.estado !== 'cerrado' && (
        <div style={{ borderTop: '0.5px solid var(--nd-border)', paddingTop: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--nd-mid)', fontFamily: 'var(--font-title)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gestión</span>
            {!editando && <Btn variant="secondary" style={{ height: 28, fontSize: 12 }} onClick={() => setEditando(true)}>Editar</Btn>}
          </div>

          {editando ? (
            <div>
              <Select label="Destino" value={form.destino || ''} onChange={e => setForm(f => ({ ...f, destino: e.target.value }))}>
                <option value="">Sin definir</option>
                {DESTINOS_INNECESARIO.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Responsable</label>
                <input
                  list="lideres-innec-list"
                  value={form.responsable || ''}
                  onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                  placeholder="Escribí el nombre..."
                  style={{ width: '100%', height: 36, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, boxSizing: 'border-box', fontFamily: 'var(--font-body)', background: 'var(--nd-white)' }}
                />
                <datalist id="lideres-innec-list">
                  {lideres.sort((a,b) => a.nombre.localeCompare(b.nombre)).map((u,i) => (
                    <option key={u.id||i} value={u.nombre} label={u.nombre + (u.info ? ' — ' + u.info : '')} />
                  ))}
                </datalist>
              </div>
              <Input label="Fecha solución" type="date" value={form.fechaSolucion || ''} onChange={e => setForm(f => ({ ...f, fechaSolucion: e.target.value }))} />
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Observación</label>
                <textarea rows={2} value={form.observacion || ''} onChange={e => setForm(f => ({ ...f, observacion: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" onClick={() => setEditando(false)}>Cancelar</Btn>
                <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              {[
                ['Destino',     item.destino     || <span style={{ color: '#aaa' }}>Sin definir</span>],
                ['Responsable', item.responsable || <span style={{ color: '#aaa' }}>Sin asignar</span>],
                item.fechaSolucion ? ['Fecha sol.', fmtFecha(item.fechaSolucion)] : null,
                item.observacion   ? ['Obs.',       item.observacion]             : null,
              ].filter(Boolean).map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '0.5px solid var(--nd-border)' }}>
                  <td style={{ color: '#888', padding: '7px 0', width: 100, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-title)' }}>{k}</td>
                  <td style={{ padding: '7px 0 7px 8px' }}>{v}</td>
                </tr>
              ))}
            </table>
          )}
        </div>
      )}

      {/* Cierre */}
      {puedeGestionar && item.estado !== 'cerrado' && (
        <div style={{ borderTop: '0.5px solid var(--nd-border)', paddingTop: 16 }}>
          {cerrando ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Observación de cierre (opcional)</label>
                <textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Cómo se resolvió..."
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" onClick={() => setCerrando(false)}>Cancelar</Btn>
                <Btn variant="green" onClick={cerrar} disabled={saving}>{saving ? 'Cerrando...' : '✓ Cerrar innecesario'}</Btn>
              </div>
            </div>
          ) : (
            <Btn variant="green" onClick={() => setCerrando(true)}><CheckCircle size={14} /> Marcar como cerrado</Btn>
          )}
        </div>
      )}

      {item.estado === 'cerrado' && (
        <div style={{ background: '#d1fae5', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#065f46', marginBottom: item.observacionCierre ? 4 : 0 }}>✓ Cerrado el {fmtFecha(item.cerradoEn)}</p>
          {item.observacionCierre && <p style={{ fontSize: 13, color: '#047857' }}>{item.observacionCierre}</p>}
        </div>
      )}
    </Modal>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export function Innecesarios() {
  const { innecesarios, proyectoActivo } = useStore()
  const [modalNuevo,   setModalNuevo]   = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroNivel,  setFiltroNivel]  = useState('todos')

  const niveles = proyectoActivo?.niveles || []

  const lista = useMemo(() => innecesarios
    .filter(i => i.proyectoId === proyectoActivo?.id)
    .filter(i => filtroEstado === 'todos' || i.estado === filtroEstado)
    .filter(i => filtroNivel  === 'todos' || i.nivel  === filtroNivel)
    .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))
  , [innecesarios, proyectoActivo, filtroEstado, filtroNivel])

  const counts = useMemo(() => ({
    todos:    innecesarios.filter(i => i.proyectoId === proyectoActivo?.id).length,
    pendiente:innecesarios.filter(i => i.proyectoId === proyectoActivo?.id && i.estado === 'pendiente').length,
    cerrado:  innecesarios.filter(i => i.proyectoId === proyectoActivo?.id && i.estado === 'cerrado').length,
  }), [innecesarios, proyectoActivo])

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Innecesarios" subtitle={`1S — Separar · ${proyectoActivo?.nombre || ''}`}>
          <Btn onClick={() => setModalNuevo(true)}><Plus size={14} /> Registrar innecesario</Btn>
        </Topbar>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[['todos','Todos',counts.todos],['pendiente','Pendientes',counts.pendiente],['cerrado','Cerrados',counts.cerrado]].map(([val, lbl, cnt]) => (
            <button key={val} onClick={() => setFiltroEstado(val)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: '0.5px solid', fontFamily: 'var(--font-title)', fontWeight: 600,
              borderColor: filtroEstado === val ? 'var(--nd-black)' : 'var(--nd-border2)',
              background:  filtroEstado === val ? 'var(--nd-black)' : 'transparent',
              color:       filtroEstado === val ? 'var(--nd-light)'  : '#888'
            }}>{lbl} {cnt > 0 && <span style={{ opacity: 0.7 }}>({cnt})</span>}</button>
          ))}
          <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}
            style={{ height: 30, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 20, fontSize: 12, fontFamily: 'var(--font-body)', background: 'var(--nd-white)', cursor: 'pointer' }}>
            <option value="todos">Todos los niveles</option>
            {niveles.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Lista */}
        {lista.length === 0
          ? <EmptyState icon={Package} title="Sin innecesarios registrados" sub={counts.todos === 0 ? "Registrá elementos innecesarios encontrados en obra" : "No hay ítems con esos filtros"} action={counts.todos === 0 && <Btn onClick={() => setModalNuevo(true)}>+ Registrar primero</Btn>} />
          : <Card style={{ padding: 0, overflow: 'hidden' }}>
              {lista.map((item, i) => {
                const est = ESTADOS[item.estado] || ESTADOS.pendiente
                return (
                  <div key={item.id} onClick={() => setModalDetalle(item)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: i < lista.length - 1 ? '0.5px solid var(--nd-border)' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {item.foto
                      ? <img src={item.foto} alt="" style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '0.5px solid var(--nd-border)' }} />
                      : <div style={{ width: 52, height: 40, background: 'var(--nd-bg)', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid var(--nd-border)' }}>
                          <Package size={16} color="#ccc" />
                        </div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--nd-black)', marginBottom: 3 }}>{truncar(item.detalle, 70)}</p>
                      <p style={{ fontSize: 11, color: '#aaa' }}>
                        {item.nivel} · {fmtFecha(item.creadoEn)} · {item.creadoPor}
                        {item.cantidad ? ` · ${item.cantidad}` : ''}
                        {item.destino  ? ` · Destino: ${item.destino}` : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: est.bg, color: est.color, fontWeight: 600, fontFamily: 'var(--font-title)', whiteSpace: 'nowrap', flexShrink: 0 }}>{est.label}</span>
                  </div>
                )
              })}
            </Card>
        }

        {modalNuevo   && <Modal title="Registrar innecesario" onClose={() => setModalNuevo(false)} width={480}><FormNuevo onClose={() => setModalNuevo(false)} /></Modal>}
        {modalDetalle && <ModalDetalle item={modalDetalle} onClose={() => setModalDetalle(null)} />}
      </PageWrap>
    </Layout>
  )
}
