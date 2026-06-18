import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCWO0G0kH_2ReuhYFiHSjxBFLtGn0lfu7s",
  authDomain: "ndtracker-14d4c.firebaseapp.com",
  projectId: "ndtracker-14d4c",
  storageBucket: "ndtracker-14d4c.firebasestorage.app",
  messagingSenderId: "238278296435",
  appId: "1:238278296435:web:192e19648e48b638487b06"
}

const app = initializeApp(firebaseConfig, 'seed')
const db  = getFirestore(app)
const C   = (col) => `nd5s_${col}`

const hoy  = new Date()
const hace = (dias) => new Date(hoy - dias * 86400000).toISOString()

const hallazgos = [
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'Acumulación de escombros en escalera de emergencia',
    nivel: 'P03', zona: 'Escalera SE',
    estado: 'abierto',
    creadoPor: 'Lucas Vega', creadoPorId: 'u-lv',
    responsable: null, fechaLimite: null, solucion: null,
    creadoEn: hace(8), actualizadoEn: hace(8)
  },
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'Herramientas sin guardar sobre losa — riesgo de caída',
    nivel: 'P07', zona: 'Eje C-D',
    estado: 'en_proceso',
    creadoPor: 'Eduardo Cáceres', creadoPorId: 'u-ec',
    responsable: 'Eduardo Cáceres',
    fechaLimite: hace(-2),
    solucion: 'Colocar caja porta-herramientas en sector',
    creadoEn: hace(5), actualizadoEn: hace(3)
  },
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'Falta señalización de zona de trabajo eléctrico',
    nivel: 'Planta Baja', zona: 'Tablero principal',
    estado: 'cerrado',
    creadoPor: 'Lucas Vega', creadoPorId: 'u-lv',
    responsable: 'Eduardo Cáceres',
    fechaLimite: hace(1),
    solucion: 'Colocar cinta de peligro y cartel',
    resolucion: 'Se colocaron carteles de peligro y cinta de balización.',
    cerradoEn: hace(1),
    creadoEn: hace(6), actualizadoEn: hace(1)
  },
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'Derrame de cemento fresco en acceso principal',
    nivel: 'Planta Baja', zona: 'Acceso obra',
    estado: 'cerrado',
    creadoPor: 'Fernando Berdini', creadoPorId: 'u-fb',
    responsable: 'Lucas Vega',
    fechaLimite: hace(3),
    resolucion: 'Se limpió el derrame y se colocó señal de piso mojado.',
    cerradoEn: hace(3),
    creadoEn: hace(7), actualizadoEn: hace(3)
  },
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'Cables eléctricos sin canalizar sobre el piso',
    nivel: 'P05', zona: 'Dpto 5A',
    estado: 'abierto',
    creadoPor: 'Eduardo Cáceres', creadoPorId: 'u-ec',
    responsable: null, fechaLimite: null, solucion: null,
    creadoEn: hace(2), actualizadoEn: hace(2)
  },
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'EPP incompleto — operarios sin casco en altura',
    nivel: 'P09', zona: 'Balcones frente',
    estado: 'en_proceso',
    creadoPor: 'Lucas Vega', creadoPorId: 'u-lv',
    responsable: 'Eduardo Cáceres',
    fechaLimite: hace(-1),
    solucion: 'Reforzar charla de seguridad y verificar stock de EPP',
    creadoEn: hace(4), actualizadoEn: hace(2)
  },
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'Contenedor de residuos desbordado — material mezclado',
    nivel: 'Obrador', zona: 'Sector residuos',
    estado: 'cerrado',
    creadoPor: 'Eduardo Cáceres', creadoPorId: 'u-ec',
    responsable: 'Lucas Vega',
    fechaLimite: hace(2),
    resolucion: 'Contenedor vaciado y residuos clasificados correctamente.',
    cerradoEn: hace(2),
    creadoEn: hace(9), actualizadoEn: hace(2)
  },
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'Andamio sin fijar correctamente — tablones sueltos',
    nivel: 'P11', zona: 'Fachada sur',
    estado: 'abierto',
    creadoPor: 'Lucas Vega', creadoPorId: 'u-lv',
    responsable: null,
    fechaLimite: hace(-3),
    solucion: null,
    creadoEn: hace(12), actualizadoEn: hace(12)
  },
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'Materiales bloqueando salida de emergencia',
    nivel: 'Sótano', zona: 'Depósito',
    estado: 'en_proceso',
    creadoPor: 'Fernando Berdini', creadoPorId: 'u-fb',
    responsable: 'Eduardo Cáceres',
    fechaLimite: hace(-5),
    solucion: 'Reubicar pallets en sector de acopio designado',
    creadoEn: hace(15), actualizadoEn: hace(5)
  },
  {
    proyectoId: 'p10', proyectoCodigo: '10',
    descripcion: 'Piso húmedo sin señalizar en baño de servicio',
    nivel: 'Entrepiso', zona: 'Baño servicio',
    estado: 'cerrado',
    creadoPor: 'Eduardo Cáceres', creadoPorId: 'u-ec',
    responsable: 'Lucas Vega',
    fechaLimite: hace(0),
    resolucion: 'Se secó el área y se colocó cartel indicador.',
    cerradoEn: hace(0),
    creadoEn: hace(3), actualizadoEn: hace(0)
  }
]

const innecesarios = [
  {
    proyectoId: 'p10',
    detalle: 'Bidones de agua vacíos acumulados',
    nivel: 'Obrador', cantidad: '12 unidades',
    causa: 'No se retiraron luego de uso',
    destino: 'Retiro por camión de residuos',
    responsable: 'Eduardo Cáceres',
    fechaSolucion: hace(-3),
    estado: 'pendiente',
    creadoPor: 'Lucas Vega', creadoPorId: 'u-lv',
    creadoEn: hace(10), actualizadoEn: hace(10)
  },
  {
    proyectoId: 'p10',
    detalle: 'Bolsas de cemento rotas y mojadas — inutilizables',
    nivel: 'Sótano', cantidad: '8 bolsas',
    causa: 'Mal almacenamiento, contacto con humedad',
    destino: null, responsable: null, fechaSolucion: null,
    estado: 'pendiente',
    creadoPor: 'Eduardo Cáceres', creadoPorId: 'u-ec',
    creadoEn: hace(5), actualizadoEn: hace(5)
  },
  {
    proyectoId: 'p10',
    detalle: 'Encofrado de madera en mal estado — descartado',
    nivel: 'P02', cantidad: '20 tablones aprox.',
    causa: 'Fin de vida útil, no reparables',
    destino: 'Retiro a basural habilitado',
    responsable: 'Lucas Vega',
    fechaSolucion: hace(-7),
    estado: 'cerrado',
    observacionCierre: 'Se cargó en volquete y se retiró de obra.',
    cerradoEn: hace(2),
    creadoPor: 'Lucas Vega', creadoPorId: 'u-lv',
    creadoEn: hace(14), actualizadoEn: hace(2)
  },
  {
    proyectoId: 'p10',
    detalle: 'Caños de PVC de diámetro equivocado — sobrante de otro proyecto',
    nivel: 'Obrador', cantidad: '6 tiras de 3m',
    causa: 'Compra errónea de lote anterior',
    destino: 'Devolución a proveedor',
    responsable: 'Eduardo Cáceres',
    fechaSolucion: null,
    estado: 'pendiente',
    creadoPor: 'Fernando Berdini', creadoPorId: 'u-fb',
    creadoEn: hace(7), actualizadoEn: hace(7)
  },
  {
    proyectoId: 'p10',
    detalle: 'Amoladora rota sin cabo ni disco — fuera de uso',
    nivel: 'Obrador', cantidad: '1 unidad',
    causa: 'Rotura por uso, no fue dada de baja',
    destino: 'Baja de inventario',
    responsable: 'Lucas Vega',
    fechaSolucion: hace(-2),
    estado: 'cerrado',
    observacionCierre: 'Se dio de baja en inventario y se descartó.',
    cerradoEn: hace(1),
    creadoPor: 'Eduardo Cáceres', creadoPorId: 'u-ec',
    creadoEn: hace(6), actualizadoEn: hace(1)
  }
]

async function seed() {
  console.log('Insertando 10 hallazgos...')
  for (const h of hallazgos) {
    const ref = await addDoc(collection(db, C('hallazgos')), h)
    console.log(' ✓', h.descripcion.slice(0, 50))
  }
  console.log('\nInsertando 5 innecesarios...')
  for (const i of innecesarios) {
    const ref = await addDoc(collection(db, C('innecesarios')), i)
    console.log(' ✓', i.detalle.slice(0, 50))
  }
  console.log('\n✅ Seed completo.')
  process.exit(0)
}

seed().catch(e => { console.error('❌', e.message); process.exit(1) })
