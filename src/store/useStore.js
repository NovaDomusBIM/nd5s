import { create } from 'zustand'
import { PROYECTOS_SEED, USUARIOS_SEED } from '../data/mock'
import {
  loginFirebase, logoutFirebase, onAuthChange,
  getCol, listenCol, addItem, setItem, updateItem, deleteItem, seedIfEmpty
} from '../services/firebase'

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

// ── Resolver usuario: busca por UID primero, luego por email, luego fallback ──
// Esta triple búsqueda garantiza que NUNCA va a quedar como operario si existe en Firestore
const resolverUsuario = async (firebaseUser) => {
  let usuarios = await getCol('usuarios')
  if (!usuarios.length) {
    await seedIfEmpty(PROYECTOS_SEED, USUARIOS_SEED)
    usuarios = await getCol('usuarios')
  }

  // 1° — buscar por uid (más confiable, no depende de email)
  let encontrado = usuarios.find(x => x.uid === firebaseUser.uid)

  // 2° — buscar por email (case-insensitive, sin espacios)
  if (!encontrado) {
    const emailNorm = firebaseUser.email?.toLowerCase().trim()
    encontrado = usuarios.find(x => x.email?.toLowerCase().trim() === emailNorm)
  }

  if (encontrado) {
    // Guardar uid en el documento si no estaba, para que el próximo login use el 1° camino
    if (!encontrado.uid) {
      try { await updateItem('usuarios', encontrado.id, { uid: firebaseUser.uid }) } catch {}
    }
    return { usuario: { ...encontrado, uid: firebaseUser.uid }, usuarios }
  }

  // 3° — fallback: no existe en nd5s_usuarios, entra como operario
  console.warn('Usuario no encontrado en nd5s_usuarios:', firebaseUser.email)
  return {
    usuario: {
      id:        firebaseUser.uid,
      uid:       firebaseUser.uid,
      nombre:    firebaseUser.email?.split('@')[0] || 'Usuario',
      iniciales: (firebaseUser.email || 'AN').slice(0, 2).toUpperCase(),
      email:     firebaseUser.email || '',
      rol:       'operario',
      color:     '#b86a00',
      anonimo:   false
    },
    usuarios
  }
}

export const useStore = create((set, get) => ({
  usuarioActual:  null,
  cargando:       true,
  proyectos:      [],
  proyectoActivo: null,
  usuarios:       [],
  hallazgos:      [],
  innecesarios:   [],
  _unsubs:        [],
  deviceId:       getDeviceId(),

  initAuth: () => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        set({ cargando: true }) // bloquear UI hasta tener rol real
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

  // login solo hace signIn — initAuth resuelve el rol via onAuthStateChanged
  login: async (email, pass) => {
    await loginFirebase(email, pass)
  },

  logout: async () => {
    get()._unsubs.forEach(u => typeof u === 'function' && u())
    set({ _unsubs: [] })
    await logoutFirebase()
    set({ usuarioActual: null, proyectos: [], hallazgos: [], innecesarios: [], proyectoActivo: null })
  },

  _iniciarListeners: (proyectoActivo) => {
    if (!proyectoActivo) return
    const u1 = listenCol('hallazgos',    h => set({ hallazgos: h }))
    const u2 = listenCol('innecesarios', i => set({ innecesarios: i }))
    set(s => ({ _unsubs: [...s._unsubs, u1, u2] }))
  },

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
      estado: 'cerrado', resolucion,
      fotoResolucion: fotoUrl || null,
      cerradoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    })
  },

  eliminarHallazgo: async (id) => { await deleteItem('hallazgos', id) },

  agregarInnecesario: async (data) => {
    const { proyectoActivo, usuarioActual, deviceId } = get()
    const item = {
      ...data,
      proyectoId:    proyectoActivo?.id || '',
      creadoPor:     usuarioActual?.nombre || data.nombreCargador || 'Anónimo',
      creadoPorId:   usuarioActual?.id || null,
      deviceId, estado: 'pendiente',
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    }
    const ref = await addItem('innecesarios', item)
    return ref.id
  },

  actualizarInnecesario: async (id, data) => {
    await updateItem('innecesarios', id, { ...data, actualizadoEn: new Date().toISOString() })
  }
}))
