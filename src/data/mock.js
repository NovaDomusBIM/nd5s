// ── Proyectos ────────────────────────────────────────────────────────────────
export const PROYECTOS_SEED = [
  {
    id: 'p10',
    codigo: '10',
    nombre: 'San Juan 3886',
    estado: 'activo',
    direccion: 'San Juan 3886, CABA',
    niveles: [
      'Sótano','Planta Baja','Entrepiso','P01','P02','P03','P04','P05',
      'P06','P07','P08','P09','P10','P11','P12','Azotea','Obrador','General obra'
    ],
    fechaInicio: '2025-01-01',
    creadoEn: new Date().toISOString()
  }
]

// ── Usuarios seed ────────────────────────────────────────────────────────────
export const USUARIOS_SEED = [
  {
    id: 'u-dc',
    nombre: 'Dante Cabrera',
    iniciales: 'DC',
    email: 'bim2@novadomus.com.ar',
    rol: 'admin',
    color: '#425563',
    proyectos: ['p10'],
    telefono: '',
    activo: true
  },
  {
    id: 'u-ec',
    nombre: 'Eduardo Cáceres',
    iniciales: 'EC',
    email: 'ec@novadomus.com.ar',
    rol: 'direccion',
    color: '#5B9BD5',
    proyectos: ['p10'],
    telefono: '',
    activo: true
  },
  {
    id: 'u-lv',
    nombre: 'Lucas Vega',
    iniciales: 'LV',
    email: 'lv@novadomus.com.ar',
    rol: 'direccion',
    color: '#8E44AD',
    proyectos: ['p10'],
    telefono: '',
    activo: true
  },
  {
    id: 'u-fb',
    nombre: 'Fernando Berdini',
    iniciales: 'FB',
    email: 'fb@novadomus.com.ar',
    rol: 'direccion',
    color: '#27AE60',
    proyectos: ['p10'],
    telefono: '',
    activo: true
  },
  {
    id: 'u-mr',
    nombre: 'Maximiliano Rabini',
    iniciales: 'MR',
    email: 'mr@novadomus.com.ar',
    rol: 'direccion',
    color: '#C47436',
    proyectos: ['p10'],
    telefono: '',
    activo: true
  }
]

// ── Roles 5S ─────────────────────────────────────────────────────────────────
export const ROLES = {
  admin:     { label: 'Admin',              color: '#231F20' },
  direccion: { label: 'Dirección',          color: '#425563' },
  lider:     { label: 'Líder de rubro',     color: '#1a7a4a' },
  operario:  { label: 'Operario/Referente', color: '#b86a00' }
}

// ── Rubros / contratos de obra ────────────────────────────────────────────────
export const RUBROS = [
  { id: 'hys',   codigo: '1301', nombre: 'HyS',                 jefe: 'Eduardo Cáceres' },
  { id: 'grem',  codigo: '1601', nombre: 'Ayuda de gremios',     jefe: 'Eduardo Cáceres' },
  { id: 'dem',   codigo: '2001', nombre: 'Demolición',           jefe: 'Eduardo Cáceres' },
  { id: 'herr',  codigo: '4801', nombre: 'Herrería',             jefe: 'Lucas Vega'      },
  { id: 'rev',   codigo: '4901', nombre: 'Picado y revoques',    jefe: 'Eduardo Cáceres' },
  { id: 'horm',  codigo: '5001', nombre: 'Hormigón',             jefe: 'Eduardo Cáceres' },
  { id: 'mamp',  codigo: '5101', nombre: 'Mampostería',          jefe: 'Eduardo Cáceres' },
  { id: 'san',   codigo: '5201', nombre: 'Sanitario',            jefe: 'Lucas Vega'      },
  { id: 'elec',  codigo: '5301', nombre: 'Electricidad',         jefe: 'Lucas Vega'      },
  { id: 'clim',  codigo: '5401', nombre: 'Climatización',        jefe: 'Lucas Vega'      },
  { id: 'carp',  codigo: '5501', nombre: 'Contrapisos',          jefe: 'Eduardo Cáceres' },
  { id: 'yeso',  codigo: '5701', nombre: 'Yesería',              jefe: 'Eduardo Cáceres' },
  { id: 'pcem',  codigo: '5801', nombre: 'Pisos de cemento',     jefe: 'Eduardo Cáceres' },
  { id: 'pcer',  codigo: '5901', nombre: 'Pisos cerámicos',      jefe: 'Eduardo Cáceres' },
  { id: 'pint',  codigo: '6201', nombre: 'Pintura',              jefe: 'Lucas Vega'      },
  { id: 'vent',  codigo: '6701', nombre: 'Ventilación',          jefe: 'Lucas Vega'      },
  { id: 'limp',  codigo: '9501', nombre: 'Limpieza',             jefe: 'Lucas Vega'      }
]

// ── Estados de hallazgo ───────────────────────────────────────────────────────
export const ESTADOS_HALLAZGO = {
  abierto:   { label: 'Abierto',    color: '#a32d2d', bg: '#fee2e2' },
  en_proceso:{ label: 'En proceso', color: '#b86a00', bg: '#fef3c7' },
  cerrado:   { label: 'Cerrado',    color: '#1a7a4a', bg: '#d1fae5' }
}

// ── Categorías 5S ─────────────────────────────────────────────────────────────
export const CATEGORIAS_5S = [
  { id: 'separar',       label: '1S — Separar',       desc: 'Seleccionar según utilidad' },
  { id: 'ordenar',       label: '2S — Ordenar',       desc: 'Organizar lo necesario'    },
  { id: 'limpiar',       label: '3S — Limpiar',       desc: 'Limpiar y eliminar suciedad'},
  { id: 'estandarizar',  label: '4S — Estandarizar',  desc: 'Mantener a lo largo del tiempo' },
  { id: 'autodisciplina',label: '5S — Autodisciplina', desc: 'Sostener el hábito'       }
]

// ── Destinos para innecesarios ────────────────────────────────────────────────
export const DESTINOS_INNECESARIO = [
  'Depósito temporal', 'Devolver a proveedor', 'Reubicar en obra',
  'Descartar', 'Vender', 'Sin definir'
]
