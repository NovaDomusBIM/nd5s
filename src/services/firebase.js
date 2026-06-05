import { db, auth, storage } from '../firebase'
import {
  collection, doc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, onSnapshot, query,
  where, orderBy, writeBatch, getDoc
} from 'firebase/firestore'
import {
  signInWithEmailAndPassword, signOut,
  onAuthStateChanged, signInAnonymously
} from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

// ── Auth ────────────────────────────────────────────────────────────────────
export const loginFirebase     = (email, pass) => signInWithEmailAndPassword(auth, email, pass)
export const loginAnonimo      = ()             => signInAnonymously(auth)
export const logoutFirebase    = ()             => signOut(auth)
export const onAuthChange      = (cb)           => onAuthStateChanged(auth, cb)

// ── Firestore helpers — todas las colecciones con prefijo nd5s_ ─────────────
const C = (nombre) => `nd5s_${nombre}`

export const getCol    = async (nombre) => {
  const snap = await getDocs(collection(db, C(nombre)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getItem   = async (nombre, id) => {
  const snap = await getDoc(doc(db, C(nombre), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const listenCol = (nombre, cb, ...queryConstraints) => {
  const q = queryConstraints.length
    ? query(collection(db, C(nombre)), ...queryConstraints)
    : collection(db, C(nombre))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export const addItem    = (nombre, data)       => addDoc(collection(db, C(nombre)), data)
export const setItem    = (nombre, id, data)   => setDoc(doc(db, C(nombre), id), data)
export const updateItem = (nombre, id, data)   => updateDoc(doc(db, C(nombre), id), data)
export const deleteItem = (nombre, id)         => deleteDoc(doc(db, C(nombre), id))

// ── Storage — fotos de hallazgos ────────────────────────────────────────────
export const subirFoto = async (proyectoId, hallazgoId, blob, suffix = 'apertura') => {
  const path = `nd5s/${proyectoId}/${hallazgoId}_${suffix}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}

export const borrarFoto = (url) => {
  try { return deleteObject(ref(storage, url)) } catch { return Promise.resolve() }
}

// ── Comprimir imagen antes de subir (client-side) ───────────────────────────
export const comprimirImagen = (file, maxKB = 150) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 1200
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = height * MAX / width; width = MAX }
          else { width = width * MAX / height; height = MAX }
        }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        // Ajustar calidad hasta maxKB
        let quality = 0.85
        const tryCompress = () => {
          canvas.toBlob(blob => {
            if (!blob) { reject(new Error('Compresión fallida')); return }
            if (blob.size / 1024 <= maxKB || quality <= 0.3) { resolve(blob); return }
            quality -= 0.1
            tryCompress()
          }, 'image/jpeg', quality)
        }
        tryCompress()
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

// ── Seed inicial ─────────────────────────────────────────────────────────────
export const seedIfEmpty = async (proyectos, usuarios) => {
  const snap = await getDocs(collection(db, C('proyectos')))
  if (!snap.empty) return
  const batch = writeBatch(db)
  proyectos.forEach(p => batch.set(doc(db, C('proyectos'), p.id), p))
  usuarios.forEach(u  => batch.set(doc(db, C('usuarios'),  u.id), u))
  await batch.commit()
  console.log('✓ ND5S Firebase inicializado')
}
