import Encabezado from '../components/Encabezado'
import ListaEquipos from '../components/ListaEquipos'
import { equiposIniciales } from '../data/equipos'

function Inventario() {
  const manejarPrestar = (id: number) => {
    console.log('Equipo seleccionado para préstamo:', id)
  }

  return (
    <main className="inventory-page">
      <Encabezado equipos={equiposIniciales} />
      <ListaEquipos equipos={equiposIniciales} onPrestar={manejarPrestar} />
    </main>
  )
}

export default Inventario
