import { useState } from 'react'
import type { Equipo, Prestamo } from '../types'
import Encabezado from '../components/Encabezado'
import FormularioPrestamo, { type DatosPrestamoFormulario } from '../components/FormularioPrestamo'
import ListaEquipos from '../components/ListaEquipos'
import TablaPrestamos from '../components/TablaPrestamos'
import { equiposIniciales } from '../data/equipos'
import { prestamosIniciales } from '../data/prestamos'

function fechaActualLocalISO(): string {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function Inventario() {
  const [equipos, setEquipos] = useState<Equipo[]>(equiposIniciales)
  const [prestamos, setPrestamos] = useState<Prestamo[]>(prestamosIniciales)
  const [equipoSeleccionadoId, setEquipoSeleccionadoId] = useState<number | null>(null)
  const equipoSeleccionado = equipos.find((equipo) => equipo.id === equipoSeleccionadoId)
  const prestamosActivos = prestamos.filter((prestamo) => prestamo.devuelto === false)

  const manejarPrestar = (id: number) => {
    const equipo = equipos.find((elemento) => elemento.id === id)
    if (equipo?.disponible) setEquipoSeleccionadoId(id)
  }

  const registrarPrestamo = (datos: DatosPrestamoFormulario) => {
    const equipo = equipos.find((elemento) => elemento.id === equipoSeleccionadoId)
    if (!equipo?.disponible) return

    const nuevoPrestamo: Prestamo = {
      id: Math.max(0, ...prestamos.map((prestamo) => prestamo.id)) + 1,
      equipoId: equipo.id,
      solicitante: datos.solicitante,
      carne: datos.carne,
      fechaPrestamo: fechaActualLocalISO(),
      fechaLimite: datos.fechaLimite,
      devuelto: false,
    }

    setPrestamos((prestamosActuales) => [...prestamosActuales, nuevoPrestamo])
    setEquipos((equiposActuales) =>
      equiposActuales.map((equipoActual) =>
        equipoActual.id === equipo.id ? { ...equipoActual, disponible: false } : equipoActual,
      ),
    )
    setEquipoSeleccionadoId(null)
  }

  const devolverPrestamo = (id: number) => {
    const prestamo = prestamos.find((elemento) => elemento.id === id)
    if (!prestamo || prestamo.devuelto) return

    const equipo = equipos.find((elemento) => elemento.id === prestamo.equipoId)
    if (!equipo) return

    setPrestamos((prestamosActuales) =>
      prestamosActuales.map((prestamoActual) =>
        prestamoActual.id === id && !prestamoActual.devuelto
          ? { ...prestamoActual, devuelto: true }
          : prestamoActual,
      ),
    )
    setEquipos((equiposActuales) =>
      equiposActuales.map((equipoActual) =>
        equipoActual.id === equipo.id ? { ...equipoActual, disponible: true } : equipoActual,
      ),
    )
  }

  const cancelarPrestamo = () => setEquipoSeleccionadoId(null)

  return (
    <main className="inventory-page">
      <Encabezado equipos={equipos} />
      <ListaEquipos equipos={equipos} onPrestar={manejarPrestar} />
      {equipoSeleccionado && (
        <FormularioPrestamo
          key={equipoSeleccionado.id}
          equipo={equipoSeleccionado}
          onCancelar={cancelarPrestamo}
          onRegistrar={registrarPrestamo}
        />
      )}
      <TablaPrestamos prestamos={prestamosActivos} equipos={equipos} onDevolver={devolverPrestamo} />
    </main>
  )
}

export default Inventario
