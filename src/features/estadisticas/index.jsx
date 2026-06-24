import React, { useState, useMemo } from 'react'
import { Download, BarChart2, FileText } from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Layout, PageWrap, Topbar, Card, CardTitle, Btn, EmptyState, MetricCard
} from '../../components'
import { fmtFecha, diasRestantes } from '../../utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORES_PIE = ['#a32d2d','#b86a00','#1a7a4a','#425563','#8E44AD']

const selStyle = { height: 34, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--nd-white)', cursor: 'pointer' }

// Filtra por rango de fechas según el campo creadoEn
function enRango(item, rango) {
  if (rango === 'todos') return true
  const ahora = new Date()
  if (rango === 'mes_actual')   return item.creadoEn?.slice(0,7) === ahora.toISOString().slice(0,7)
  if (rango === 'mes_anterior') { const m = new Date(ahora); m.setMonth(m.getMonth()-1); return item.creadoEn?.slice(0,7) === m.toISOString().slice(0,7) }
  if (rango === 'anio')         return item.creadoEn?.slice(0,4) === ahora.toISOString().slice(0,4)
  const corte = new Date()
  if (rango === '30d')  corte.setDate(corte.getDate() - 30)
  if (rango === '90d')  corte.setDate(corte.getDate() - 90)
  if (rango === '180d') corte.setDate(corte.getDate() - 180)
  return new Date(item.creadoEn) >= corte
}

export function Estadisticas() {
  const { hallazgos, innecesarios, proyectoActivo } = useStore()

  // ── Filtros ─────────────────────────────────────────────────────────────
  const [tipo,   setTipo]   = useState('hallazgos')  // hallazgos | innecesarios | ambos
  const [rango,  setRango]  = useState('todos')
  const [fEstado, setFEstado] = useState('todos')     // estado
  const [fSector, setFSector] = useState('todos')     // nivel
  const [fResp,   setFResp]   = useState('todos')      // responsable

  const verH = tipo === 'hallazgos' || tipo === 'ambos'
  const verI = tipo === 'innecesarios' || tipo === 'ambos'

  // Datos base del proyecto
  const hBase = useMemo(() => hallazgos.filter(h => h.proyectoId === proyectoActivo?.id), [hallazgos, proyectoActivo])
  const iBase = useMemo(() => innecesarios.filter(i => i.proyectoId === proyectoActivo?.id), [innecesarios, proyectoActivo])

  // Opciones de los selects dependientes
  const sectores = useMemo(() => {
    const s = new Set()
    if (verH) hBase.forEach(h => h.nivel && s.add(h.nivel))
    if (verI) iBase.forEach(i => i.nivel && s.add(i.nivel))
    return [...s].sort()
  }, [hBase, iBase, verH, verI])

  const responsables = useMemo(() => {
    const s = new Set()
    hBase.forEach(h => h.responsable && s.add(h.responsable))
    iBase.forEach(i => i.responsable && s.add(i.responsable))
    return [...s].sort()
  }, [hBase, iBase])

  // Hallazgos filtrados
  const hFilt = useMemo(() => verH ? hBase.filter(h =>
    enRango(h, rango) &&
    (fEstado === 'todos' || h.estado === fEstado) &&
    (fSector === 'todos' || h.nivel === fSector) &&
    (fResp   === 'todos' || h.responsable === fResp)
  ) : [], [hBase, verH, rango, fEstado, fSector, fResp])

  // Innecesarios filtrados (estados: pendiente/cerrado; foto en campo "foto")
  const iFilt = useMemo(() => verI ? iBase.filter(i =>
    enRango(i, rango) &&
    (fEstado === 'todos' || i.estado === fEstado || (fEstado === 'abierto' && i.estado === 'pendiente')) &&
    (fSector === 'todos' || i.nivel === fSector) &&
    (fResp   === 'todos' || i.responsable === fResp)
  ) : [], [iBase, verI, rango, fEstado, fSector, fResp])

  // ── Resumen (KPIs combinados) ───────────────────────────────────────────
  const resumen = useMemo(() => {
    const total = hFilt.length + iFilt.length
    const cerrados = hFilt.filter(h => h.estado === 'cerrado').length + iFilt.filter(i => i.estado === 'cerrado').length
    const abiertos = hFilt.filter(h => h.estado === 'abierto').length + iFilt.filter(i => i.estado === 'pendiente').length
    const enProceso = hFilt.filter(h => h.estado === 'en_proceso').length
    const vencidos = hFilt.filter(h => h.estado !== 'cerrado' && diasRestantes(h.fechaLimite) < 0).length
    const sinAsignar = hFilt.filter(h => h.estado !== 'cerrado' && !h.responsable).length +
                       iFilt.filter(i => i.estado !== 'cerrado' && !i.responsable).length
    // Tiempo de resolución (días) sobre cerrados con ambas fechas
    const tiempos = [...hFilt, ...iFilt]
      .filter(x => x.estado === 'cerrado' && x.creadoEn && x.cerradoEn)
      .map(x => Math.max(0, (new Date(x.cerradoEn) - new Date(x.creadoEn)) / 86400000))
    const promedioRes = tiempos.length ? Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length) : null
    const tasaCierre = total ? Math.round(cerrados / total * 100) : 0
    return { total, cerrados, abiertos, enProceso, vencidos, sinAsignar, promedioRes, tasaCierre }
  }, [hFilt, iFilt])

  // ── Tendencia mensual (6 meses) ─────────────────────────────────────────
  const tendencia = useMemo(() => {
    const meses = []
    for (let k = 5; k >= 0; k--) {
      const d = new Date(); d.setMonth(d.getMonth() - k)
      const mes = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
      const fila = { mes: label }
      if (verH) {
        fila.hNuevos   = hBase.filter(h => h.creadoEn?.slice(0,7) === mes).length
        fila.hCerrados = hBase.filter(h => h.cerradoEn?.slice(0,7) === mes).length
      }
      if (verI) {
        fila.iNuevos   = iBase.filter(i => i.creadoEn?.slice(0,7) === mes).length
        fila.iCerrados = iBase.filter(i => i.cerradoEn?.slice(0,7) === mes).length
      }
      meses.push(fila)
    }
    return meses
  }, [hBase, iBase, verH, verI])

  // ── Por sector ──────────────────────────────────────────────────────────
  const porSector = useMemo(() => {
    const mapa = {}
    const add = (k, cerrado) => {
      const key = k || 'Sin sector'
      if (!mapa[key]) mapa[key] = { nivel: key, abiertos: 0, cerrados: 0, total: 0 }
      mapa[key].total++
      if (cerrado) mapa[key].cerrados++; else mapa[key].abiertos++
    }
    hFilt.forEach(h => add(h.nivel, h.estado === 'cerrado'))
    iFilt.forEach(i => add(i.nivel, i.estado === 'cerrado'))
    return Object.values(mapa).sort((a,b)=>b.total-a.total).slice(0, 10)
  }, [hFilt, iFilt])

  // ── Por responsable ─────────────────────────────────────────────────────
  const porResponsable = useMemo(() => {
    const mapa = {}
    const add = (r, cerrado) => {
      if (!r) return
      if (!mapa[r]) mapa[r] = { nombre: r, total: 0, cerrados: 0 }
      mapa[r].total++; if (cerrado) mapa[r].cerrados++
    }
    hFilt.forEach(h => add(h.responsable, h.estado === 'cerrado'))
    iFilt.forEach(i => add(i.responsable, i.estado === 'cerrado'))
    return Object.values(mapa).sort((a,b)=>b.total-a.total).slice(0, 6)
  }, [hFilt, iFilt])

  // ── Quién reporta (participación 5S) ────────────────────────────────────
  const porReportante = useMemo(() => {
    const mapa = {}
    const add = (n) => { const k = n || 'Anónimo'; mapa[k] = (mapa[k]||0)+1 }
    hFilt.forEach(h => add(h.creadoPor))
    iFilt.forEach(i => add(i.creadoPor))
    return Object.entries(mapa).map(([nombre, total]) => ({ nombre, total }))
      .sort((a,b)=>b.total-a.total).slice(0, 8)
  }, [hFilt, iFilt])

  // ── Reincidencia: sectores con 2+ registros ─────────────────────────────
  const reincidentes = useMemo(() =>
    porSector.filter(s => s.total >= 2).slice(0, 5)
  , [porSector])

  // ── Innecesarios por destino ────────────────────────────────────────────
  const porDestino = useMemo(() => {
    if (!verI) return []
    const mapa = {}
    iFilt.forEach(i => { const k = i.destino || 'Sin definir'; mapa[k] = (mapa[k]||0)+1 })
    return Object.entries(mapa).map(([name, value], idx) => ({ name, value, color: COLORES_PIE[idx % COLORES_PIE.length] }))
      .sort((a,b)=>b.value-a.value)
  }, [iFilt, verI])

  // ── Pie por estado ──────────────────────────────────────────────────────
  const pieEstados = [
    { name: 'Abiertos/Pend.', value: resumen.abiertos,  color: '#a32d2d' },
    { name: 'En proceso',     value: resumen.enProceso,  color: '#b86a00' },
    { name: 'Cerrados',       value: resumen.cerrados,   color: '#1a7a4a' },
  ].filter(d => d.value > 0)

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportarExcel = async () => {
    const { utils, writeFile } = await import('xlsx')
    const wb = utils.book_new()
    if (verH) {
      const filas = hFilt.map(h => ({
        'N°': h.id?.slice(-5) || '', 'Fecha': fmtFecha(h.creadoEn), 'Estado': h.estado,
        'Sector': h.nivel || '', 'Zona': h.zona || '', 'Descripción': h.descripcion || '',
        'Observación': h.observacion || '', 'Cargado por': h.creadoPor || '',
        'Responsable': h.responsable || '', 'Fecha límite': h.fechaLimite ? fmtFecha(h.fechaLimite) : '',
        'Resolución': h.resolucion || '', 'Cerrado el': h.cerradoEn ? fmtFecha(h.cerradoEn) : '',
      }))
      const ws = utils.json_to_sheet(filas)
      ws['!cols'] = [6,10,10,10,10,35,25,16,16,12,25,10].map(w => ({ wch: w }))
      utils.book_append_sheet(wb, ws, 'Hallazgos')
    }
    if (verI) {
      const filas = iFilt.map(i => ({
        'N°': i.id?.slice(-5) || '', 'Fecha': fmtFecha(i.creadoEn), 'Estado': i.estado,
        'Sector': i.nivel || '', 'Detalle': i.detalle || '', 'Cantidad': i.cantidad || '',
        'Causa': i.causa || '', 'Destino': i.destino || '', 'Cargado por': i.creadoPor || '',
        'Responsable': i.responsable || '', 'Cerrado el': i.cerradoEn ? fmtFecha(i.cerradoEn) : '',
      }))
      const ws = utils.json_to_sheet(filas)
      ws['!cols'] = [6,10,10,10,30,10,20,18,16,16,10].map(w => ({ wch: w }))
      utils.book_append_sheet(wb, ws, 'Innecesarios')
    }
    const resumenFilas = [
      ['Proyecto', proyectoActivo?.nombre || ''],
      ['Tipo', tipo], ['Total', resumen.total], ['Abiertos/Pendientes', resumen.abiertos],
      ['Cerrados', resumen.cerrados], ['Vencidos', resumen.vencidos],
      ['Sin asignar', resumen.sinAsignar], ['Tasa de cierre (%)', resumen.tasaCierre],
      ['Tiempo prom. resolución (días)', resumen.promedioRes ?? 'S/D'],
    ]
    const wsR = utils.aoa_to_sheet(resumenFilas)
    wsR['!cols'] = [{ wch: 32 }, { wch: 20 }]
    utils.book_append_sheet(wb, wsR, 'Resumen')
    writeFile(wb, `NDTracker5S_${tipo}_${proyectoActivo?.codigo || ''}_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // ── Export PDF (resumen) ──────────────────────────────────────────────────
  const exportarPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const ancho = doc.internal.pageSize.getWidth()
    doc.setFillColor(46, 42, 43); doc.rect(0, 0, ancho, 26, 'F')
    doc.setTextColor(167, 198, 237); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('NDTRACKER 5S', 14, 16)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(200,200,200)
    doc.text(`Reporte de Estadísticas · ${proyectoActivo?.nombre || ''}`, 14, 22)
    doc.text(new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' }), ancho - 14, 22, { align: 'right' })
    let y = 36
    doc.setTextColor(40,40,40); doc.setFontSize(11); doc.setFont('helvetica','bold')
    doc.text('Resumen ejecutivo', 14, y); y += 8
    const kpi = [
      ['Tipo de registro', tipo],
      ['Total', resumen.total], ['Abiertos / Pendientes', resumen.abiertos],
      ['Cerrados', resumen.cerrados], ['Vencidos', resumen.vencidos],
      ['Sin asignar', resumen.sinAsignar], ['Tasa de cierre', `${resumen.tasaCierre}%`],
      ['Tiempo prom. resolución', resumen.promedioRes != null ? `${resumen.promedioRes} días` : 'S/D'],
    ]
    kpi.forEach(([l, v]) => {
      doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(100,100,100); doc.text(l + ':', 14, y)
      doc.setFont('helvetica','bold'); doc.setTextColor(40,40,40); doc.text(String(v), 75, y); y += 6
    })
    doc.save(`NDTracker5S_Estadisticas_${proyectoActivo?.codigo || ''}_${new Date().toISOString().slice(0,10)}.pdf`)
  }

  if (!proyectoActivo) return (
    <Layout><PageWrap>
      <EmptyState icon={BarChart2} title="Sin proyecto activo" sub="Seleccioná un proyecto para ver estadísticas" />
    </PageWrap></Layout>
  )

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Estadísticas" subtitle={proyectoActivo.nombre}>
          <Btn variant="secondary" onClick={exportarExcel}><Download size={14} /> Excel</Btn>
          <Btn variant="secondary" onClick={exportarPDF}><FileText size={14} /> PDF</Btn>
        </Topbar>

        {/* Toggle tipo */}
        <div style={{ display: 'inline-flex', gap: 4, background: '#ececed', borderRadius: 9, padding: 3, marginBottom: 16 }}>
          {[['hallazgos','Hallazgos'],['innecesarios','Innecesarios'],['ambos','Ambos']].map(([val,lbl]) => (
            <button key={val} onClick={() => { setTipo(val); setFEstado('todos'); setFSector('todos'); setFResp('todos') }}
              style={{ border: 'none', cursor: 'pointer', padding: '6px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-title)',
                background: tipo === val ? 'var(--nd-black)' : 'transparent', color: tipo === val ? 'var(--nd-light)' : '#777' }}>{lbl}</button>
          ))}
        </div>

        {/* Barra de filtros */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          <select value={rango} onChange={e => setRango(e.target.value)} style={selStyle}>
            <option value="todos">Todo el historial</option>
            <option value="mes_actual">Este mes</option>
            <option value="mes_anterior">Mes pasado</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="180d">Últimos 180 días</option>
            <option value="anio">Este año</option>
          </select>

          <select value={fEstado} onChange={e => setFEstado(e.target.value)} style={selStyle}>
            <option value="todos">Todos los estados</option>
            <option value="abierto">{verI && !verH ? 'Pendientes' : 'Abiertos / Pendientes'}</option>
            {verH && <option value="en_proceso">En proceso</option>}
            <option value="cerrado">Cerrados</option>
          </select>

          <select value={fSector} onChange={e => setFSector(e.target.value)} style={selStyle}>
            <option value="todos">Todos los sectores</option>
            {sectores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={fResp} onChange={e => setFResp(e.target.value)} style={selStyle}>
            <option value="todos">Todos los responsables</option>
            {responsables.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <MetricCard label="Total" value={resumen.total} color="#425563" />
          <MetricCard label="Abiertos / Pend." value={resumen.abiertos} color="#a32d2d" />
          <MetricCard label="Cerrados" value={resumen.cerrados} color="#1a7a4a" />
          <MetricCard label="Tasa de cierre" value={`${resumen.tasaCierre}%`} color={resumen.tasaCierre >= 70 ? '#1a7a4a' : '#b86a00'} />
          {verH && <MetricCard label="Vencidos" value={resumen.vencidos} color={resumen.vencidos > 0 ? '#a32d2d' : '#1a7a4a'} />}
          <MetricCard label="Sin asignar" value={resumen.sinAsignar} color={resumen.sinAsignar > 0 ? '#b86a00' : '#1a7a4a'} />
          <MetricCard label="Prom. resolución" value={resumen.promedioRes != null ? `${resumen.promedioRes}d` : '-'} color="#425563" sub="días promedio" />
        </div>

        {/* Tendencia + Pie estado */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card>
            <CardTitle>Tendencia mensual</CardTitle>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={tendencia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {verH && <Line type="monotone" dataKey="hNuevos"   stroke="#a32d2d" strokeWidth={2} dot={{ r: 2 }} name="Hallazgos nuevos" />}
                {verH && <Line type="monotone" dataKey="hCerrados" stroke="#1a7a4a" strokeWidth={2} dot={{ r: 2 }} name="Hallazgos cerrados" />}
                {verI && <Line type="monotone" dataKey="iNuevos"   stroke="#b86a00" strokeWidth={2} dot={{ r: 2 }} name="Innec. nuevos" />}
                {verI && <Line type="monotone" dataKey="iCerrados" stroke="#425563" strokeWidth={2} dot={{ r: 2 }} name="Innec. cerrados" />}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardTitle>Distribución por estado</CardTitle>
            {pieEstados.length === 0
              ? <EmptyState icon={BarChart2} title="Sin datos" sub="" />
              : <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={pieEstados} cx="50%" cy="45%" innerRadius={46} outerRadius={70} dataKey="value" label={false} labelLine={false}>
                      {pieEstados.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value, entry) => `${value} (${Math.round(entry.payload.percent*100)}%)`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                  </PieChart>
                </ResponsiveContainer>
            }
          </Card>
        </div>

        {/* Por sector + Por responsable */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card>
            <CardTitle>Por sector</CardTitle>
            {porSector.length === 0
              ? <EmptyState icon={BarChart2} title="Sin datos" sub="" />
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={porSector} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nivel" tick={{ fontSize: 10 }} width={72} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                    <Bar dataKey="abiertos" stackId="a" fill="#a32d2d" name="Abiertos/Pend." />
                    <Bar dataKey="cerrados" stackId="a" fill="#1a7a4a" name="Cerrados" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>

          <Card>
            <CardTitle>Por responsable</CardTitle>
            {porResponsable.length === 0
              ? <EmptyState icon={BarChart2} title="Sin datos" sub="Asigná responsables" />
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={porResponsable} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                    <Bar dataKey="total"    stackId="a" fill="#b86a00" name="Total" />
                    <Bar dataKey="cerrados" stackId="a" fill="#1a7a4a" name="Cerrados" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>
        </div>

        {/* Participación + (Destino si hay innecesarios) */}
        <div style={{ display: 'grid', gridTemplateColumns: verI ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
          <Card>
            <CardTitle>Participación — quién reporta</CardTitle>
            {porReportante.length === 0
              ? <EmptyState icon={BarChart2} title="Sin datos" sub="" />
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={porReportante} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                    <Bar dataKey="total" fill="#425563" name="Cargados" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>

          {verI && (
            <Card>
              <CardTitle>Innecesarios por destino</CardTitle>
              {porDestino.length === 0
                ? <EmptyState icon={BarChart2} title="Sin datos" sub="" />
                : <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={porDestino} cx="50%" cy="45%" innerRadius={46} outerRadius={70} dataKey="value" label={false} labelLine={false}>
                        {porDestino.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value, entry) => `${value} (${Math.round(entry.payload.percent*100)}%)`} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                    </PieChart>
                  </ResponsiveContainer>
              }
            </Card>
          )}
        </div>

        {/* Reincidencia por sector */}
        {reincidentes.length > 0 && (
          <Card>
            <CardTitle>Sectores con reincidencia (2+ registros)</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {reincidentes.map(s => (
                <div key={s.nivel} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <span style={{ width: 90, fontWeight: 600, color: 'var(--nd-mid)' }}>{s.nivel}</span>
                  <div style={{ flex: 1, height: 18, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, s.total / reincidentes[0].total * 100)}%`, height: '100%', background: '#a32d2d', borderRadius: 5 }} />
                  </div>
                  <span style={{ width: 28, textAlign: 'right', fontWeight: 700, color: '#a32d2d' }}>{s.total}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

      </PageWrap>
    </Layout>
  )
}
