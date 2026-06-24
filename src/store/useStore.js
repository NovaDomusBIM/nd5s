import { create } from 'zustand'
import { PROYECTOS_SEED, USUARIOS_SEED } from '../data/mock'
import {
  loginFirebase, logoutFirebase, onAuthChange, loginAnonimo,
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

export const useStore = create((set, get) => ({
  usuarioActual:  null,
  cargando:       true,
  rolResuelto:    false,
  proyectos:      [],
  proyectoActivo: null,
  usuarios:       [],
  hallazgos:      [],
  innecesarios:   [],
  directorio:     [],
  _unsubs:        [],
  deviceId:       getDeviceId(),

  initAuth: () => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // PASO 1: setear inmediatamente para que la UI no quede bloqueada
        const basicUser = {
          id:        firebaseUser.uid,
          uid:       firebaseUser.uid,
          nombre:    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          iniciales: (firebaseUser.email || 'AN').slice(0, 2).toUpperCase(),
          email:     firebaseUser.email || '',
          rol:       'operario',
          color:     '#425563',
          anonimo:   firebaseUser.isAnonymous
        }
        set({ usuarioActual: basicUser, cargando: false })

        // PASO 2: cargar el rol real de Firestore en segundo plano
        if (!firebaseUser.isAnonymous) {
          try {
            let usuarios = await getCol('usuarios')
            if (!usuarios.length) {
              await seedIfEmpty(PROYECTOS_SEED, USUARIOS_SEED)
              usuarios = await getCol('usuarios')
            }
            // Buscar por uid primero, luego por email
            let encontrado = usuarios.find(x => x.uid === firebaseUser.uid)
            if (!encontrado) {
              const emailNorm = firebaseUser.email?.toLowerCase().trim()
              encontrado = usuarios.find(x => x.email?.toLowerCase().trim() === emailNorm)
            }
            if (encontrado) {
              // Guardar uid para próximos logins
              if (!encontrado.uid) {
                updateItem('usuarios', encontrado.id, { uid: firebaseUser.uid }).catch(() => {})
              }
              // Actualizar con rol real — esto dispara re-render con el rol correcto
              set({ usuarioActual: { ...encontrado, uid: firebaseUser.uid }, usuarios, rolResuelto: true })
            }
            if (!encontrado) set({ rolResuelto: true })  // fallback operario confirmado
          // Cargar proyectos
            const proyectos = await getCol('proyectos')
            const proyectoActivo = proyectos.find(p => p.estado === 'activo') || proyectos[0] || null
            set({ proyectos, proyectoActivo })
            get()._iniciarListeners(proyectoActivo)
          } catch (e) {
            console.error('initAuth Firestore error:', e)
          }
        }
      } else {
        get()._unsubs.forEach(u => typeof u === 'function' && u())
        // Cargar proyectos igual para que /cargar funcione sin login
        try {
          const proyectos = await getCol('proyectos')
          const proyectoActivo = proyectos.find(p => p.estado === 'activo') || proyectos[0] || null
          set({ usuarioActual: null, cargando: false, rolResuelto: false, hallazgos: [], innecesarios: [], _unsubs: [], proyectos, proyectoActivo })
        } catch {
          set({ usuarioActual: null, cargando: false, rolResuelto: false, hallazgos: [], innecesarios: [], _unsubs: [] })
        }
      }
    })
    set(s => ({ _unsubs: [...s._unsubs, unsub] }))
  },

  login: async (email, pass) => {
    const cred = await loginFirebase(email, pass)
    // Buscar el rol REAL en Firestore antes de setear — así nunca aparece como operario
    let usuarios = await getCol('usuarios')
    if (!usuarios.length) {
      await seedIfEmpty(PROYECTOS_SEED, USUARIOS_SEED)
      usuarios = await getCol('usuarios')
    }
    const emailNorm = email.toLowerCase().trim()
    const encontrado = usuarios.find(x => x.uid === cred.user.uid) ||
                       usuarios.find(x => x.email?.toLowerCase().trim() === emailNorm)
    const usuario = encontrado || {
      id:        cred.user.uid,
      uid:       cred.user.uid,
      nombre:    email.split('@')[0],
      iniciales: email.slice(0, 2).toUpperCase(),
      email:     email,
      rol:       'operario',
      color:     '#425563',
      anonimo:   false
    }
    // Guardar uid si no estaba
    if (encontrado && !encontrado.uid) {
      updateItem('usuarios', encontrado.id, { uid: cred.user.uid }).catch(() => {})
    }
    const proyectos = await getCol('proyectos')
    const proyectoActivo = proyectos.find(p => p.estado === 'activo') || proyectos[0] || null
    set({ usuarioActual: { ...usuario, uid: cred.user.uid }, usuarios, proyectos, proyectoActivo, cargando: false })
    get()._iniciarListeners(proyectoActivo)
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
    const u3 = listenCol('directorio',   d => set({ directorio: d }))
    set(s => ({ _unsubs: [...s._unsubs, u1, u2, u3] }))
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
      uidAnon:        usuarioActual?.anonimo ? (usuarioActual?.uid || null) : null,
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
      uidAnon:       usuarioActual?.anonimo ? (usuarioActual?.uid || null) : null,
      deviceId, estado: 'pendiente',
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    }
    const ref = await addItem('innecesarios', item)
    return ref.id
  },

  actualizarInnecesario: async (id, data) => {
    await updateItem('innecesarios', id, { ...data, actualizadoEn: new Date().toISOString() })
  },

  // Login anónimo para /cargar: solo si no hay ninguna sesión activa.
  // Da un uid de Firebase estable por dispositivo, necesario para subir a Storage.
  asegurarAnonimo: async () => {
    const { usuarioActual } = get()
    if (usuarioActual) return            // ya hay sesión (con cuenta o anónima)
    try { await loginAnonimo() } catch (e) { console.error('login anónimo:', e) }
  }
}))
