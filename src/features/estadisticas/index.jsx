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

export function Estadisticas() {
  const { hallazgos, innecesarios, proyectoActivo, usuarioActual } = useStore()
  const [rango, setRango] = useState('todos')

  const hProyecto = useMemo(() =>
    hallazgos.filter(h => h.proyectoId === proyectoActivo?.id)
  , [hallazgos, proyectoActivo])

  const filtrado = useMemo(() => {
    if (rango === 'todos') return hProyecto
    const corte = new Date()
    if (rango === '30d')  corte.setDate(corte.getDate() - 30)
    if (rango === '90d')  corte.setDate(corte.getDate() - 90)
    if (rango === '180d') corte.setDate(corte.getDate() - 180)
    return hProyecto.filter(h => new Date(h.creadoEn) >= corte)
  }, [hProyecto, rango])

  // Resumen general
  const resumen = useMemo(() => {
    const abiertos   = filtrado.filter(h => h.estado === 'abierto').length
    const en_proceso = filtrado.filter(h => h.estado === 'en_proceso').length
    const cerrados   = filtrado.filter(h => h.estado === 'cerrado').length
    const vencidos   = filtrado.filter(h => h.estado !== 'cerrado' && diasRestantes(h.fechaLimite) < 0).length
    const conFoto    = filtrado.filter(h => h.fotoApertura).length
    const sinAsignar = filtrado.filter(h => h.estado !== 'cerrado' && !h.responsable).length
    const tiemposRes = filtrado
      .filter(h => h.estado === 'cerrado' && h.creadoEn && h.cerradoEn)
      .map(h => Math.max(0, (new Date(h.cerradoEn) - new Date(h.creadoEn)) / (1000 * 60 * 60 * 24)))
    const promedioRes = tiemposRes.length
      ? Math.round(tiemposRes.reduce((a, b) => a + b, 0) / tiemposRes.length)
      : null
    return { abiertos, en_proceso, cerrados, vencidos, conFoto, sinAsignar, promedioRes, total: filtrado.length }
  }, [filtrado])

  // Por sector
  const porSector = useMemo(() => {
    const mapa = {}
    filtrado.forEach(h => {
      const k = h.nivel || 'Sin sector'
      if (!mapa[k]) mapa[k] = { nivel: k, abiertos: 0, cerrados: 0, total: 0 }
      mapa[k].total++
      if (h.estado === 'cerrado') mapa[k].cerrados++
      else mapa[k].abiertos++
    })
    return Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 10)
  }, [filtrado])

  // Tendencia 6 meses
  const tendencia = useMemo(() => {
    const meses = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const mes = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
      const nuevos  = hProyecto.filter(h => h.creadoEn?.slice(0, 7) === mes).length
      const cerrados = hProyecto.filter(h => h.cerradoEn?.slice(0, 7) === mes).length
      meses.push({ mes: label, nuevos, cerrados })
    }
    return meses
  }, [hProyecto])

  // Por responsable
  const porResponsable = useMemo(() => {
    const mapa = {}
    filtrado.filter(h => h.responsable).forEach(h => {
      if (!mapa[h.responsable]) mapa[h.responsable] = { nombre: h.responsable, total: 0, cerrados: 0 }
      mapa[h.responsable].total++
      if (h.estado === 'cerrado') mapa[h.responsable].cerrados++
    })
    return Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 6)
  }, [filtrado])

  // Pie por estado
  const pieEstados = [
    { name: 'Abiertos',    value: resumen.abiertos,   color: '#a32d2d' },
    { name: 'En proceso',  value: resumen.en_proceso,  color: '#b86a00' },
    { name: 'Cerrados',    value: resumen.cerrados,    color: '#1a7a4a' },
  ].filter(d => d.value > 0)

  // ── Exportar Excel ────────────────────────────────────────────────────────
  const exportarExcel = async () => {
    const { utils, writeFile } = await import('xlsx')
    const filas = filtrado.map(h => ({
      'N°':           h.id?.slice(-5) || '',
      'Fecha':        fmtFecha(h.creadoEn),
      'Hora':         h.creadoEn ? new Date(h.creadoEn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '',
      'Estado':       h.estado,
      'Sector':       h.nivel || '',
      'Zona':         h.zona  || '',
      'Descripción':  h.descripcion || '',
      'Observación':  h.observacion || '',
      'Cargado por':  h.creadoPor  || '',
      'Responsable':  h.responsable || '',
      'Fecha límite': h.fechaLimite ? fmtFecha(h.fechaLimite) : '',
      'Solución':     h.solucion || '',
      'Resolución':   h.resolucion || '',
      'Cerrado el':   h.cerradoEn ? fmtFecha(h.cerradoEn) : '',
    }))
    const ws = utils.json_to_sheet(filas)
    ws['!cols'] = [6,10,6,10,10,10,35,25,16,16,12,25,25,10].map(w => ({ wch: w }))
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Hallazgos')

    // Hoja resumen
    const resumenFilas = [
      ['Proyecto', proyectoActivo?.nombre || ''],
      ['Período',  rango === 'todos' ? 'Todo el historial' : `Últimos ${rango}`],
      ['Total',    resumen.total],
      ['Abiertos', resumen.abiertos],
      ['En proceso', resumen.en_proceso],
      ['Cerrados', resumen.cerrados],
      ['Vencidos', resumen.vencidos],
      ['Sin asignar', resumen.sinAsignar],
      ['Tiempo prom. resolución (días)', resumen.promedioRes ?? 'S/D'],
    ]
    const wsRes = utils.aoa_to_sheet(resumenFilas)
    wsRes['!cols'] = [{ wch: 30 }, { wch: 20 }]
    utils.book_append_sheet(wb, wsRes, 'Resumen')

    writeFile(wb, `NDTracker5S_Hallazgos_${proyectoActivo?.codigo || ''}_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  const exportarPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const ancho = doc.internal.pageSize.getWidth()
    let y = 18

    // Header
    doc.setFillColor(46, 42, 43)
    doc.rect(0, 0, ancho, 26, 'F')
    doc.setTextColor(167, 198, 237)
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('NDTRACKER 5S', 14, 16)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 200, 200)
    doc.text(`Reporte de Hallazgos · ${proyectoActivo?.nombre || ''}`, 14, 22)
    doc.text(new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' }), ancho - 14, 22, { align: 'right' })

    y = 36
    // KPIs
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('Resumen ejecutivo', 14, y); y += 8

    const kpiData = [
      ['Total hallazgos', resumen.total],
      ['Abiertos',        resumen.abiertos],
      ['En proceso',      resumen.en_proceso],
      ['Cerrados',        resumen.cerrados],
      ['Vencidos',        resumen.vencidos],
      ['Sin asignar',     resumen.sinAsignar],
      ['Tiempo prom. resolución', resumen.promedioRes != null ? `${resumen.promedioRes} días` : 'S/D'],
    ]
    kpiData.forEach(([label, val]) => {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100); doc.text(label + ':', 14, y)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40)
      doc.text(String(val), 70, y)
      y += 6
    })

    y += 6
    // Tabla hallazgos
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40)
    doc.text('Listado de hallazgos', 14, y); y += 6

    const cols   = [14, 28, 52, 100, 130, 160]
    const headers = ['Fecha', 'Estado', 'Sector', 'Descripción', 'Responsable', 'Límite']
    doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.setFillColor(240, 240, 242); doc.rect(14, y - 4, ancho - 28, 7, 'F')
    headers.forEach((h, i) => { doc.setTextColor(80, 80, 80); doc.text(h, cols[i], y) })
    y += 5

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    filtrado.slice(0, 40).forEach((h, idx) => {
      if (y > 270) { doc.addPage(); y = 20 }
      if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(14, y - 4, ancho - 28, 6, 'F') }
      doc.setTextColor(40, 40, 40)
      doc.text(fmtFecha(h.creadoEn),                   cols[0], y)
      doc.text(h.estado || '',                          cols[1], y)
      doc.text((h.nivel || '').slice(0, 18),            cols[2], y)
      doc.text((h.descripcion || '').slice(0, 30),      cols[3], y)
      doc.text((h.responsable || '-').slice(0, 16),     cols[4], y)
      doc.text(h.fechaLimite ? fmtFecha(h.fechaLimite) : '-', cols[5], y)
      y += 6
    })

    if (filtrado.length > 40) {
      doc.setFontSize(8); doc.setTextColor(150, 150, 150)
      doc.text(`... y ${filtrado.length - 40} registros más. Exportá a Excel para el listado completo.`, 14, y + 4)
    }

    doc.save(`NDTracker5S_Reporte_${proyectoActivo?.codigo || ''}_${new Date().toISOString().slice(0,10)}.pdf`)
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
          <select value={rango} onChange={e => setRango(e.target.value)}
            style={{ height: 34, padding: '0 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--nd-white)', cursor: 'pointer' }}>
            <option value="todos">Todo el historial</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="180d">Últimos 180 días</option>
          </select>
          <Btn variant="secondary" onClick={exportarExcel}><Download size={14} /> Excel</Btn>
          <Btn variant="secondary" onClick={exportarPDF}><FileText size={14} /> PDF</Btn>
        </Topbar>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <MetricCard label="Total"           value={resumen.total}         color="#425563" />
          <MetricCard label="Abiertos"        value={resumen.abiertos}      color="#a32d2d" />
          <MetricCard label="En proceso"      value={resumen.en_proceso}    color="#b86a00" />
          <MetricCard label="Cerrados"        value={resumen.cerrados}      color="#1a7a4a" />
          <MetricCard label="Vencidos"        value={resumen.vencidos}      color={resumen.vencidos > 0 ? '#a32d2d' : '#1a7a4a'} />
          <MetricCard label="Sin asignar"     value={resumen.sinAsignar}    color={resumen.sinAsignar > 0 ? '#b86a00' : '#1a7a4a'} />
          <MetricCard
            label="Prom. resolución"
            value={resumen.promedioRes != null ? `${resumen.promedioRes}d` : '-'}
            color="#425563" sub="días promedio"
          />
        </div>

        {/* Tendencia + Pie */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card>
            <CardTitle>Tendencia mensual</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tendencia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: 'var(--font-body)' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="nuevos"  stroke="#a32d2d" strokeWidth={2} dot={{ r: 3 }} name="Nuevos" />
                <Line type="monotone" dataKey="cerrados" stroke="#1a7a4a" strokeWidth={2} dot={{ r: 3 }} name="Cerrados" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardTitle>Distribución por estado</CardTitle>
            {pieEstados.length === 0
              ? <EmptyState icon={BarChart2} title="Sin datos" sub="" />
              : <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieEstados} cx="50%" cy="45%" innerRadius={46} outerRadius={70} dataKey="value" label={false} labelLine={false}>
                      {pieEstados.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value, entry) => `${value} (${Math.round(entry.payload.percent*100)}%)`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} formatter={(v, n) => [v, n]} />
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
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="nivel" tick={{ fontSize: 10 }} width={72} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                    <Bar dataKey="abiertos" stackId="a" fill="#a32d2d" name="Abiertos" radius={[0,0,0,0]} />
                    <Bar dataKey="cerrados" stackId="a" fill="#1a7a4a" name="Cerrados" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>

          <Card>
            <CardTitle>Por responsable</CardTitle>
            {porResponsable.length === 0
              ? <EmptyState icon={BarChart2} title="Sin datos" sub="Asigná responsables a los hallazgos" />
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={porResponsable} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                    <Bar dataKey="total"    stackId="a" fill="#b86a00" name="Total"    radius={[0,0,0,0]} />
                    <Bar dataKey="cerrados" stackId="a" fill="#1a7a4a" name="Cerrados" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>
        </div>

      </PageWrap>
    </Layout>
  )
}
