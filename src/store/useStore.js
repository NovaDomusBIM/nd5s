import { create } from 'zustand'
import { PROYECTOS_SEED, USUARIOS_SEED } from '../data/mock'
import {
  loginFirebase, logoutFirebase, onAuthChange,
  getCol, listenCol, addItem, setItem, updateItem, deleteItem, seedIfEmpty
} from '../services/firebase'

// ── Device ID para trazabilidad anónima ────────────────────────────────────
const getDeviceId = () => {
  let id = localStorage.getItem('nd5s_device_id')
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36)
    localStorage.setItem('nd5s_device_id', id)
  }
  return id
}

// ── Nombre guardado en dispositivo (operarios) ─────────────────────────────
export const getNombreGuardado = () => localStorage.getItem('nd5s_nombre') || ''
export const setNombreGuardado = (n) => localStorage.setItem('nd5s_nombre', n)

export const useStore = create((set, get) => ({
  // ── Estado ─────────────────────────────────────────────────────────────────
  usuarioActual: null,
  cargando:      true,
  proyectos:     [],
  proyectoActivo: null,  // proyecto seleccionado
  usuarios:      [],
  hallazgos:     [],
  innecesarios:  [],
  _unsubs:       [],
  deviceId:      getDeviceId(),

  // ── Auth ───────────────────────────────────────────────────────────────────
  initAuth: () => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const basicUser = {
          id:        firebaseUser.uid,
          nombre:    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          iniciales: (firebaseUser.email || 'AN').slice(0, 2).toUpperCase(),
          email:     firebaseUser.email || '',
          rol:       'operario',
          color:     '#425563',
          anonimo:   firebaseUser.isAnonymous
        }
        set({ usuarioActual: basicUser, cargando: false })
        get().initListeners()

        if (!firebaseUser.isAnonymous) {
          try {
            let usuarios = await getCol('usuarios')
            if (!usuarios.length) {
              await seedIfEmpty(PROYECTOS_SEED, USUARIOS_SEED)
              usuarios = await getCol('usuarios')
            }
            const u = usuarios.find(x => x.email === firebaseUser.email) || basicUser
            const proyectos = await getCol('proyectos')
            const proyectoActivo = proyectos.find(p => p.estado === 'activo') || proyectos[0] || null
            set({ usuarioActual: u, usuarios, proyectos, proyectoActivo })
          } catch (e) {
            console.error('Error Firestore:', e)
          }
        }
      } else {
        get()._unsubs.forEach(u => u())
        set({ usuarioActual: null, cargando: false, hallazgos: [], innecesarios: [] })
      }
    })
    set(s => ({ _unsubs: [...s._unsubs, unsub] }))
  },

  login: async (email, pass) => {
    const cred = await loginFirebase(email, pass)
    const basicUser = {
      id:        cred.user.uid,
      nombre:    cred.user.displayName || email.split('@')[0],
      iniciales: email.slice(0, 2).toUpperCase(),
      email,
      rol:       'operario',
      color:     '#425563',
      anonimo:   false
    }
    set({ usuarioActual: basicUser, cargando: false })
    get().initListeners()
  },

  logout: async () => {
    get()._unsubs.forEach(u => u())
    set({ _unsubs: [] })
    await logoutFirebase()
    set({ usuarioActual: null, proyectos: [], hallazgos: [], innecesarios: [] })
  },

  // ── Listeners en tiempo real ───────────────────────────────────────────────
  initListeners: async () => {
    let { proyectoActivo, proyectos } = get()
    if (!proyectos.length) {
      try {
        proyectos = await getCol("proyectos")
        proyectoActivo = proyectos.find(p => p.estado === "activo") || proyectos[0] || null
        set({ proyectos, proyectoActivo })
      } catch {}
    }
    if (!proyectoActivo) return
    const u1 = listenCol("hallazgos",    h => set({ hallazgos: h }))
    const u2 = listenCol("innecesarios", i => set({ innecesarios: i }))
    set(s => ({ _unsubs: [...s._unsubs, u1, u2] }))
  },

  setProyectoActivo: (proyecto) => {
    // Cancelar listeners anteriores excepto el de auth
    get()._unsubs.forEach(u => typeof u === 'function' && u())
    set({ proyectoActivo: proyecto, hallazgos: [], innecesarios: [], _unsubs: [] })
    get().initListeners()
  },

  // ── Proyectos ──────────────────────────────────────────────────────────────
  cargarProyectos: async () => {
    const proyectos = await getCol('proyectos')
    const activo = proyectos.find(p => p.estado === 'activo') || proyectos[0] || null
    set({ proyectos, proyectoActivo: activo })
    return proyectos
  },

  agregarProyecto: async (data) => {
    const id = 'p' + data.codigo
    await setItem('proyectos', id, { ...data, id, creadoEn: new Date().toISOString() })
    await get().cargarProyectos()
  },

  actualizarProyecto: async (id, data) => {
    await updateItem('proyectos', id, data)
    await get().cargarProyectos()
  },

  // ── Usuarios ───────────────────────────────────────────────────────────────
  cargarUsuarios: async () => {
    const usuarios = await getCol('usuarios')
    set({ usuarios })
    return usuarios
  },

  agregarUsuario: async (data) => {
    const ref = await addItem('usuarios', { ...data, creadoEn: new Date().toISOString() })
    await get().cargarUsuarios()
    return ref.id
  },

  actualizarUsuario: async (id, data) => {
    await updateItem('usuarios', id, data)
    await get().cargarUsuarios()
  },

  eliminarUsuario: async (id) => {
    await deleteItem('usuarios', id)
    await get().cargarUsuarios()
  },

  // ── Hallazgos ──────────────────────────────────────────────────────────────
  agregarHallazgo: async (data) => {
    const { proyectoActivo, usuarioActual, deviceId } = get()
    const hallazgo = {
      ...data,
      proyectoId:    proyectoActivo?.id || '',
      proyectoCodigo:proyectoActivo?.codigo || '',
      creadoPor:     usuarioActual?.nombre || data.nombreCargador || 'Anónimo',
      creadoPorId:   usuarioActual?.id || null,
      deviceId,
      estado:        'abierto',
      creadoEn:      new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    }
    const ref = await addItem('hallazgos', hallazgo)
    return ref.id
  },

  actualizarHallazgo: async (id, data) => {
    await updateItem('hallazgos', id, { ...data, actualizadoEn: new Date().toISOString() })
  },

  cerrarHallazgo: async (id, resolucion, fotoUrl) => {
    await updateItem('hallazgos', id, {
      estado:         'cerrado',
      resolucion,
      fotoResolucion: fotoUrl || null,
      cerradoEn:      new Date().toISOString(),
      actualizadoEn:  new Date().toISOString()
    })
  },

  eliminarHallazgo: async (id) => {
    await deleteItem('hallazgos', id)
  },

  // ── Innecesarios ───────────────────────────────────────────────────────────
  agregarInnecesario: async (data) => {
    const { proyectoActivo, usuarioActual, deviceId } = get()
    const item = {
      ...data,
      proyectoId:    proyectoActivo?.id || '',
      creadoPor:     usuarioActual?.nombre || data.nombreCargador || 'Anónimo',
      creadoPorId:   usuarioActual?.id || null,
      deviceId,
      estado:        'pendiente',
      creadoEn:      new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    }
    const ref = await addItem('innecesarios', item)
    return ref.id
  },

  actualizarInnecesario: async (id, data) => {
    await updateItem('innecesarios', id, { ...data, actualizadoEn: new Date().toISOString() })
  }
}))
