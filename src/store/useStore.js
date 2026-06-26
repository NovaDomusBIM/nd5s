import { create } from 'zustand'
import { PROYECTOS_SEED, USUARIOS_SEED } from '../data/mock'
import {
  loginFirebase, logoutFirebase, onAuthChange, loginAnonimo,
  getCol, getColWhere, listenCol, addItem, setItem, updateItem, deleteItem, seedIfEmpty
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

// ── Identidad de operario bloqueada por dispositivo ──────────────────────────
// IDENTIDAD_VERSION: subir este número fuerza a TODOS los dispositivos a re-elegir
// su nombre en la próxima carga (limpia la identidad vieja de localStorage).
const IDENTIDAD_VERSION = '3'
const migrarIdentidad = () => {
  if (localStorage.getItem('nd5s_id_version') !== IDENTIDAD_VERSION) {
    localStorage.removeItem('nd5s_nombre')
    localStorage.removeItem('nd5s_personal_id')
    localStorage.setItem('nd5s_id_version', IDENTIDAD_VERSION)
  }
}
migrarIdentidad()

export const getIdentidadLocal = () => ({
  personalId: localStorage.getItem('nd5s_personal_id') || '',
  nombre:     localStorage.getItem('nd5s_nombre') || '',
})
export const setIdentidadLocal = (personalId, nombre) => {
  localStorage.setItem('nd5s_personal_id', personalId)
  localStorage.setItem('nd5s_nombre', nombre)
}
export const limpiarIdentidadLocal = () => {
  localStorage.removeItem('nd5s_personal_id')
  localStorage.removeItem('nd5s_nombre')
}

export const useStore = create((set, get) => ({
  usuarioActual:  null,
  cargando:       true,
  rolResuelto:    false,
  proyectos:      [],
  proyectoActivo: null,
  usuarios:       [],
  hallazgos:      [],
  innecesarios:   [],
  hallazgosDescartados:    [],
  innecesariosDescartados: [],
  directorio:     [],
  personal:       [],
  dispositivos:   [],
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
    const u1 = listenCol('hallazgos', list => set({
      hallazgos:            list.filter(h => !h.descartado),
      hallazgosDescartados: list.filter(h =>  h.descartado)
    }))
    const u2 = listenCol('innecesarios', list => set({
      innecesarios:            list.filter(i => !i.descartado),
      innecesariosDescartados: list.filter(i =>  i.descartado)
    }))
    const u3 = listenCol('directorio',   d => set({ directorio: d }))
    const u4 = listenCol('personal',     p => set({ personal: p }))
    const u5 = listenCol('dispositivos', d => set({ dispositivos: d }))
    set(s => ({ _unsubs: [...s._unsubs, u1, u2, u3, u4, u5] }))
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

  // Carga inmediata de personal + dispositivos para /cargar (one-shot, no espera al listener)
  cargarPersonalDirecto: async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms))
    for (let intento = 1; intento <= 3; intento++) {
      try {
        let { proyectoActivo, proyectos } = get()
        if (!proyectoActivo) {
          proyectos = proyectos.length ? proyectos : await getCol('proyectos')
          proyectoActivo = proyectos.find(p => p.estado === 'activo') || proyectos[0] || null
          if (proyectoActivo) set({ proyectos, proyectoActivo })
        }
        const [personal, dispositivos] = await Promise.all([
          getCol('personal'), getCol('dispositivos')
        ])
        set({ personal, dispositivos })
        // Si trajo personal, listo. Si vino vacío en un intento temprano, reintenta.
        if (personal.length || intento === 3) return
      } catch (e) {
        console.error(`cargar personal directo (intento ${intento}):`, e)
        if (intento === 3) return
      }
      await sleep(800 * intento)
    }
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
      creadoPor:      data.nombreCargador || usuarioActual?.nombre || 'Anónimo',
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

  eliminarHallazgo: async (id, motivo = 'error') => {
    const { usuarioActual } = get()
    await updateItem('hallazgos', id, {
      descartado: true, motivoDescarte: motivo,
      descartadoPor: usuarioActual?.nombre || 'Admin',
      descartadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    })
  },

  agregarInnecesario: async (data) => {
    const { proyectoActivo, usuarioActual, deviceId } = get()
    const item = {
      ...data,
      proyectoId:    proyectoActivo?.id || '',
      creadoPor:     data.nombreCargador || usuarioActual?.nombre || 'Anónimo',
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

  eliminarInnecesario: async (id, motivo = 'error') => {
    const { usuarioActual } = get()
    await updateItem('innecesarios', id, {
      descartado: true, motivoDescarte: motivo,
      descartadoPor: usuarioActual?.nombre || 'Admin',
      descartadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    })
  },

  // ── Personal de obra ───────────────────────────────────────────────────────
  agregarPersonal: async (nombre, apellido) => {
    const { proyectoActivo } = get()
    await addItem('personal', {
      nombre: nombre.trim(), apellido: apellido.trim(),
      proyectoId: proyectoActivo?.id || '', activo: true,
      creadoEn: new Date().toISOString()
    })
  },
  actualizarPersonal: async (id, data) => { await updateItem('personal', id, data) },
  eliminarPersonal: async (id) => { await deleteItem('personal', id) },

  // ── Dispositivos (vínculo uid → persona) ───────────────────────────────────
  // Registra/actualiza el vínculo cuando un operario elige su nombre por 1ª vez.
  registrarDispositivo: async (uid, persona) => {
    if (!uid || !persona?.id) throw new Error('Datos incompletos para registrar')
    let { proyectoActivo, proyectos } = get()
    if (!proyectoActivo) {
      proyectos = proyectos.length ? proyectos : await getCol('proyectos')
      proyectoActivo = proyectos.find(p => p.estado === 'activo') || proyectos[0] || null
    }
    const nombreCompleto = `${persona.nombre} ${persona.apellido}`.trim()
    // Buscar dispositivo existente por uid directamente en Firestore (consulta puntual,
    // no trae todos: más eficiente y sin condición de carrera con muchos registrando)
    let existentes = []
    try { existentes = await getColWhere('dispositivos', 'uid', uid) } catch {}
    const existente = existentes[0]
    if (existente) {
      await updateItem('dispositivos', existente.id, {
        personalId: persona.id, nombreCompleto,
        proyectoId: proyectoActivo?.id || existente.proyectoId || '',
        ultimaCarga: new Date().toISOString()
      })
    } else {
      await addItem('dispositivos', {
        uid, personalId: persona.id, nombreCompleto,
        proyectoId: proyectoActivo?.id || '',
        primeraVez: new Date().toISOString(), ultimaCarga: new Date().toISOString()
      })
    }
  },
  // Reasignar un dispositivo a otra persona (corregir elección errónea)
  reasignarDispositivo: async (dispId, persona) => {
    await updateItem('dispositivos', dispId, {
      personalId: persona.id,
      nombreCompleto: `${persona.nombre} ${persona.apellido}`.trim()
    })
  },
  // Resetear: libera el dispositivo para que vuelva a elegir en la próxima carga
  resetearDispositivo: async (dispId) => { await deleteItem('dispositivos', dispId) },

  // Login anónimo para /cargar: solo si no hay ninguna sesión activa.
  // Da un uid de Firebase estable por dispositivo, necesario para subir a Storage.
  // Garantiza sesión y DEVUELVE el uid (espera a que el login anónimo complete)
  asegurarAnonimo: async () => {
    const { usuarioActual } = get()
    if (usuarioActual?.uid) return usuarioActual.uid
    try {
      const cred = await loginAnonimo()
      return cred?.user?.uid || null
    } catch (e) { console.error('login anónimo:', e); return null }
  }
}))
