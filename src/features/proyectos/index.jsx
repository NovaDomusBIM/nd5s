import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Building2, Layers } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Layout, PageWrap, Topbar, Card, CardTitle, Btn, Input, Textarea, Select, Modal, EmptyState, Badge } from '../../components'
import { fmtFecha } from '../../utils'

const NIVELES_DEFAULT = [
  'Sótano','Planta Baja','Entrepiso','P01','P02','P03','P04','P05',
  'P06','P07','P08','P09','P10','P11','P12','Azotea','Obrador','General obra'
]

export function Proyectos() {
  const { proyectos, agregarProyecto, actualizarProyecto, setProyectoActivo, proyectoActivo } = useStore()
  const [modal, setModal]     = useState(null) // null | 'nuevo' | proyecto
  const [form, setForm]       = useState({})
  const [nivelesTxt, setNivelesTxt] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const abrirNuevo = () => {
    setForm({ codigo: '', nombre: '', direccion: '', estado: 'activo' })
    setNivelesTxt(NIVELES_DEFAULT.join('\n'))
    setModal('nuevo')
    setError('')
  }

  const abrirEditar = (p) => {
    setForm({ ...p })
    setNivelesTxt((p.niveles || NIVELES_DEFAULT).join('\n'))
    setModal(p)
    setError('')
  }

  const guardar = async () => {
    if (!form.codigo || !form.nombre) { setError('Código y nombre son obligatorios'); return }
    setSaving(true)
    try {
      const niveles = nivelesTxt.split('\n').map(x => x.trim()).filter(Boolean)
      if (modal === 'nuevo') {
        await agregarProyecto({ ...form, niveles })
      } else {
        await actualizarProyecto(modal.id, { ...form, niveles })
      }
      setModal(null)
    } catch (e) {
      setError('Error al guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <PageWrap>
        <Topbar title="Proyectos" subtitle="Gestión de obras">
          <Btn onClick={abrirNuevo}><Plus size={14} /> Nuevo proyecto</Btn>
        </Topbar>

        {proyectos.length === 0 ? (
          <EmptyState icon={Building2} title="Sin proyectos" sub="Creá el primer proyecto para empezar" action={<Btn onClick={abrirNuevo}>+ Crear proyecto</Btn>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {proyectos.map(p => (
              <Card key={p.id} style={{ cursor: 'pointer', border: proyectoActivo?.id === p.id ? '1.5px solid var(--nd-mid)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-title)', fontSize: 11, fontWeight: 700, color: 'var(--nd-mid)' }}>#{p.codigo}</span>
                      <Badge color={p.estado === 'activo' ? 'green' : 'soft'}>{p.estado}</Badge>
                      {proyectoActivo?.id === p.id && <Badge color="mid">Activo</Badge>}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 15, fontWeight: 700 }}>{p.nombre}</h3>
                    {p.direccion && <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{p.direccion}</p>}
                  </div>
                  <button onClick={() => abrirEditar(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                    <Edit2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Layers size={12} color="#aaa" />
                  <span style={{ fontSize: 12, color: '#aaa' }}>{(p.niveles || []).length} niveles configurados</span>
                </div>

                {proyectoActivo?.id !== p.id && (
                  <Btn variant="secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setProyectoActivo(p)}>
                    Activar este proyecto
                  </Btn>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Modal nuevo/editar */}
        {modal && (
          <Modal title={modal === 'nuevo' ? 'Nuevo proyecto' : 'Editar proyecto'} onClose={() => setModal(null)} width={520}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <Input label="Código" required placeholder="10" value={form.codigo || ''} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
              <Input label="Nombre" required placeholder="San Juan 3886" value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <Input label="Dirección" placeholder="San Juan 3886, CABA" value={form.direccion || ''} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
            <Select label="Estado" value={form.estado || 'activo'} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              <option value="activo">Activo</option>
              <option value="finalizado">Finalizado</option>
              <option value="pausado">Pausado</option>
            </Select>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                Niveles / sectores <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>(uno por línea)</span>
              </label>
              <textarea
                rows={8}
                value={nivelesTxt}
                onChange={e => setNivelesTxt(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--nd-border2)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }}
                placeholder={'Sótano\nPlanta Baja\nP01\nP02\n...'}
              />
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
                {nivelesTxt.split('\n').filter(x => x.trim()).length} niveles · Podés agregar, editar o reordenar
              </p>
            </div>

            {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
            </div>
          </Modal>
        )}
      </PageWrap>
    </Layout>
  )
}
