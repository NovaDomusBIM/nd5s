import React, { useState, useEffect } from 'react'
import { Settings, Phone, Layers, Bell, Shield, Save, Database, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getItem, setItem, updateItem, addItem, deleteItem, getCol } from '../../services/firebase'
import { Layout, PageWrap, Topbar, Card, CardTitle, Btn, Input, Select } from '../../components'

const SECCION = ({ icon: Icon, title, children }) => (
  <Card style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '0.5px solid var(--nd-border)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(66,85,99,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color="var(--nd-mid)" />
      </div>
      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 700 }}>{title}</h3>
    </div>
    {children}
  </Card>
)

export function Configuracion() {
  const { proyectoActivo, actualizarProyecto, usuarioActual } = useStore()
  const esAdmin = usuarioActual?.rol === 'admin'
  const [config, setConfig]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [nivelesEdit, setNivelesEdit] = useState('')
  const [seedLog,  setSeedLog]  = useState([])
  const [seeding,  setSeeding]  = useState(false)
  const [seedDone, setSeedDone] = useState(false)
  const [confirmBorrar, setConfirmBorrar] = useState(false)
  const [borrando, setBorrando] = useState(false)

  const hoy  = new Date()
  const hace = (dias) => new Date(hoy - dias * 86400000).toISOString()

  const HALLAZGOS_DEMO = [
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'Acumulación de escombros en escalera de emergencia', nivel:'P03', zona:'Escalera SE', estado:'abierto', creadoPor:'Lucas Vega', creadoPorId:'u-lv', responsable:null, fechaLimite:null, solucion:null, creadoEn:hace(8), actualizadoEn:hace(8) },
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'Herramientas sin guardar sobre losa — riesgo de caída', nivel:'P07', zona:'Eje C-D', estado:'en_proceso', creadoPor:'Eduardo Cáceres', creadoPorId:'u-ec', responsable:'Eduardo Cáceres', fechaLimite:hace(-2), solucion:'Colocar caja porta-herramientas en sector', creadoEn:hace(5), actualizadoEn:hace(3) },
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'Falta señalización de zona de trabajo eléctrico', nivel:'Planta Baja', zona:'Tablero principal', estado:'cerrado', creadoPor:'Lucas Vega', creadoPorId:'u-lv', responsable:'Eduardo Cáceres', fechaLimite:hace(1), solucion:'Colocar cinta de peligro y cartel', resolucion:'Se colocaron carteles de peligro y cinta de balización.', cerradoEn:hace(1), creadoEn:hace(6), actualizadoEn:hace(1) },
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'Derrame de cemento fresco en acceso principal', nivel:'Planta Baja', zona:'Acceso obra', estado:'cerrado', creadoPor:'Fernando Berdini', creadoPorId:'u-fb', responsable:'Lucas Vega', fechaLimite:hace(3), resolucion:'Se limpió el derrame y se colocó señal de piso mojado.', cerradoEn:hace(3), creadoEn:hace(7), actualizadoEn:hace(3) },
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'Cables eléctricos sin canalizar sobre el piso', nivel:'P05', zona:'Dpto 5A', estado:'abierto', creadoPor:'Eduardo Cáceres', creadoPorId:'u-ec', responsable:null, fechaLimite:null, solucion:null, creadoEn:hace(2), actualizadoEn:hace(2) },
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'EPP incompleto — operarios sin casco en altura', nivel:'P09', zona:'Balcones frente', estado:'en_proceso', creadoPor:'Lucas Vega', creadoPorId:'u-lv', responsable:'Eduardo Cáceres', fechaLimite:hace(-1), solucion:'Reforzar charla de seguridad y verificar stock de EPP', creadoEn:hace(4), actualizadoEn:hace(2) },
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'Contenedor de residuos desbordado — material mezclado', nivel:'Obrador', zona:'Sector residuos', estado:'cerrado', creadoPor:'Eduardo Cáceres', creadoPorId:'u-ec', responsable:'Lucas Vega', fechaLimite:hace(2), resolucion:'Contenedor vaciado y residuos clasificados correctamente.', cerradoEn:hace(2), creadoEn:hace(9), actualizadoEn:hace(2) },
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'Andamio sin fijar correctamente — tablones sueltos', nivel:'P11', zona:'Fachada sur', estado:'abierto', creadoPor:'Lucas Vega', creadoPorId:'u-lv', responsable:null, fechaLimite:hace(-3), solucion:null, creadoEn:hace(12), actualizadoEn:hace(12) },
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'Materiales bloqueando salida de emergencia', nivel:'Sótano', zona:'Depósito', estado:'en_proceso', creadoPor:'Fernando Berdini', creadoPorId:'u-fb', responsable:'Eduardo Cáceres', fechaLimite:hace(-5), solucion:'Reubicar pallets en sector de acopio designado', creadoEn:hace(15), actualizadoEn:hace(5) },
    { proyectoId:'p10', proyectoCodigo:'10', descripcion:'Piso húmedo sin señalizar en baño de servicio', nivel:'Entrepiso', zona:'Baño servicio', estado:'cerrado', creadoPor:'Eduardo Cáceres', creadoPorId:'u-ec', responsable:'Lucas Vega', fechaLimite:hace(0), resolucion:'Se secó el área y se colocó cartel indicador.', cerradoEn:hace(0), creadoEn:hace(3), actualizadoEn:hace(0) },
  ]

  const INNECESARIOS_DEMO = [
    { proyectoId:'p10', detalle:'Bidones de agua vacíos acumulados', nivel:'Obrador', cantidad:'12 unidades', causa:'No se retiraron luego de uso', destino:'Retiro por camión de residuos', responsable:'Eduardo Cáceres', fechaSolucion:hace(-3), estado:'pendiente', creadoPor:'Lucas Vega', creadoPorId:'u-lv', creadoEn:hace(10), actualizadoEn:hace(10) },
    { proyectoId:'p10', detalle:'Bolsas de cemento rotas y mojadas — inutilizables', nivel:'Sótano', cantidad:'8 bolsas', causa:'Mal almacenamiento, contacto con humedad', destino:null, responsable:null, fechaSolucion:null, estado:'pendiente', creadoPor:'Eduardo Cáceres', creadoPorId:'u-ec', creadoEn:hace(5), actualizadoEn:hace(5) },
    { proyectoId:'p10', detalle:'Encofrado de madera en mal estado — descartado', nivel:'P02', cantidad:'20 tablones aprox.', causa:'Fin de vida útil, no reparables', destino:'Retiro a basural habilitado', responsable:'Lucas Vega', fechaSolucion:hace(-7), estado:'cerrado', observacionCierre:'Se cargó en volquete y se retiró de obra.', cerradoEn:hace(2), creadoPor:'Lucas Vega', creadoPorId:'u-lv', creadoEn:hace(14), actualizadoEn:hace(2) },
    { proyectoId:'p10', detalle:'Caños de PVC de diámetro equivocado — sobrante de otro proyecto', nivel:'Obrador', cantidad:'6 tiras de 3m', causa:'Compra errónea de lote anterior', destino:'Devolución a proveedor', responsable:'Eduardo Cáceres', fechaSolucion:null, estado:'pendiente', creadoPor:'Fernando Berdini', creadoPorId:'u-fb', creadoEn:hace(7), actualizadoEn:hace(7) },
    { proyectoId:'p10', detalle:'Amoladora rota sin cabo ni disco — fuera de uso', nivel:'Obrador', cantidad:'1 unidad', causa:'Rotura por uso, no fue dada de baja', destino:'Baja de inventario', responsable:'Lucas Vega', fechaSolucion:hace(-2), estado:'cerrado', observacionCierre:'Se dio de baja en inventario y se descartó.', cerradoEn:hace(1), creadoPor:'Eduardo Cáceres', creadoPorId:'u-ec', creadoEn:hace(6), actualizadoEn:hace(1) },
  ]

  const runSeed = async () => {
    setSeeding(true); setSeedLog([]); setSeedDone(false)
    const log = (msg) => setSeedLog(prev => [...prev, msg])
    try {
      for (const h of HALLAZGOS_DEMO) {
        await addItem('hallazgos', h)
        log('✓ ' + h.descripcion.slice(0, 45) + '...')
      }
      for (const i of INNECESARIOS_DEMO) {
        await addItem('innecesarios', i)
        log('✓ ' + i.detalle.slice(0, 45) + '...')
      }
      log(''); log('✅ 10 hallazgos + 5 innecesarios cargados.')
      setSeedDone(true)
    } catch(e) {
      log('❌ Error: ' + e.message)
    }
    setSeeding(false)
  }

  const borrarTodo = async () => {
    setBorrando(true); setSeedLog([]); setConfirmBorrar(false)
    const log = (msg) => setSeedLog(prev => [...prev, msg])
    try {
      const hallazgos    = await getCol('hallazgos')
      const innecesarios = await getCol('innecesarios')
      for (const h of hallazgos)    { await deleteItem('hallazgos', h.id);    log('🗑 ' + h.descripcion?.slice(0,40)) }
      for (const i of innecesarios) { await deleteItem('innecesarios', i.id); log('🗑 ' + i.detalle?.slice(0,40)) }
      log(''); log('✅ Todo borrado.')
      setSeedDone(false)
    } catch(e) { log('❌ Error: ' + e.message) }
    setBorrando(false)
  }

  useEffect(() => {
    cargar()
  }, [proyectoActivo])

  const cargar = async () => {
    try {
      const cfg = await getItem('config', 'global') || {}
      setConfig(cfg)
    } catch {}
    if (proyectoActivo?.niveles) {
      setNivelesEdit(proyectoActivo.niveles.join('\n'))
    }
  }

  const guardar = async () => {
    setSaving(true)
    try {
      await setItem('config', 'global', { ...config, actualizadoEn: new Date().toISOString() })
      // Actualizar niveles del proyecto activo si cambiaron
      if (proyectoActivo) {
        const niveles = nivelesEdit.split('\n').map(x => x.trim()).filter(Boolean)
        await actualizarProyecto(proyectoActivo.id, { niveles })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { alert('Error al guardar: ' + e.message) }
    finally { setSaving(false) }
  }

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }))

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Configuración" subtitle="Ajustes generales de NDTracker5S">
          <Btn onClick={guardar} disabled={saving} variant={saved ? 'green' : 'primary'}>
            <Save size={14} /> {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </Btn>
        </Topbar>

        {/* WhatsApp */}
        <SECCION icon={Phone} title="WhatsApp — Notificaciones">
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
            Cuando se asigna un hallazgo, el sistema genera un link de WhatsApp con el mensaje pre-armado. Configurá los datos para que el mensaje sea claro.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Número por defecto (para pruebas)"
              placeholder="5491112345678"
              value={config.wappDefault || ''}
              onChange={e => set('wappDefault', e.target.value)}
            />
            <Input
              label="Nombre de la empresa en el mensaje"
              placeholder="NovaDomus"
              value={config.empresaNombre || ''}
              onChange={e => set('empresaNombre', e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>Vista previa del mensaje</label>
            <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#166534', lineHeight: 1.7, fontFamily: 'monospace' }}>
              *NDTracker 5S — Nuevo hallazgo*<br/>
              Proyecto: San Juan 3886<br/>
              Sector: P07 · Escalera<br/>
              Descripción: Materiales sin ordenar bloqueando salida<br/>
              Responsable: [nombre del responsable]<br/>
              Fecha límite: 10/06/2026<br/>
              Cargado por: Juan Pérez
            </div>
          </div>
          {config.wappDefault && (
            <a
              href={`https://wa.me/${config.wappDefault.replace(/\D/g,'')}?text=${encodeURIComponent('*NDTracker 5S — Prueba de notificación*\nEste es un mensaje de prueba desde la configuración.')}`}
              target="_blank" rel="noopener noreferrer"
            >
              <Btn variant="green"><Phone size={14} /> Probar con mi número</Btn>
            </a>
          )}
        </SECCION>

        {/* Niveles del proyecto activo */}
        {proyectoActivo && (
          <SECCION icon={Layers} title={`Niveles — ${proyectoActivo.nombre}`}>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
              Estos son los niveles y sectores que aparecen al cargar un hallazgo. Uno por línea.
            </p>
            <textarea
              rows={10}
              value={nivelesEdit}
              onChange={e => setNivelesEdit(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
              {nivelesEdit.split('\n').filter(x => x.trim()).length} niveles configurados
            </p>
          </SECCION>
        )}

        {/* Ajustes generales */}
        <SECCION icon={Settings} title="Ajustes generales">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Días para alerta de vencimiento"
              value={config.diasAlerta || '3'}
              onChange={e => set('diasAlerta', e.target.value)}
            >
              <option value="1">1 día antes</option>
              <option value="2">2 días antes</option>
              <option value="3">3 días antes</option>
              <option value="5">5 días antes</option>
              <option value="7">7 días antes</option>
            </Select>
            <Select
              label="Foto de hallazgo"
              value={config.fotoRequerida || 'opcional'}
              onChange={e => set('fotoRequerida', e.target.value)}
            >
              <option value="opcional">Opcional</option>
              <option value="requerida">Requerida</option>
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Zona específica en hallazgo"
              value={config.zonaVisible || 'si'}
              onChange={e => set('zonaVisible', e.target.value)}
            >
              <option value="si">Visible</option>
              <option value="no">Oculta</option>
            </Select>
            <Select
              label="Mostrar observación al cargar"
              value={config.obsVisible || 'si'}
              onChange={e => set('obsVisible', e.target.value)}
            >
              <option value="si">Visible</option>
              <option value="no">Oculta</option>
            </Select>
          </div>
        </SECCION>

        {/* Info de la app */}
        <SECCION icon={Shield} title="Información del sistema">
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            {[
              ['Versión',        'NDTracker5S V1.5'],
              ['Base de datos',  'Firebase Firestore — ndtracker-14d4c'],
              ['Hosting',        'Vercel — ndtracker5s.vercel.app'],
              ['Desarrollado por', 'NovaDomus · Oficina Técnica'],
              ['Proyecto activo', proyectoActivo?.nombre || 'Sin proyecto'],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: '0.5px solid var(--nd-border)' }}>
                <td style={{ padding: '8px 0', color: '#888', width: 160, fontSize: 12, fontWeight: 600 }}>{k}</td>
                <td style={{ padding: '8px 0', fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </table>
        </SECCION>

        {/* Datos de demo — solo admin */}
        {esAdmin && (
          <SECCION icon={Database} title="Datos de demo">
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
              Cargá 10 hallazgos y 5 innecesarios de ejemplo para ver los gráficos y mostrar el funcionamiento. También podés borrar todos los registros si necesitás limpiar.
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: seedLog.length ? 16 : 0, flexWrap: 'wrap' }}>
              <Btn onClick={runSeed} disabled={seeding || borrando}>
                <Database size={14} /> {seeding ? 'Cargando...' : seedDone ? '✓ Cargado' : 'Cargar datos de demo'}
              </Btn>
              {!confirmBorrar
                ? <Btn variant="secondary" style={{ color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => setConfirmBorrar(true)} disabled={seeding || borrando}>
                    <Trash2 size={14} /> Borrar todo
                  </Btn>
                : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#b91c1c' }}>¿Borrar todos los hallazgos e innecesarios?</span>
                    <Btn variant="secondary" style={{ height: 28, fontSize: 12 }} onClick={() => setConfirmBorrar(false)}>Cancelar</Btn>
                    <Btn style={{ height: 28, fontSize: 12, background: '#dc2626', color: '#fff', border: 'none' }} onClick={borrarTodo} disabled={borrando}>
                      {borrando ? 'Borrando...' : 'Confirmar'}
                    </Btn>
                  </div>
              }
            </div>
            {seedLog.length > 0 && (
              <div style={{ background: '#f8f9fa', border: '0.5px solid var(--nd-border)', borderRadius: 8, padding: '12px 14px', maxHeight: 200, overflowY: 'auto' }}>
                {seedLog.map((l, i) => (
                  <div key={i} style={{ fontSize: 12, fontFamily: 'monospace', color: l.startsWith('❌') ? '#dc2626' : l.startsWith('✅') ? '#16a34a' : '#555', lineHeight: 1.8 }}>{l || '\u00A0'}</div>
                ))}
              </div>
            )}
          </SECCION>
        )}

      </PageWrap>
    </Layout>
  )
}

// ── Panel de permisos exportado para uso futuro
export const PERMISOS_DEFAULT = {
  admin:     { tablero: true,  estadisticas: true,  directorio: true,  innecesarios: true,  exportar: true,  config: true  },
  direccion: { tablero: true,  estadisticas: true,  directorio: true,  innecesarios: true,  exportar: true,  config: false },
  lider:     { tablero: true,  estadisticas: true,  directorio: true,  innecesarios: true,  exportar: false, config: false },
  operario:  { tablero: false, estadisticas: false,  directorio: false, innecesarios: true,  exportar: false, config: false }
}
