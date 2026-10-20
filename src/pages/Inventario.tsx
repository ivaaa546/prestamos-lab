import { useState } from 'react'
import type { Equipo } from '../types'
import Encabezado from '../components/Encabezado'
import FormularioPrestamo from '../components/FormularioPrestamo'
import ListaEquipos from '../components/ListaEquipos'
import { equiposIniciales } from '../data/equipos'

function Inventario() {
  const [equipos] = useState<Equipo[]>(equiposIniciales)
  const [equipoSeleccionadoId, setEquipoSeleccionadoId] = useState<number | null>(null)
  const equipoSeleccionado = equipos.find((equipo) => equipo.id === equipoSeleccionadoId)

  const manejarPrestar = (id: number) => {
    const equipo = equipos.find((elemento) => elemento.id === id)
    if (equipo?.disponible) setEquipoSeleccionadoId(id)
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
        />
      )}
    </main>
  )
}

export default Inventario
