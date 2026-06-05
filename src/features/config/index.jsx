import React, { useState, useEffect } from 'react'
import { Settings, Phone, Layers, Bell, Shield, Save } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getItem, setItem, updateItem } from '../../services/firebase'
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
  const { proyectoActivo, actualizarProyecto } = useStore()
  const [config, setConfig]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [nivelesEdit, setNivelesEdit] = useState('')

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

      </PageWrap>
    </Layout>
  )
}
