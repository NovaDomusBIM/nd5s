import React, { useState, useMemo } from 'react'
import { Users, Plus, Trash2, Smartphone, X, RefreshCw, Edit2, Lock } from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Layout, PageWrap, Topbar, Card, Btn, Input, Modal, EmptyState, Spinner
} from '../../components'

export function Personal() {
  const {
    personal, dispositivos, proyectoActivo, usuarioActual,
    hallazgos, innecesarios, hallazgosDescartados, innecesariosDescartados,
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
  const [importar, setImportar]   = useState(false)
  const [textoImport, setTextoImport] = useState('')
  const [importando, setImportando]   = useState(false)
  const [ordenarPor, setOrdenarPor] = useState('apellido') // apellido|hallazgos|innecesarios|total|validas|descartadas
  const [ordenAsc, setOrdenAsc]     = useState(true)

  // Importación masiva: una persona por línea, formato "Apellido, Nombre" o "Apellido Nombre"
  // (acepta coma; si no hay coma, toma la última palabra como nombre — editable luego)
  const procesarImport = async () => {
    const lineas = textoImport.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lineas.length) return
    setImportando(true)
    try {
      const parsed = lineas.map(l => {
        if (l.includes(',')) {
          const [ape, nom] = l.split(',')
          return { apellido: ape.trim(), nombre: (nom || '').trim() }
        }
        // sin coma: última palabra = nombre, resto = apellido
        const partes = l.split(/\s+/)
        const nombre = partes.pop()
        return { apellido: partes.join(' '), nombre }
      }).filter(p => p.nombre && p.apellido)
      // Cargar en orden alfabético por apellido
      parsed.sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
      for (const p of parsed) await agregarPersonal(p.nombre, p.apellido)
      setImportar(false); setTextoImport('')
    } finally { setImportando(false) }
  }

  const dispsDe = (personalId) => (dispositivos || []).filter(d => d.personalId === personalId)

  // Mapa uid -> personalId (un dispositivo = un uid = una persona)
  const uidsPorPersona = useMemo(() => {
    const m = {}
    ;(dispositivos || []).forEach(d => {
      if (!m[d.personalId]) m[d.personalId] = []
      m[d.personalId].push(d.uid)
    })
    return m
  }, [dispositivos])

  // Cargas (activas + descartadas) por persona, cruzando uidAnon
  const statsDe = (personalId) => {
    const uids = uidsPorPersona[personalId] || []
    if (!uids.length) return { hallazgos: 0, innecesarios: 0, total: 0, validas: 0, descartadas: 0 }
    const esDe = (x) => uids.includes(x.uidAnon)
    const hAct = (hallazgos || []).filter(esDe)
    const iAct = (innecesarios || []).filter(esDe)
    const hDes = (hallazgosDescartados || []).filter(esDe)
    const iDes = (innecesariosDescartados || []).filter(esDe)
    const validas = [...hAct, ...iAct].filter(x => x.responsable).length
    return {
      hallazgos:    hAct.length + hDes.length,
      innecesarios: iAct.length + iDes.length,
      total:        hAct.length + iAct.length + hDes.length + iDes.length,
      validas,
      descartadas:  hDes.length + iDes.length,
    }
  }

  // Lista con stats y ordenamiento
  const lista = useMemo(() => {
    const base = (personal || [])
      .filter(p => p.proyectoId === proyectoActivo?.id)
      .map(p => ({ ...p, _stats: statsDe(p.id) }))
    const cmp = (a, b) => {
      if (ordenarPor === 'apellido')
        return `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
      return (a._stats[ordenarPor] || 0) - (b._stats[ordenarPor] || 0)
    }
    base.sort((a, b) => ordenAsc ? cmp(a, b) : -cmp(a, b))
    return base
  }, [personal, proyectoActivo, dispositivos, hallazgos, innecesarios, hallazgosDescartados, innecesariosDescartados, ordenarPor, ordenAsc])

  // Resumen global
  const registrados  = lista.filter(p => dispsDe(p.id).length > 0).length
  const pendientes   = lista.length - registrados
  const conDuplicado = lista.filter(p => dispsDe(p.id).length > 1).length
  const totalValidas     = lista.reduce((s, p) => s + p._stats.validas, 0)
  const totalDescartadas = lista.reduce((s, p) => s + p._stats.descartadas, 0)

  const cambiarOrden = (campo) => {
    if (ordenarPor === campo) setOrdenAsc(a => !a)
    else { setOrdenarPor(campo); setOrdenAsc(campo === 'apellido') }
  }

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
          {puedeEditar && <Btn variant="secondary" onClick={() => setImportar(true)}>Importar lista</Btn>}
          {puedeEditar && <Btn onClick={abrirNuevo}><Plus size={15} /> Agregar persona</Btn>}
        </Topbar>

        <p style={{ fontSize: 13, color: 'var(--nd-mid)', marginBottom: 14, maxWidth: 620 }}>
          Listado del personal de obra que carga desde <b>/cargar</b>. Cada persona elige su nombre de esta lista
          la primera vez y queda fijado a su dispositivo. Desde acá podés corregir o liberar esos vínculos.
        </p>

        {/* Contadores de registro */}
        {lista.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#eaf6ef', borderRadius: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#1a7a4a', fontSize: 16 }}>{registrados}</span>
              <span style={{ color: 'var(--nd-mid)' }}>de {lista.length} registrados</span>
            </div>
            {pendientes > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#f3f4f6', borderRadius: 8, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#777', fontSize: 16 }}>{pendientes}</span>
                <span style={{ color: 'var(--nd-mid)' }}>pendientes</span>
              </div>
            )}
            {conDuplicado > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#fef3c7', borderRadius: 8, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#b86a00', fontSize: 16 }}>{conDuplicado}</span>
                <span style={{ color: '#b86a00' }}>con más de un dispositivo</span>
              </div>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#eaf6ef', borderRadius: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#1a7a4a', fontSize: 16 }}>{totalValidas}</span>
              <span style={{ color: 'var(--nd-mid)' }}>cargas válidas</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#fbecec', borderRadius: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#b91c1c', fontSize: 16 }}>{totalDescartadas}</span>
              <span style={{ color: '#b91c1c' }}>descartadas</span>
            </div>
          </div>
        )}

        {/* Encabezado ordenable */}
        {lista.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#aaa', marginRight: 4 }}>Ordenar por:</span>
            {[['apellido','Nombre'],['hallazgos','Hallazgos'],['innecesarios','Innecesarios'],['total','Total'],['validas','Válidas'],['descartadas','Descartadas']].map(([campo, lbl]) => (
              <button key={campo} onClick={() => cambiarOrden(campo)}
                style={{ padding: '5px 11px', borderRadius: 7, border: '0.5px solid var(--nd-border2)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)',
                  background: ordenarPor === campo ? 'var(--nd-black)' : '#fff',
                  color: ordenarPor === campo ? 'var(--nd-light)' : '#666', fontWeight: ordenarPor === campo ? 600 : 400 }}>
                {lbl}{ordenarPor === campo ? (ordenAsc ? ' ↑' : ' ↓') : ''}
              </button>
            ))}
          </div>
        )}

        {lista.length === 0 ? (
          <EmptyState icon={Users} title="Sin personal cargado"
            sub={puedeEditar ? 'Agregá a las personas de obra para que puedan identificarse al cargar' : 'Aún no hay personal cargado'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lista.map(p => {
              const disps = dispsDe(p.id)
              const estadoColor = disps.length > 1 ? '#b86a00' : disps.length === 1 ? '#1a7a4a' : '#d8dade'
              return (
                <Card key={p.id} style={{ padding: '14px 16px', borderLeft: `3px solid ${estadoColor}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--nd-black)', fontFamily: 'var(--font-title)' }}>
                        {p.apellido}, {p.nombre}
                      </div>
                      {/* Conteo de cargas */}
                      <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                        <ConteoChip label="Hallazgos"    valor={p._stats.hallazgos} />
                        <ConteoChip label="Innecesarios" valor={p._stats.innecesarios} />
                        <ConteoChip label="Total"        valor={p._stats.total} bold />
                        <ConteoChip label="Válidas"      valor={p._stats.validas} color="#1a7a4a" />
                        <ConteoChip label="Descartadas"  valor={p._stats.descartadas} color={p._stats.descartadas > 0 ? '#b91c1c' : '#bbb'} />
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
        {/* Modal importar lista */}
        {importar && (
          <Modal onClose={() => setImportar(false)} title="Importar lista de personal" width={460}>
            <p style={{ fontSize: 13, color: 'var(--nd-mid)', marginBottom: 10 }}>
              Pegá una persona por línea, en formato <b>Apellido, Nombre</b>.
              Por ejemplo: <i>Lopez, Oscar Luis</i>. Se cargan en orden alfabético.
            </p>
            <textarea rows={10} value={textoImport} onChange={e => setTextoImport(e.target.value)}
              placeholder={'Lopez, Oscar Luis\nLlaveta Castro, Sergio\nSubelza Chaira, Agustín'}
              style={{ width: '100%', padding: '10px 12px', border: '0.5px solid var(--nd-border2)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Btn variant="secondary" onClick={() => setImportar(false)}>Cancelar</Btn>
              <Btn onClick={procesarImport} disabled={importando || !textoImport.trim()}>
                {importando ? <><Spinner size={14} /> Importando...</> : 'Importar'}
              </Btn>
            </div>
          </Modal>
        )}
      </PageWrap>
    </Layout>
  )
}

function ConteoChip({ label, valor, color, bold }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
      <span style={{ fontSize: 18, fontWeight: bold ? 800 : 700, color: color || 'var(--nd-black)', lineHeight: 1, fontFamily: 'var(--font-title)' }}>{valor}</span>
      <span style={{ fontSize: 10, color: '#999', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
    </div>
  )
}
