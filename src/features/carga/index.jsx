import React, { useState, useRef, useEffect } from 'react'
import { Camera, X, Send, ChevronDown } from 'lucide-react'
import { useStore, getNombreGuardado, setNombreGuardado } from '../../store/useStore'
import { subirFoto, comprimirImagen, updateItem } from '../../services/firebase'
import { Spinner } from '../../components'

export function CargaPublica() {
  const { proyectos, proyectoActivo, agregarHallazgo, agregarInnecesario, initListeners, asegurarAnonimo } = useStore()
  const [nombre,   setNombre]   = useState(getNombreGuardado)
  const [tipo,     setTipo]     = useState('hallazgo') // 'hallazgo' | 'innecesario'
  const [nivel,    setNivel]    = useState('')
  const [zona,     setZona]     = useState('')
  const [desc,     setDesc]     = useState('')
  const [obs,      setObs]      = useState('')
  const [cantidad, setCantidad] = useState('')
  const [causa,    setCausa]    = useState('')
  const [foto,     setFoto]     = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [enviado,  setEnviado]  = useState(false)
  const [error,    setError]    = useState('')
  const fileRef = useRef()

  const proyecto = proyectoActivo
  const niveles  = proyecto?.niveles || []

  useEffect(() => { initListeners(); asegurarAnonimo() }, [])

  const handleFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const blob = await comprimirImagen(file, 150)
      setFoto(blob)
      setFotoPreview(URL.createObjectURL(blob))
    } catch { setError('Error al procesar la foto') }
  }

  const limpiarForm = () => {
    setNivel(''); setZona(''); setDesc(''); setObs('')
    setCantidad(''); setCausa(''); setFoto(null); setFotoPreview(null)
    setError('')
  }

  const enviar = async () => {
    if (!nombre.trim()) { setError('Escribí tu nombre'); return }
    if (!nivel)         { setError('Seleccioná el sector'); return }
    if (!desc.trim())   { setError('Completá la descripción'); return }
    setSaving(true); setError('')
    try {
      setNombreGuardado(nombre.trim())
      if (tipo === 'hallazgo') {
        const id = await agregarHallazgo({
          nombreCargador: nombre.trim(),
          nivel, zona: zona.trim(),
          descripcion: desc.trim(),
          observacion: obs.trim(),
          fechaLimite: null, responsable: null, solucion: null
        })
        if (foto) {
          const url = await subirFoto(proyecto.id, id, foto, 'apertura')
          await updateItem('hallazgos', id, { fotoApertura: url })
        }
      } else {
        const id = await agregarInnecesario({
          nombreCargador: nombre.trim(),
          nivel, detalle: desc.trim(),
          cantidad: cantidad.trim(),
          causa: causa.trim(),
          destino: null, responsable: null, fechaSolucion: null
        })
        if (foto) {
          const url = await subirFoto(proyecto.id, id, foto, 'innec')
          await updateItem('innecesarios', id, { foto: url })
        }
      }
      setEnviado(true)
      setTimeout(() => { setEnviado(false); limpiarForm() }, 3000)
    } catch (e) {
      setError('Error al enviar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Pantalla de confirmación ──────────────────────────────────────────────
  if (enviado) return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 22, fontWeight: 700, color: '#1a7a4a', marginBottom: 8 }}>
          {tipo === 'hallazgo' ? 'Hallazgo registrado' : 'Innecesario registrado'}
        </h2>
        <p style={{ fontSize: 14, color: '#666' }}>Gracias {nombre.split(' ')[0]}. Volvés al formulario en un momento...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nd-bg)' }}>
      {/* Header */}
      <div style={{ background: '#2E2A2B', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em' }}>
          <span style={{ color: '#fff' }}>ND</span>
          <span style={{ color: 'var(--nd-light)' }}>TRACKER</span>
          <span style={{ color: 'var(--nd-light)', marginLeft: 2 }}>5S</span>
        </div>
        {proyecto && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
            {proyecto.nombre}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>

        {/* Nombre */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, fontWeight: 600 }}>
            Tu nombre
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            style={{ width: '100%', height: 44, padding: '0 14px', border: '0.5px solid var(--nd-border2)', borderRadius: 10, fontSize: 16, background: '#fff', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
          />
          {nombre && <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Guardado en este dispositivo para la próxima vez</p>}
        </div>

        {/* Tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[['hallazgo','⚠️ Hallazgo'],['innecesario','📦 Innecesario']].map(([val, lbl]) => (
            <button key={val} onClick={() => { setTipo(val); limpiarForm() }}
              style={{
                height: 48, borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font-title)',
                borderColor: tipo === val ? 'var(--nd-black)' : 'var(--nd-border2)',
                background:  tipo === val ? 'var(--nd-black)' : '#fff',
                color:       tipo === val ? 'var(--nd-light)'  : '#888'
              }}>{lbl}</button>
          ))}
        </div>

        {/* Sector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, fontWeight: 600 }}>
            Sector / nivel <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select value={nivel} onChange={e => setNivel(e.target.value)}
            style={{ width: '100%', height: 44, padding: '0 14px', border: '0.5px solid var(--nd-border2)', borderRadius: 10, fontSize: 15, background: '#fff', cursor: 'pointer', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}>
            <option value="">Seleccioná el sector...</option>
            {niveles.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Zona (solo hallazgo) */}
        {tipo === 'hallazgo' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Zona específica <span style={{ fontSize: 11, fontWeight: 400, color: '#aaa' }}>(opcional)</span>
            </label>
            <input type="text" placeholder="Ej: Escalera, Baño U3, Eje C" value={zona} onChange={e => setZona(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 14px', border: '0.5px solid var(--nd-border2)', borderRadius: 10, fontSize: 15, background: '#fff', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
          </div>
        )}

        {/* Descripción */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, fontWeight: 600 }}>
            {tipo === 'hallazgo' ? 'Descripción del hallazgo' : 'Detalle del innecesario'} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea rows={3} placeholder={tipo === 'hallazgo' ? 'Qué encontraste...' : 'Qué elemento es innecesario...'}
            value={desc} onChange={e => setDesc(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', border: '0.5px solid var(--nd-border2)', borderRadius: 10, fontSize: 15, background: '#fff', lineHeight: 1.5, resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
        </div>

        {/* Campos extra según tipo */}
        {tipo === 'hallazgo' ? (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Observación <span style={{ fontSize: 11, fontWeight: 400, color: '#aaa' }}>(opcional)</span>
            </label>
            <textarea rows={2} placeholder="Algún detalle adicional..." value={obs} onChange={e => setObs(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '0.5px solid var(--nd-border2)', borderRadius: 10, fontSize: 15, background: '#fff', lineHeight: 1.5, resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, fontWeight: 600 }}>Cantidad</label>
              <input type="text" placeholder="Ej: 3 bolsas" value={cantidad} onChange={e => setCantidad(e.target.value)}
                style={{ width: '100%', height: 44, padding: '0 14px', border: '0.5px solid var(--nd-border2)', borderRadius: 10, fontSize: 15, background: '#fff', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, fontWeight: 600 }}>Causa</label>
              <input type="text" placeholder="Por qué está ahí" value={causa} onChange={e => setCausa(e.target.value)}
                style={{ width: '100%', height: 44, padding: '0 14px', border: '0.5px solid var(--nd-border2)', borderRadius: 10, fontSize: 15, background: '#fff', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
            </div>
          </div>
        )}

        {/* Foto */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Foto <span style={{ fontSize: 11, fontWeight: 400, color: '#aaa' }}>(opcional)</span>
          </label>
          {fotoPreview ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={fotoPreview} alt="preview" style={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 10, border: '0.5px solid var(--nd-border2)', display: 'block' }} />
              <button onClick={() => { setFoto(null); setFotoPreview(null) }}
                style={{ position: 'absolute', top: -8, right: -8, background: '#dc2626', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <X size={13} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              style={{ width: '100%', height: 80, border: '1.5px dashed var(--nd-border2)', borderRadius: 10, background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#aaa' }}>
              <Camera size={22} />
              <span style={{ fontSize: 13, fontFamily: 'var(--font-body)' }}>Sacar o subir foto</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />
        </div>

        {error && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, padding: '10px 14px', background: '#fee2e2', borderRadius: 8 }}>{error}</p>}

        {/* Botón enviar */}
        <button onClick={enviar} disabled={saving}
          style={{
            width: '100%', height: 52, background: saving ? '#aaa' : 'var(--nd-black)',
            color: 'var(--nd-light)', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'var(--font-title)', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}>
          {saving ? <><Spinner size={18} color="var(--nd-light)" /> Enviando...</> : <><Send size={16} /> Enviar</>}
        </button>

        <p style={{ fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 16 }}>
          NDTracker 5S · NovaDomus
        </p>
      </div>
    </div>
  )
}
