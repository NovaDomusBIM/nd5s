import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Package, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Layout, PageWrap, Topbar, Card, CardTitle, MetricCard, EmptyState, Btn } from '../../components'
import { fmtFecha, semaforo, diasRestantes } from '../../utils'

export function Dashboard() {
  const { hallazgos, innecesarios, proyectoActivo, usuarioActual } = useStore()
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const h = hallazgos.filter(x => x.proyectoId === proyectoActivo?.id)
    const abiertos    = h.filter(x => x.estado === 'abierto').length
    const en_proceso  = h.filter(x => x.estado === 'en_proceso').length
    const cerrados    = h.filter(x => x.estado === 'cerrado').length
    const vencidos    = h.filter(x => x.estado !== 'cerrado' && diasRestantes(x.fechaLimite) < 0).length
    const proxVencer  = h.filter(x => x.estado !== 'cerrado' && diasRestantes(x.fechaLimite) >= 0 && diasRestantes(x.fechaLimite) <= 3).length
    const innecPend   = innecesarios.filter(x => x.proyectoId === proyectoActivo?.id && x.estado === 'pendiente').length

    // Últimos 5 hallazgos abiertos ordenados por fecha
    const recientes = [...h]
      .filter(x => x.estado !== 'cerrado')
      .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))
      .slice(0, 5)

    return { abiertos, en_proceso, cerrados, vencidos, proxVencer, innecPend, recientes, total: h.length }
  }, [hallazgos, innecesarios, proyectoActivo])

  if (!proyectoActivo) return (
    <Layout>
      <PageWrap>
        <EmptyState
          icon={AlertTriangle}
          title="Sin proyecto activo"
          sub="Configurá un proyecto desde el panel de admin"
          action={usuarioActual?.rol === 'admin' && <Btn onClick={() => navigate('/proyectos')}>Ir a proyectos</Btn>}
        />
      </PageWrap>
    </Layout>
  )

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Dashboard" subtitle={proyectoActivo.nombre}>
          <Btn onClick={() => navigate('/hallazgos')} variant="primary">
            + Nuevo hallazgo
          </Btn>
        </Topbar>

        {/* Métricas principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          <MetricCard
            label="Abiertos"
            value={stats.abiertos}
            color="#a32d2d"
            sub="sin resolución"
            onClick={() => navigate('/hallazgos?estado=abierto')}
          />
          <MetricCard
            label="En proceso"
            value={stats.en_proceso}
            color="#b86a00"
            sub="siendo resueltos"
            onClick={() => navigate('/hallazgos?estado=en_proceso')}
          />
          <MetricCard
            label="Cerrados"
            value={stats.cerrados}
            color="#1a7a4a"
            sub="resueltos"
          />
          <MetricCard
            label="Vencidos"
            value={stats.vencidos}
            color={stats.vencidos > 0 ? '#a32d2d' : '#1a7a4a'}
            sub="fuera de plazo"
          />
          <MetricCard
            label="Innecesarios"
            value={stats.innecPend}
            color="#425563"
            sub="pendientes"
            onClick={() => navigate('/innecesarios')}
          />
        </div>

        {/* Alertas */}
        {(stats.vencidos > 0 || stats.proxVencer > 0) && (
          <Card style={{ marginBottom: 20, borderLeft: '3px solid #a32d2d', borderRadius: '0 12px 12px 0', background: '#fff8f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} color="#a32d2d" />
              <div>
                {stats.vencidos > 0 && (
                  <p style={{ fontSize: 13, color: '#a32d2d', fontWeight: 600 }}>
                    {stats.vencidos} hallazgo{stats.vencidos > 1 ? 's' : ''} vencido{stats.vencidos > 1 ? 's' : ''}
                  </p>
                )}
                {stats.proxVencer > 0 && (
                  <p style={{ fontSize: 13, color: '#b86a00', fontWeight: 600 }}>
                    {stats.proxVencer} hallazgo{stats.proxVencer > 1 ? 's' : ''} vence{stats.proxVencer === 1 ? '' : 'n'} en menos de 3 días
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Hallazgos recientes */}
        <Card>
          <CardTitle>Hallazgos abiertos recientes</CardTitle>
          {stats.recientes.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Sin hallazgos abiertos"
              sub="Todo en orden en este proyecto"
            />
          ) : (
            <div>
              {stats.recientes.map(h => {
                const s = semaforo(h)
                return (
                  <div
                    key={h.id}
                    onClick={() => navigate(`/hallazgos?id=${h.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 0', borderBottom: '0.5px solid var(--nd-border)',
                      cursor: 'pointer', gap: 12
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--nd-black)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.descripcion}
                      </p>
                      <p style={{ fontSize: 11, color: '#aaa' }}>
                        {h.nivel}{h.zona ? ` · ${h.zona}` : ''} · {fmtFecha(h.creadoEn)}
                        {h.responsable ? ` · ${h.responsable}` : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600, fontFamily: 'var(--font-title)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
              <div style={{ marginTop: 14 }}>
                <Btn variant="secondary" onClick={() => navigate('/hallazgos')}>
                  Ver todos los hallazgos →
                </Btn>
              </div>
            </div>
          )}
        </Card>
      </PageWrap>
    </Layout>
  )
}
