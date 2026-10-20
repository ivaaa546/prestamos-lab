import type { Prestamo } from '../types'

// Las fechas se guardan como YYYY-MM-DD (fecha ISO 8601 sin hora), interpretadas en hora local.
function fechaLocalISO(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

function siguienteFechaLimiteValida(): Date {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  for (let dias = 0; dias <= 2; dias += 1) {
    const candidata = sumarDias(hoy, dias)
    if (candidata.getDay() !== 0 && candidata.getDay() !== 6) return candidata
  }

  // Dentro de hoy y los próximos dos días siempre hay al menos un día laborable.
  return sumarDias(hoy, 2)
}

function fechaLimiteVencida(): Date {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  for (let dias = 1; dias <= 7; dias += 1) {
    const candidata = sumarDias(hoy, -dias)
    if (candidata.getDay() !== 0 && candidata.getDay() !== 6) return candidata
  }

  return sumarDias(hoy, -1)
}

const limiteVencido = fechaLimiteVencida()
const limiteVigente = siguienteFechaLimiteValida()
const inicioVencido = sumarDias(limiteVencido, -2)
const inicioVigente = sumarDias(limiteVigente, -2)

export const prestamosIniciales: Prestamo[] = [
  {
    id: 1,
    equipoId: 2,
    solicitante: 'Andrea López',
    carne: '2020-01-00001',
    fechaPrestamo: fechaLocalISO(inicioVencido),
    fechaLimite: fechaLocalISO(limiteVencido),
    devuelto: false,
  },
  {
    id: 2,
    equipoId: 5,
    solicitante: 'Carlos Méndez',
    carne: '2021-02-00002',
    fechaPrestamo: fechaLocalISO(inicioVigente),
    fechaLimite: fechaLocalISO(limiteVigente),
    devuelto: false,
  },
  {
    id: 3,
    equipoId: 8,
    solicitante: 'María García',
    carne: '2022-03-00003',
    fechaPrestamo: fechaLocalISO(inicioVigente),
    fechaLimite: fechaLocalISO(limiteVigente),
    devuelto: false,
  },
]
