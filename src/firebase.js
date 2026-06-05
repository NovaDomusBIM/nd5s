import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCWO0G0kH_2ReuhYFiHSjxBFLtGn0lfu7s",
  authDomain: "ndtracker-14d4c.firebaseapp.com",
  projectId: "ndtracker-14d4c",
  storageBucket: "ndtracker-14d4c.firebasestorage.app",
  messagingSenderId: "238278296435",
  appId: "1:238278296435:web:192e19648e48b638487b06"
}

const app     = initializeApp(firebaseConfig, 'nd5s')
export const db      = getFirestore(app)
export const auth    = getAuth(app)
export const storage = getStorage(app)
