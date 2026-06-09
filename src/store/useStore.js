import { create } from 'zustand'
import { PROYECTOS_SEED, USUARIOS_SEED } from '../data/mock'
import {
  loginFirebase, logoutFirebase, onAuthChange,
  getCol, listenCol, addItem, setItem, updateItem, deleteItem, seedIfEmpty
} from '../services/firebase'

// ── Device ID ─────────────────────────────────────────────────────────────────
const getDeviceId = () => {
  let id = localStorage.getItem('nd5s_device_id')
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36)
    localStorage.setItem('nd5s_device_id', id)
  }
  return id
}

export const getNombreGuardado = () => localStorage.getItem('nd5s_nombre') || ''
export const setNombreGuardado = (n) => localStorage.setItem('nd5s_nombre', n)

// ── Buscar usuario en Firestore por email ─────────────────────────────────────
// Esta es la función central que resuelve el bug de roles.
// SIEMPRE busca en nd5s_usuarios antes de setear el estado.
const resolverUsuario = async (firebaseUser) => {
  let usuarios = await getCol('usuarios')
  if (!usuarios.length) {
    await seedIfEmpty(PROYECTOS_SEED, USUARIOS_SEED)
    usuarios = await getCol('usuarios')
  }
  const encontrado = usuarios.find(x =>
    x.email?.toLowerCase().trim() === firebaseUser.email?.toLowerCase().trim()
  )
  if (encontrado) return { usuario: encontrado, usuarios }

  // No encontrado en Firestore — fallback como operario
  const fallback = {
    id:        firebaseUser.uid,
    nombre:    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
    iniciales: (firebaseUser.email || 'AN').slice(0, 2).toUpperCase(),
    email:     firebaseUser.email || '',
    rol:       'operario',
    color:     '#b86a00',
    anonimo:   false
  }
  return { usuario: fallback, usuarios }
}

export const useStore = create((set, get) => ({
  // ── Estado ─────────────────────────────────────────────────────────────────
  usuarioActual:  null,
  cargando:       true,
  proyectos:      [],
  proyectoActivo: null,
  usuarios:       [],
  hallazgos:      [],
  innecesarios:   [],
  _unsubs:        [],
  deviceId:       getDeviceId(),

  // ── initAuth — se ejecuta UNA vez al arrancar la app ──────────────────────
  initAuth: () => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.isAnonymous) {
          try {
            const { usuario, usuarios } = await resolverUsuario(firebaseUser)
            const proyectos = await getCol('proyectos')
            const proyectoActivo = proyectos.find(p => p.estado === 'activo') || proyectos[0] || null
            set({ usuarioActual: usuario, usuarios, proyectos, proyectoActivo, cargando: false })
            get()._iniciarListeners(proyectoActivo)
          } catch (e) {
            console.error('initAuth error:', e)
            set({ cargando: false })
          }
        } else {
          set({
            usuarioActual: {
              id: firebaseUser.uid, nombre: 'Anónimo',
              iniciales: 'AN', email: '', rol: 'operario',
              color: '#b86a00', anonimo: true
            },
            cargando: false
          })
        }
      } else {
        get()._unsubs.forEach(u => typeof u === 'function' && u())
        set({ usuarioActual: null, cargando: false, hallazgos: [], innecesarios: [], _unsubs: [] })
      }
    })
    set(s => ({ _unsubs: [...s._unsubs, unsub] }))
  },

  // ── login — busca el rol en Firestore antes de setear estado ──────────────
  login: async (email, pass) => {
    // NO seteamos estado aquí todavía — esperamos a initAuth que dispara automáticamente
    // Simplemente hacemos el login en Firebase Auth
    await loginFirebase(email, pass)
    // initAuth se dispara solo via onAuthStateChanged
  },

  logout: async () => {
    get()._unsubs.forEach(u => typeof u === 'function' && u())
    set({ _unsubs: [] })
    await logoutFirebase()
    set({ usuarioActual: null, proyectos: [], hallazgos: [], innecesarios: [], proyectoActivo: null })
  },

  // ── Listeners internos ────────────────────────────────────────────────────
  _iniciarListeners: (proyectoActivo) => {
    if (!proyectoActivo) return
    const u1 = listenCol('hallazgos',    h => set({ hallazgos: h }))
    const u2 = listenCol('innecesarios', i => set({ innecesarios: i }))
    set(s => ({ _unsubs: [...s._unsubs, u1, u2] }))
  },

  // ── initListeners público (para cuando cambia el proyecto) ────────────────
  initListeners: async () => {
    let { proyectoActivo, proyectos } = get()
    if (!proyectos.length) {
      try {
        proyectos = await getCol('proyectos')
        proyectoActivo = proyectos.find(p => p.estado === 'activo') || proyectos[0] || null
        set({ proyectos, proyectoActivo })
      } catch {}
    }
    if (!proyectoActivo) return
    get()._iniciarListeners(proyectoActivo)
  },

  setProyectoActivo: (proyecto) => {
    get()._unsubs.forEach(u => typeof u === 'function' && u())
    set({ proyectoActivo: proyecto, hallazgos: [], innecesarios: [], _unsubs: [] })
    get()._iniciarListeners(proyecto)
  },

  // ── Proyectos ─────────────────────────────────────────────────────────────
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

  // ── Usuarios ──────────────────────────────────────────────────────────────
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

  // ── Hallazgos ─────────────────────────────────────────────────────────────
  agregarHallazgo: async (data) => {
    const { proyectoActivo, usuarioActual, deviceId } = get()
    const hallazgo = {
      ...data,
      proyectoId:     proyectoActivo?.id || '',
      proyectoCodigo: proyectoActivo?.codigo || '',
      creadoPor:      usuarioActual?.nombre || data.nombreCargador || 'Anónimo',
      creadoPorId:    usuarioActual?.id || null,
      deviceId,
      estado:         'abierto',
      creadoEn:       new Date().toISOString(),
      actualizadoEn:  new Date().toISOString()
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

  // ── Innecesarios ──────────────────────────────────────────────────────────
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
