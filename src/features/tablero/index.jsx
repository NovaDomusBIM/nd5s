import React, { useState, useMemo } from 'react'
import { BarChart2, ClipboardCheck, TrendingUp, AlertTriangle, CheckCircle, Package } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { addItem, listenCol } from '../../services/firebase'
import {
  Layout, PageWrap, Topbar, Card, CardTitle, MetricCard,
  Btn, Modal, EmptyState
} from '../../components'
import { fmtFecha, diasRestantes } from '../../utils'
import { CATEGORIAS_5S } from '../../data/mock'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts'

// ── Formulario de auditoría 5S ───────────────────────────────────────────────
const PREGUNTAS_AUDITORIA = [
  { s: '1S — Separar',       items: ['Solo hay elementos necesarios en el área','Los elementos innecesarios están identificados','No hay materiales vencidos o en mal estado'] },
  { s: '2S — Ordenar',       items: ['Cada elemento tiene un lugar definido','Los materiales están correctamente etiquetados','Los pasillos y accesos están libres'] },
  { s: '3S — Limpiar',       items: ['El área de trabajo está limpia','No hay acumulación de residuos o escombros','Las herramientas están limpias y guardadas'] },
  { s: '4S — Estandarizar',  items: ['Se siguen los procedimientos establecidos','Hay señalización visible y actualizada','El personal conoce los estándares'] },
  { s: '5S — Autodisciplina',items: ['Se respetan los horarios de limpieza','Las mejoras se sostienen en el tiempo','El equipo participa activamente'] },
]

function FormAuditoria({ onClose, proyectoActivo, usuarioActual }) {
  const totalItems = PREGUNTAS_AUDITORIA.reduce((a, s) => a + s.items.length, 0)
  const [puntajes, setPuntajes] = useState(() => {
    const p = {}
    PREGUNTAS_AUDITORIA.forEach(s => s.items.forEach((_, i) => { p[`${s.s}_${i}`] = 0 }))
    return p
  })
  const [nivel,    setNivel]    = useState('')
  const [obs,      setObs]      = useState('')
  const [saving,   setSaving]   = useState(false)
  const niveles = proyectoActivo?.niveles || []

  const total = Object.values(puntajes).reduce((a, b) => a + b, 0)
  const maxPuntaje = totalItems * 4
  const porcentaje = Math.round((total / maxPuntaje) * 100)

  const colorPorcentaje = porcentaje >= 80 ? '#1a7a4a' : porcentaje >= 60 ? '#b86a00' : '#a32d2d'

  const guardar = async () => {
    if (!nivel) { alert('Seleccioná el sector auditado'); return }
    setSaving(true)
    try {
      const puntajesPorS = PREGUNTAS_AUDITORIA.map(s => ({
        nombre: s.s,
        puntaje: s.items.reduce((a, _, i) => a + (puntajes[`${s.s}_${i}`] || 0), 0),
        max: s.items.length * 4
      }))
      await addItem('auditorias', {
        proyectoId:    proyectoActivo.id,
        proyectoCodigo:proyectoActivo.codigo,
        nivel,
        puntajeTotal:  total,
        puntajeMax:    maxPuntaje,
        porcentaje,
        puntajesPorS,
        observacion:   obs.trim(),
        auditor:       usuarioActual?.nombre || '',
        fecha:         new Date().toISOString().slice(0, 10),
        creadoEn:      new Date().toISOString()
      })
      onClose()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      {/* Ayuda con ejemplo */}
      <div style={{ marginBottom: 18, padding: '12px 14px', background: '#f0f9ff', borderRadius: 8, border: '0.5px solid #bae6fd', fontSize: 12, color: '#0369a1', lineHeight: 1.6 }}>
        <strong>Cómo puntuar:</strong> 0 = no cumple · 1 = muy bajo · 2 = regular · 3 = bueno · 4 = excelente.
        <br/><span style={{ color: '#0c4a6e' }}>Ejemplo:</span> si en "3S Limpiar" el área tiene escombros acumulados → puntuás 1. Si está impecable → 4. El puntaje total se calcula solo.
      </div>

      {/* Sector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
          Sector auditado <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <select value={nivel} onChange={e => setNivel(e.target.value)}
          style={{ width: '100%', height: 36, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 14, fontFamily: 'var(--font-body)', background: 'var(--nd-white)', cursor: 'pointer', boxSizing: 'border-box' }}>
          <option value="">Seleccioná el sector...</option>
          {niveles.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Puntaje en tiempo real */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: '#f8f8f8', borderRadius: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${porcentaje}%`, background: colorPorcentaje, borderRadius: 4, transition: 'width .3s' }} />
          </div>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-title)', color: colorPorcentaje, minWidth: 50, textAlign: 'right' }}>{porcentaje}%</span>
      </div>

      {/* Preguntas por S */}
      {PREGUNTAS_AUDITORIA.map(seccion => (
        <div key={seccion.s} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--nd-mid)', fontFamily: 'var(--font-title)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{seccion.s}</p>
          {seccion.items.map((pregunta, i) => {
            const key = `${seccion.s}_${i}`
            const val = puntajes[key] || 0
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#444', marginBottom: 6 }}>{pregunta}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2, 3, 4].map(n => (
                    <button key={n} onClick={() => setPuntajes(p => ({ ...p, [key]: n }))}
                      style={{
                        width: 36, height: 28, borderRadius: 6, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', border: '0.5px solid',
                        fontFamily: 'var(--font-title)',
                        borderColor: val === n ? 'transparent' : 'var(--nd-border2)',
                        background: val === n ? (n <= 1 ? '#fee2e2' : n <= 2 ? '#fef3c7' : n <= 3 ? '#d1fae5' : '#065f46') : 'transparent',
                        color:      val === n ? (n <= 1 ? '#991b1b' : n <= 2 ? '#92400e' : n <= 3 ? '#065f46' : '#fff')    : '#aaa'
                      }}>{n}</button>
                  ))}
                  <span style={{ fontSize: 11, color: '#aaa', alignSelf: 'center', marginLeft: 4 }}>
                    {val === 0 ? 'No aplica/No cumple' : val === 1 ? 'Muy bajo' : val === 2 ? 'Regular' : val === 3 ? 'Bueno' : 'Excelente'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Observación */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Observaciones generales</label>
        <textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Comentarios de la auditoría..."
          style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : `Guardar auditoría (${porcentaje}%)`}</Btn>
      </div>
    </div>
  )
}

// ── Página principal Tablero ─────────────────────────────────────────────────
export function Tablero() {
  const { hallazgos, innecesarios, proyectoActivo, usuarioActual } = useStore()
  const [auditorias, setAuditorias] = useState([])
  const [modalAuditoria, setModalAuditoria] = useState(false)
  const [periodo, setPeriodo] = useState('mes_actual')  // mes_actual | mes_anterior | 3meses | 6meses | anio | todo
  const [fSector, setFSector] = useState('todos')
  const [fResp,   setFResp]   = useState('todos')
  const [fEstado, setFEstado] = useState('todos')
  const mesVer = new Date().toISOString().slice(0, 7)

  const dentroDelPeriodo = (fecha) => {
    if (!fecha) return false
    if (periodo === 'todo') return true
    const ahora = new Date(); const f = new Date(fecha)
    if (periodo === 'mes_actual')   return fecha.slice(0,7) === ahora.toISOString().slice(0,7)
    if (periodo === 'mes_anterior') { const m = new Date(ahora); m.setMonth(m.getMonth()-1); return fecha.slice(0,7) === m.toISOString().slice(0,7) }
    if (periodo === '3meses')  { const c = new Date(ahora); c.setMonth(c.getMonth()-3); return f >= c }
    if (periodo === '6meses')  { const c = new Date(ahora); c.setMonth(c.getMonth()-6); return f >= c }
    if (periodo === 'anio')    return fecha.slice(0,4) === ahora.toISOString().slice(0,4)
    return true
  }

  // Cargar auditorías
  React.useEffect(() => {
    if (!proyectoActivo) return
    
    const unsub = listenCol('auditorias', data => {
      setAuditorias(data.filter(a => a.proyectoId === proyectoActivo.id))
    })
    return () => unsub()
  }, [proyectoActivo])

  const hProyecto = useMemo(() => hallazgos.filter(h => h.proyectoId === proyectoActivo?.id), [hallazgos, proyectoActivo])
  const iProyecto = useMemo(() => innecesarios.filter(i => i.proyectoId === proyectoActivo?.id), [innecesarios, proyectoActivo])

  // Opciones de filtros
  const sectores = useMemo(() => {
    const s = new Set(); hProyecto.forEach(h => h.nivel && s.add(h.nivel)); return [...s].sort()
  }, [hProyecto])
  const responsables = useMemo(() => {
    const s = new Set(); hProyecto.forEach(h => h.responsable && s.add(h.responsable)); return [...s].sort()
  }, [hProyecto])

  // Hallazgos filtrados por sector / responsable / estado (período se aplica donde corresponde)
  const hFilt = useMemo(() => hProyecto.filter(h =>
    (fSector === 'todos' || h.nivel === fSector) &&
    (fResp   === 'todos' || h.responsable === fResp) &&
    (fEstado === 'todos' || h.estado === fEstado)
  ), [hProyecto, fSector, fResp, fEstado])

  const iFilt = useMemo(() => iProyecto.filter(i =>
    (fSector === 'todos' || i.nivel === fSector) &&
    (fResp   === 'todos' || i.responsable === fResp) &&
    (fEstado === 'todos' || i.estado === fEstado || (fEstado === 'abierto' && i.estado === 'pendiente'))
  ), [iProyecto, fSector, fResp, fEstado])

  // KPIs del período seleccionado (sobre datos ya filtrados por sector/resp/estado)
  const kpis = useMemo(() => {
    const delMes    = hFilt.filter(h => dentroDelPeriodo(h.creadoEn))
    const vencidos  = hFilt.filter(h => h.estado !== 'cerrado' && diasRestantes(h.fechaLimite) < 0)
    const total     = hFilt.length
    const cerrados  = hFilt.filter(h => h.estado === 'cerrado').length
    const pctVenc   = total > 0 ? Math.round((vencidos.length / total) * 100) : 0
    const innecPend = iFilt.filter(i => i.estado === 'pendiente').length
    const ultAudit  = [...auditorias].sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))[0]
    return { delMes: delMes.length, vencidos: vencidos.length, pctVenc, cerrados, total, innecPend, ultAudit }
  }, [hFilt, iFilt, auditorias, periodo])

  // Tendencia mensual últimos 6 meses
  const tendencia = useMemo(() => {
    const meses = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const mes = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('es-AR', { month: 'short' })
      const abiertos = hFilt.filter(h => h.creadoEn?.slice(0, 7) === mes && h.estado !== 'cerrado').length
      const cerrados = hFilt.filter(h => h.cerradoEn?.slice(0, 7) === mes).length
      meses.push({ mes: label, abiertos, cerrados })
    }
    return meses
  }, [hFilt])

  // Ranking sectores (abiertos)
  const rankingSectores = useMemo(() => {
    const mapa = {}
    hFilt.filter(h => h.estado !== 'cerrado').forEach(h => {
      if (!h.nivel) return
      mapa[h.nivel] = (mapa[h.nivel] || 0) + 1
    })
    return Object.entries(mapa)
      .map(([nivel, count]) => ({ nivel, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [hFilt])

  // Historial auditorías
  const auditOrdenadas = useMemo(() =>
    [...auditorias].sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn)).slice(0, 5)
  , [auditorias])

  if (!proyectoActivo) return (
    <Layout><PageWrap>
      <EmptyState icon={BarChart2} title="Sin proyecto activo" sub="Seleccioná un proyecto para ver el tablero" />
    </PageWrap></Layout>
  )

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Tablero 5S" subtitle={proyectoActivo.nombre}>
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            style={{ height: 34, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--nd-white)', cursor: 'pointer' }}>
            <option value="mes_actual">Este mes</option>
            <option value="mes_anterior">Mes pasado</option>
            <option value="3meses">Últimos 3 meses</option>
            <option value="6meses">Últimos 6 meses</option>
            <option value="anio">Este año</option>
            <option value="todo">Todo el historial</option>
          </select>
          <select value={fEstado} onChange={e => setFEstado(e.target.value)}
            style={{ height: 34, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--nd-white)', cursor: 'pointer' }}>
            <option value="todos">Todos los estados</option>
            <option value="abierto">Abiertos / Pendientes</option>
            <option value="en_proceso">En proceso</option>
            <option value="cerrado">Cerrados</option>
          </select>
          <select value={fSector} onChange={e => setFSector(e.target.value)}
            style={{ height: 34, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--nd-white)', cursor: 'pointer' }}>
            <option value="todos">Todos los sectores</option>
            {sectores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fResp} onChange={e => setFResp(e.target.value)}
            style={{ height: 34, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--nd-white)', cursor: 'pointer' }}>
            <option value="todos">Todos los responsables</option>
            {responsables.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <Btn onClick={() => setModalAuditoria(true)}>
            <ClipboardCheck size={14} /> Nueva auditoría
          </Btn>
        </Topbar>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 24 }}>
          <MetricCard label="Nuevos del mes"    value={kpis.delMes}   color="#425563"  sub="hallazgos cargados" />
          <MetricCard label="Vencidos %"        value={`${kpis.pctVenc}%`} color={kpis.pctVenc > 20 ? '#a32d2d' : '#1a7a4a'} sub={`${kpis.vencidos} hallazgos`} />
          <MetricCard label="Cerrados total"    value={kpis.cerrados} color="#1a7a4a"  sub={`de ${kpis.total} totales`} />
          <MetricCard label="Innecesarios"      value={kpis.innecPend} color="#b86a00" sub="pendientes" />
          <MetricCard
            label="Últ. auditoría"
            value={kpis.ultAudit ? `${kpis.ultAudit.porcentaje}%` : '-'}
            color={kpis.ultAudit ? (kpis.ultAudit.porcentaje >= 80 ? '#1a7a4a' : kpis.ultAudit.porcentaje >= 60 ? '#b86a00' : '#a32d2d') : '#aaa'}
            sub={kpis.ultAudit ? fmtFecha(kpis.ultAudit.creadoEn) : 'Sin auditorías'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Tendencia mensual */}
          <Card>
            <CardTitle>Tendencia mensual</CardTitle>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={tendencia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: 'var(--font-body)' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'var(--font-body)', borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="abiertos" stroke="#a32d2d" strokeWidth={2} dot={{ r: 3 }} name="Abiertos" />
                <Line type="monotone" dataKey="cerrados"  stroke="#1a7a4a" strokeWidth={2} dot={{ r: 3 }} name="Cerrados" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Ranking sectores */}
          <Card>
            <CardTitle>Hallazgos abiertos por sector</CardTitle>
            {rankingSectores.length === 0
              ? <EmptyState icon={CheckCircle} title="Sin hallazgos abiertos" sub="¡Todo en orden!" />
              : <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={rankingSectores} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nivel" tick={{ fontSize: 10, fontFamily: 'var(--font-body)' }} width={80} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                    <Bar dataKey="count" fill="#425563" radius={[0, 4, 4, 0]} name="Hallazgos" />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>
        </div>

        {/* Historial auditorías */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <CardTitle style={{ margin: 0 }}>Historial de auditorías</CardTitle>
            <Btn variant="secondary" style={{ height: 28, fontSize: 12 }} onClick={() => setModalAuditoria(true)}>
              + Nueva
            </Btn>
          </div>
          {auditOrdenadas.length === 0
            ? <EmptyState icon={ClipboardCheck} title="Sin auditorías" sub="Realizá la primera auditoría 5S del proyecto" action={<Btn onClick={() => setModalAuditoria(true)}>Iniciar auditoría</Btn>} />
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--nd-border2)' }}>
                    {['Fecha','Sector','Auditor','Puntaje','1S','2S','3S','4S','5S'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 700, color: 'var(--nd-mid)', fontFamily: 'var(--font-title)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditOrdenadas.map(a => {
                    const color = a.porcentaje >= 80 ? '#1a7a4a' : a.porcentaje >= 60 ? '#b86a00' : '#a32d2d'
                    const bg    = a.porcentaje >= 80 ? '#d1fae5' : a.porcentaje >= 60 ? '#fef3c7' : '#fee2e2'
                    return (
                      <tr key={a.id} style={{ borderBottom: '0.5px solid var(--nd-border)' }}>
                        <td style={{ padding: '8px' }}>{fmtFecha(a.creadoEn)}</td>
                        <td style={{ padding: '8px' }}>{a.nivel}</td>
                        <td style={{ padding: '8px', color: '#888' }}>{a.auditor}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color, background: bg, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-title)' }}>
                            {a.porcentaje}%
                          </span>
                        </td>
                        {(a.puntajesPorS || []).map((s, i) => (
                          <td key={i} style={{ padding: '8px', fontSize: 12, color: '#666' }}>
                            {Math.round((s.puntaje / s.max) * 100)}%
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
          }
        </Card>

        {/* Modal auditoría */}
        {modalAuditoria && (
          <Modal title="Nueva auditoría 5S" onClose={() => setModalAuditoria(false)} width={560}>
            <FormAuditoria
              onClose={() => setModalAuditoria(false)}
              proyectoActivo={proyectoActivo}
              usuarioActual={usuarioActual}
            />
          </Modal>
        )}
      </PageWrap>
    </Layout>
  )
}
