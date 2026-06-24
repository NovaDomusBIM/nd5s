import React, { useState, useMemo } from 'react'
import { Users, Plus, Trash2, Smartphone, X, RefreshCw, Edit2, Lock } from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Layout, PageWrap, Topbar, Card, Btn, Input, Modal, EmptyState, Spinner
} from '../../components'

export function Personal() {
  const {
    personal, dispositivos, proyectoActivo, usuarioActual,
    agregarPersonal, actualizarPersonal, eliminarPersonal,
    reasignarDispositivo, resetearDispositivo
  } = useStore()

  const rol = usuarioActual?.rol
  const puedeEditar = ['admin', 'direccion', 'jefe_obra'].includes(rol)

  const [modal, setModal]     = useState(false)
  const [editId, setEditId]   = useState(null)
  const [nombre, setNombre]   = useState('')
  const [apellido, setApellido] = useState('')
  const [saving, setSaving]   = useState(false)
  const [reasignar, setReasignar] = useState(null) // dispositivo a reasignar

  const lista = useMemo(() =>
    (personal || [])
      .filter(p => p.proyectoId === proyectoActivo?.id)
      .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
  , [personal, proyectoActivo])

  const dispsDe = (personalId) => (dispositivos || []).filter(d => d.personalId === personalId)

  const abrirNuevo = () => { setEditId(null); setNombre(''); setApellido(''); setModal(true) }
  const abrirEditar = (p) => { setEditId(p.id); setNombre(p.nombre); setApellido(p.apellido); setModal(true) }

  const guardar = async () => {
    if (!nombre.trim() || !apellido.trim()) return
    setSaving(true)
    try {
      if (editId) await actualizarPersonal(editId, { nombre: nombre.trim(), apellido: apellido.trim() })
      else        await agregarPersonal(nombre, apellido)
      setModal(false)
    } finally { setSaving(false) }
  }

  const borrar = async (p) => {
    if (!confirm(`¿Dar de baja a ${p.nombre} ${p.apellido}?`)) return
    await eliminarPersonal(p.id)
  }

  const handleReset = async (disp) => {
    if (!confirm('¿Liberar este dispositivo? La persona deberá elegir su nombre de nuevo en la próxima carga.')) return
    await resetearDispositivo(disp.id)
  }

  const handleReasignar = async (persona) => {
    if (!reasignar) return
    await reasignarDispositivo(reasignar.id, persona)
    setReasignar(null)
  }

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Personal" subtitle={proyectoActivo?.nombre}>
          {puedeEditar && <Btn onClick={abrirNuevo}><Plus size={15} /> Agregar persona</Btn>}
        </Topbar>

        <p style={{ fontSize: 13, color: 'var(--nd-mid)', marginBottom: 18, maxWidth: 620 }}>
          Listado del personal de obra que carga desde <b>/cargar</b>. Cada persona elige su nombre de esta lista
          la primera vez y queda fijado a su dispositivo. Desde acá podés corregir o liberar esos vínculos.
        </p>

        {lista.length === 0 ? (
          <EmptyState icon={Users} title="Sin personal cargado"
            sub={puedeEditar ? 'Agregá a las personas de obra para que puedan identificarse al cargar' : 'Aún no hay personal cargado'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lista.map(p => {
              const disps = dispsDe(p.id)
              return (
                <Card key={p.id} style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--nd-black)', fontFamily: 'var(--font-title)' }}>
                        {p.apellido}, {p.nombre}
                      </div>
                      {/* Dispositivos vinculados */}
                      {disps.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                          {disps.map(d => (
                            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--nd-mid)' }}>
                              <Smartphone size={13} />
                              <span style={{ color: '#1a7a4a', fontWeight: 600 }}>Dispositivo vinculado</span>
                              <span style={{ color: '#aaa' }}>· última carga {d.ultimaCarga ? new Date(d.ultimaCarga).toLocaleDateString('es-AR') : '—'}</span>
                              {puedeEditar && (
                                <span style={{ display: 'inline-flex', gap: 6, marginLeft: 4 }}>
                                  <button onClick={() => setReasignar(d)} title="Reasignar a otra persona"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nd-mid)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                                    <Edit2 size={12} /> reasignar
                                  </button>
                                  <button onClick={() => handleReset(d)} title="Liberar dispositivo"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b86a00', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                                    <RefreshCw size={12} /> liberar
                                  </button>
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#bbb', marginTop: 6 }}>Sin dispositivo vinculado todavía</div>
                      )}
                    </div>
                    {puedeEditar && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => abrirEditar(p)} title="Editar"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nd-mid)', padding: 6 }}>
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => borrar(p)} title="Dar de baja"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', padding: 6 }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Modal alta/edición */}
        {modal && (
          <Modal onClose={() => setModal(false)} title={editId ? 'Editar persona' : 'Agregar persona'} width={420}>
            <Input label="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" />
            <Input label="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Pérez" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn onClick={guardar} disabled={saving || !nombre.trim() || !apellido.trim()}>
                {saving ? <><Spinner size={14} /> Guardando...</> : 'Guardar'}
              </Btn>
            </div>
          </Modal>
        )}

        {/* Modal reasignar dispositivo */}
        {reasignar && (
          <Modal onClose={() => setReasignar(null)} title="Reasignar dispositivo" width={420}>
            <p style={{ fontSize: 13, color: 'var(--nd-mid)', marginBottom: 12 }}>
              Elegí a qué persona corresponde realmente este dispositivo (actualmente: <b>{reasignar.nombreCompleto}</b>).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {lista.map(p => (
                <button key={p.id} onClick={() => handleReasignar(p)}
                  style={{ textAlign: 'left', padding: '10px 12px', border: '0.5px solid var(--nd-border2)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-body)' }}>
                  {p.apellido}, {p.nombre}
                </button>
              ))}
            </div>
          </Modal>
        )}
      </PageWrap>
    </Layout>
  )
}
