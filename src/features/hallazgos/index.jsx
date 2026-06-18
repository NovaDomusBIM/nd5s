import React, { useState, useMemo, useRef } from 'react'
import { AlertTriangle, Plus, Camera, X, Filter, ChevronDown, ExternalLink, CheckCircle, Clock, Phone } from 'lucide-react'
import { useStore, getNombreGuardado, setNombreGuardado } from '../../store/useStore'
import { subirFoto, comprimirImagen } from '../../services/firebase'
import {
  Layout, PageWrap, Topbar, Card, CardTitle, Btn,
  Input, Textarea, Select, Modal, EmptyState, Avatar, Badge, Spinner
} from '../../components'
import { fmtFecha, fmtFechaHora, semaforo, wappLink, puedeAsignar, puedeCerrar, hoy, truncar } from '../../utils'

// ── Formulario de carga rápida (operario / cualquier usuario) ───────────────
function FormNuevoHallazgo({ onClose, onGuardado }) {
  const { proyectoActivo, agregarHallazgo, usuarios } = useStore()
  const [nombre,      setNombre]      = useState(getNombreGuardado)
  const [nivel,       setNivel]       = useState('')
  const [zona,        setZona]        = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [observacion, setObservacion] = useState('')
  const [foto,        setFoto]        = useState(null)   // blob comprimido
  const [fotoPreview, setFotoPreview] = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const fileRef = useRef()

  const niveles = proyectoActivo?.niveles || []

  const handleFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const blob = await comprimirImagen(file, 150)
      setFoto(blob)
      setFotoPreview(URL.createObjectURL(blob))
    } catch { setError('Error al procesar la foto') }
  }

  const guardar = async () => {
    if (!nombre.trim())      { setError('Escribí tu nombre'); return }
    if (!nivel)              { setError('Seleccioná el nivel/sector'); return }
    if (!descripcion.trim()) { setError('Describí el hallazgo'); return }
    setSaving(true); setError('')
    try {
      setNombreGuardado(nombre.trim())
      const id = await agregarHallazgo({
        nombreCargador: nombre.trim(),
        nivel, zona: zona.trim(),
        descripcion: descripcion.trim(),
        observacion: observacion.trim(),
        fechaLimite: null, responsable: null, solucion: null
      })
      // Subir foto si hay
      if (foto) {
        const { subirFoto: sf } = await import('../../services/firebase')
        const url = await sf(proyectoActivo.id, id, foto, 'apertura')
        const { updateItem } = await import('../../services/firebase')
        await updateItem('hallazgos', id, { fotoApertura: url })
      }
      onGuardado?.()
      onClose()
    } catch (e) {
      setError('Error al guardar: ' + e.message)
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Nombre */}
      <Input
        label="Tu nombre"
        required
        placeholder="Ej: Juan Pérez"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
      />

      {/* Nivel */}
      <Select label="Nivel / sector" required value={nivel} onChange={e => setNivel(e.target.value)}>
        <option value="">Seleccioná el sector...</option>
        {niveles.map(n => <option key={n} value={n}>{n}</option>)}
      </Select>

      {/* Zona libre */}
      <Input
        label="Zona específica (opcional)"
        placeholder="Ej: Escalera, Eje C, Baño unidad 3"
        value={zona}
        onChange={e => setZona(e.target.value)}
      />

      {/* Descripción */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
          Descripción del hallazgo <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <textarea
          rows={3}
          placeholder="Describí qué encontraste..."
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {/* Observación */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
          Observación (opcional)
        </label>
        <textarea
          rows={2}
          placeholder="Algún detalle adicional..."
          value={observacion}
          onChange={e => setObservacion(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {/* Foto */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, fontWeight: 600 }}>Foto (opcional)</label>
        {fotoPreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={fotoPreview} alt="preview" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '0.5px solid var(--nd-border2)' }} />
            <button onClick={() => { setFoto(null); setFotoPreview(null) }} style={{ position: 'absolute', top: -6, right: -6, background: '#dc2626', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '0.5px dashed var(--nd-border2)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#888', fontFamily: 'var(--font-body)' }}
          >
            <Camera size={16} /> Sacar o subir foto
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />
      </div>

      {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Btn>
        <Btn onClick={guardar} disabled={saving}>
          {saving ? <><Spinner size={14} color="#A7C6ED" /> Guardando...</> : '+ Cargar hallazgo'}
        </Btn>
      </div>
    </div>
  )
}

// ── Modal de detalle / gestión ───────────────────────────────────────────────
function ModalDetalle({ hallazgo, onClose }) {
  const { usuarioActual, actualizarHallazgo, cerrarHallazgo, proyectoActivo, usuarios } = useStore()
  const rol = usuarioActual?.rol
  const [editando, setEditando]     = useState(false)
  const [form,     setForm]         = useState({ ...hallazgo })
  const [resolucion, setResolucion] = useState('')
  const [cerrando, setCerrando]     = useState(false)
  const [saving,   setSaving]       = useState(false)
  const [fotoRes,  setFotoRes]      = useState(null)
  const [fotoResPreview, setFotoResPreview] = useState(null)
  const fileResRef = useRef()

  const s = semaforo(hallazgo)
  const { directorio } = useStore()
  // Responsables = personas del directorio + usuarios con rol de gestión
  const lideres = [
    ...directorio.filter(d => d.proyectoId === proyectoActivo?.id).map(d => ({ id: d.id, nombre: d.nombre, rolLabel: d.rol || '' })),
    ...usuarios.filter(u => ['admin','direccion','jefe_obra','lider','sh'].includes(u.rol) && u.activo !== false && !directorio.find(d => d.nombre === u.nombre)).map(u => ({ id: u.id, nombre: u.nombre, rolLabel: u.rol }))
  ]

  const handleFotoRes = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = await comprimirImagen(file, 150)
    setFotoRes(blob)
    setFotoResPreview(URL.createObjectURL(blob))
  }

  const guardarEdicion = async () => {
    setSaving(true)
    try {
      await actualizarHallazgo(hallazgo.id, {
        responsable:  form.responsable  || null,
        fechaLimite:  form.fechaLimite  || null,
        solucion:     form.solucion     || null,
        observacion:  form.observacion  || null,
        estado:       form.estado       || hallazgo.estado
      })
      setEditando(false)
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleCerrar = async () => {
    if (!resolucion.trim()) { alert('Describí cómo se resolvió'); return }
    setSaving(true)
    try {
      let urlFoto = null
      if (fotoRes) {
        urlFoto = await subirFoto(proyectoActivo.id, hallazgo.id, fotoRes, 'resolucion')
      }
      await cerrarHallazgo(hallazgo.id, resolucion.trim(), urlFoto)
      onClose()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  // Link WhatsApp para notificar al responsable
  const wlink = form.responsable
    ? (() => {
        // Buscar número en directorio primero, luego en usuarios
        const enDir = directorio?.find(x => x.nombre === form.responsable)
        const enUsr = lideres.find(x => x.nombre === form.responsable)
        const tel = enDir?.telefono || enUsr?.telefono
        return tel ? wappLink(tel, { ...hallazgo, ...form }, proyectoActivo?.nombre || '') : null
      })()
    : null

  return (
    <Modal title="Detalle del hallazgo" onClose={onClose} width={520}>
      {/* Header estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: s.bg, borderRadius: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</span>
        <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>
          {fmtFechaHora(hallazgo.creadoEn)} · {hallazgo.creadoPor}
        </span>
      </div>

      {/* Foto apertura */}
      {hallazgo.fotoApertura && (
        <img src={hallazgo.fotoApertura} alt="Hallazgo" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, marginBottom: 16, border: '0.5px solid var(--nd-border)' }} />
      )}

      {/* Info base */}
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 16 }}>
        {[
          ['Sector', `${hallazgo.nivel}${hallazgo.zona ? ' · ' + hallazgo.zona : ''}`],
          ['Descripción', hallazgo.descripcion],
          hallazgo.observacion ? ['Observación', hallazgo.observacion] : null,
        ].filter(Boolean).map(([k, v]) => (
          <tr key={k} style={{ borderBottom: '0.5px solid var(--nd-border)' }}>
            <td style={{ color: '#888', padding: '7px 0', width: 110, verticalAlign: 'top', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-title)' }}>{k}</td>
            <td style={{ padding: '7px 0 7px 8px' }}>{v}</td>
          </tr>
        ))}
      </table>

      {/* Panel de gestión — solo líderes/admin */}
      {puedeAsignar(rol) && (
        <div style={{ borderTop: '0.5px solid var(--nd-border)', paddingTop: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--nd-mid)', fontFamily: 'var(--font-title)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gestión</span>
            {!editando && hallazgo.estado !== 'cerrado' && (
              <Btn variant="secondary" style={{ height: 28, fontSize: 12 }} onClick={() => setEditando(true)}>Editar</Btn>
            )}
          </div>

          {editando ? (
            <div>
              <Select label="Estado" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
                <option value="abierto">Abierto</option>
                <option value="en_proceso">En proceso</option>
              </Select>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Responsable</label>
                <input
                  list="lideres-list"
                  value={form.responsable || ''}
                  onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                  placeholder="Escribí el nombre..."
                  style={{ width: '100%', height: 36, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, boxSizing: 'border-box', fontFamily: 'var(--font-body)', background: 'var(--nd-white)' }}
                />
                <datalist id="lideres-list">
                  <option value="">Sin asignar</option>
                  {lideres.sort((a,b) => a.nombre.localeCompare(b.nombre)).map((u,i) => (
                    <option key={u.id||i} value={u.nombre} label={u.nombre + (u.info ? ' — ' + u.info : '')} />
                  ))}
                </datalist>
              </div>

              <Input label="Fecha límite" type="date" value={form.fechaLimite || ''} onChange={e => setForm(f => ({ ...f, fechaLimite: e.target.value }))} />

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Solución / contramedida</label>
                <textarea rows={2} value={form.solucion || ''} onChange={e => setForm(f => ({ ...f, solucion: e.target.value }))} placeholder="Describí la solución planificada..." style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" onClick={() => setEditando(false)}>Cancelar</Btn>
                <Btn onClick={guardarEdicion} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
                {wlink && (
                  <a href={wlink} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto' }}>
                    <Btn variant="green" style={{ gap: 6 }}>
                      <Phone size={13} /> Notificar WApp
                    </Btn>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              {[
                ['Responsable', hallazgo.responsable || <span style={{ color: '#aaa' }}>Sin asignar</span>],
                ['Fecha límite', hallazgo.fechaLimite ? fmtFecha(hallazgo.fechaLimite) : <span style={{ color: '#aaa' }}>Sin fecha</span>],
                hallazgo.solucion ? ['Solución', hallazgo.solucion] : null,
              ].filter(Boolean).map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '0.5px solid var(--nd-border)' }}>
                  <td style={{ color: '#888', padding: '7px 0', width: 110, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-title)' }}>{k}</td>
                  <td style={{ padding: '7px 0 7px 8px' }}>{v}</td>
                </tr>
              ))}
            </table>
          )}
        </div>
      )}

      {/* Foto resolución */}
      {hallazgo.fotoResolucion && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--nd-mid)', marginBottom: 8, fontFamily: 'var(--font-title)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Foto resolución</p>
          <img src={hallazgo.fotoResolucion} alt="Resolución" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, border: '0.5px solid var(--nd-border)' }} />
        </div>
      )}

      {/* Cierre */}
      {puedeCerrar(rol) && hallazgo.estado !== 'cerrado' && (
        <div style={{ borderTop: '0.5px solid var(--nd-border)', paddingTop: 16 }}>
          {cerrando ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Cómo se resolvió <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea rows={2} value={resolucion} onChange={e => setResolucion(e.target.value)} placeholder="Describí cómo quedó resuelto..." style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, fontWeight: 600 }}>Foto de resolución (opcional)</label>
                {fotoResPreview
                  ? <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={fotoResPreview} alt="res" style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 8, border: '0.5px solid var(--nd-border2)' }} />
                      <button onClick={() => { setFotoRes(null); setFotoResPreview(null) }} style={{ position: 'absolute', top: -6, right: -6, background: '#dc2626', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={11} /></button>
                    </div>
                  : <button onClick={() => fileResRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '0.5px dashed var(--nd-border2)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#888', fontFamily: 'var(--font-body)' }}><Camera size={16} /> Foto del resultado</button>
                }
                <input ref={fileResRef} type="file" accept="image/*" capture="environment" onChange={handleFotoRes} style={{ display: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" onClick={() => setCerrando(false)}>Cancelar</Btn>
                <Btn variant="green" onClick={handleCerrar} disabled={saving}>
                  {saving ? 'Cerrando...' : '✓ Cerrar hallazgo'}
                </Btn>
              </div>
            </div>
          ) : (
            <Btn variant="green" onClick={() => setCerrando(true)}>
              <CheckCircle size={14} /> Marcar como resuelto
            </Btn>
          )}
        </div>
      )}

      {/* Info cierre */}
      {hallazgo.estado === 'cerrado' && (
        <div style={{ background: '#d1fae5', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#065f46', marginBottom: 4 }}>✓ Resuelto el {fmtFecha(hallazgo.cerradoEn)}</p>
          {hallazgo.resolucion && <p style={{ fontSize: 13, color: '#047857' }}>{hallazgo.resolucion}</p>}
        </div>
      )}
    </Modal>
  )
}

// ── Listado principal de Hallazgos ──────────────────────────────────────────
export function Hallazgos() {
  const { hallazgos, proyectoActivo, usuarioActual } = useStore()
  const [modalNuevo,  setModalNuevo]  = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroNivel,  setFiltroNivel]  = useState('todos')
  const [busqueda,     setBusqueda]     = useState('')

  const niveles = proyectoActivo?.niveles || []

  const lista = useMemo(() => {
    return hallazgos
      .filter(h => h.proyectoId === proyectoActivo?.id)
      .filter(h => filtroEstado === 'todos' || h.estado === filtroEstado)
      .filter(h => filtroNivel  === 'todos' || h.nivel  === filtroNivel)
      .filter(h => !busqueda || h.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) || h.nivel?.toLowerCase().includes(busqueda.toLowerCase()) || h.creadoPor?.toLowerCase().includes(busqueda.toLowerCase()))
      .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))
  }, [hallazgos, proyectoActivo, filtroEstado, filtroNivel, busqueda])

  const counts = useMemo(() => ({
    todos:      hallazgos.filter(h => h.proyectoId === proyectoActivo?.id).length,
    abierto:    hallazgos.filter(h => h.proyectoId === proyectoActivo?.id && h.estado === 'abierto').length,
    en_proceso: hallazgos.filter(h => h.proyectoId === proyectoActivo?.id && h.estado === 'en_proceso').length,
    cerrado:    hallazgos.filter(h => h.proyectoId === proyectoActivo?.id && h.estado === 'cerrado').length,
  }), [hallazgos, proyectoActivo])

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Hallazgos" subtitle={proyectoActivo?.nombre}>
          <Btn onClick={() => setModalNuevo(true)}>
            <Plus size={14} /> Nuevo hallazgo
          </Btn>
        </Topbar>

        {/* Filtros rápidos por estado */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            ['todos',      'Todos',       counts.todos],
            ['abierto',    'Abiertos',    counts.abierto],
            ['en_proceso', 'En proceso',  counts.en_proceso],
            ['cerrado',    'Cerrados',    counts.cerrado],
          ].map(([val, lbl, cnt]) => (
            <button
              key={val}
              onClick={() => setFiltroEstado(val)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: '0.5px solid', fontFamily: 'var(--font-title)', fontWeight: 600,
                borderColor: filtroEstado === val ? 'var(--nd-black)' : 'var(--nd-border2)',
                background:  filtroEstado === val ? 'var(--nd-black)' : 'transparent',
                color:       filtroEstado === val ? 'var(--nd-light)'  : '#888'
              }}
            >
              {lbl} {cnt > 0 && <span style={{ opacity: 0.7 }}>({cnt})</span>}
            </button>
          ))}
        </div>

        {/* Barra de búsqueda y filtro nivel */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            placeholder="Buscar por descripción, sector o persona..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ flex: 1, height: 34, padding: '0 12px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--nd-white)' }}
          />
          <select
            value={filtroNivel}
            onChange={e => setFiltroNivel(e.target.value)}
            style={{ height: 34, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--nd-white)', color: 'var(--nd-black)', cursor: 'pointer' }}
          >
            <option value="todos">Todos los niveles</option>
            {niveles.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Lista */}
        {lista.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Sin hallazgos"
            sub={counts.todos === 0 ? "Cargá el primer hallazgo de la obra" : "No hay hallazgos con esos filtros"}
            action={counts.todos === 0 && <Btn onClick={() => setModalNuevo(true)}>+ Cargar primer hallazgo</Btn>}
          />
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {lista.map((h, i) => {
              const s = semaforo(h)
              return (
                <div
                  key={h.id}
                  onClick={() => setModalDetalle(h)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px',
                    borderBottom: i < lista.length - 1 ? '0.5px solid var(--nd-border)' : 'none',
                    cursor: 'pointer', transition: 'background .1s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Foto thumbnail */}
                  {h.fotoApertura
                    ? <img src={h.fotoApertura} alt="" style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '0.5px solid var(--nd-border)' }} />
                    : <div style={{ width: 52, height: 40, background: 'var(--nd-bg)', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid var(--nd-border)' }}>
                        <AlertTriangle size={16} color="#ccc" />
                      </div>
                  }

                  {/* Contenido */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--nd-black)' }}>
                        {truncar(h.descripcion, 70)}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.4 }}>
                      {h.nivel}{h.zona ? ` · ${h.zona}` : ''} · {fmtFecha(h.creadoEn)} · {h.creadoPor}
                      {h.responsable ? ` · Asignado a: ${h.responsable}` : ''}
                    </p>
                  </div>

                  {/* Semáforo */}
                  <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600, fontFamily: 'var(--font-title)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </Card>
        )}

        {/* Modal nuevo hallazgo */}
        {modalNuevo && (
          <Modal title="Nuevo hallazgo" onClose={() => setModalNuevo(false)} width={480}>
            <FormNuevoHallazgo
              onClose={() => setModalNuevo(false)}
              onGuardado={() => setModalNuevo(false)}
            />
          </Modal>
        )}

        {/* Modal detalle */}
        {modalDetalle && (
          <ModalDetalle
            hallazgo={modalDetalle}
            onClose={() => setModalDetalle(null)}
          />
        )}
      </PageWrap>
    </Layout>
  )
}
