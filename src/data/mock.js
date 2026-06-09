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
    rol: 'jefe_obra',
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
    rol: 'jefe_obra',
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
  admin:      { label: 'Admin',              color: '#231F20' },
  direccion:  { label: 'Dirección de Obra',  color: '#425563' },
  jefe_obra:  { label: 'Jefe de Obra',       color: '#1D6FA5' },
  lider:      { label: 'Líder de Rubro',     color: '#1a7a4a' },
  sh:         { label: 'Seg. e Higiene',     color: '#7B3FA0' },
  operario:   { label: 'Operario/Referente', color: '#b86a00' }
}

// ── Rubros / contratos de obra ────────────────────────────────────────────────
export const RUBROS = [
  { id: 'hys',   codigo: '1301', nombre: 'Contrato HYS'                           },
  { id: 'grem',  codigo: '1601', nombre: 'Contrato Ayuda de gremios'              },
  { id: 'dem',   codigo: '2001', nombre: 'Contrato Demolición'                    },
  { id: 'herr',  codigo: '4801', nombre: 'Contrato Herrería'                      },
  { id: 'rev',   codigo: '4901', nombre: 'Contrato Picado Revoques'               },
  { id: 'horm',  codigo: '5001', nombre: 'Contrato Hormigón'                      },
  { id: 'mamp',  codigo: '5101', nombre: 'Contrato Mampostería'                   },
  { id: 'cort',  codigo: '5105', nombre: 'Cortinas'                               },
  { id: 'san',   codigo: '5201', nombre: 'Contrato Sanitario'                     },
  { id: 'elec',  codigo: '5301', nombre: 'Contrato Electricidad'                  },
  { id: 'clim',  codigo: '5401', nombre: 'Contrato Climatización'                 },
  { id: 'cont',  codigo: '5501', nombre: 'Contrato Contrapisos y Carpetas'        },
  { id: 'revo',  codigo: '5601', nombre: 'Contrato Revoques'                      },
  { id: 'yeso',  codigo: '5701', nombre: 'Contrato Yesería'                       },
  { id: 'pcem',  codigo: '5801', nombre: 'Contrato Pisos de Cemento'              },
  { id: 'pcer',  codigo: '5901', nombre: 'Contrato Pisos y Revestimientos Cerámicos' },
  { id: 'pmad',  codigo: '6001', nombre: 'Contrato Pisos de Madera'               },
  { id: 'cart',  codigo: '6101', nombre: 'Contrato Carpintería Taller'            },
  { id: 'caro',  codigo: '6101', nombre: 'Contrato Carpintería Obra'              },
  { id: 'pint',  codigo: '6201', nombre: 'Contrato Pintura'                       },
  { id: 'equip', codigo: '6301', nombre: 'Contrato Equipamiento y Terminaciones'  },
  { id: 'mext',  codigo: '6401', nombre: 'Contrato Muros Exteriores'              },
  { id: 'tech',  codigo: '6501', nombre: 'Contrato Techados'                      },
  { id: 'asc',   codigo: '6601', nombre: 'Contrato Ascensores'                    },
  { id: 'vent',  codigo: '6701', nombre: 'Contrato Ventilación Mecánica y Natural'},
  { id: 'pais',  codigo: '9001', nombre: 'Contrato Paisajismo'                    },
  { id: 'limp',  codigo: '9501', nombre: 'Contrato Limpieza'                      }
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
