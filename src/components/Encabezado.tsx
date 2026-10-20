import type { Equipo } from '../types'

export interface EncabezadoProps {
  equipos: Equipo[]
  estado: 'cargando' | 'error' | 'listo'
}

function Encabezado({ equipos, estado }: EncabezadoProps) {
  const disponibles = equipos.filter((equipo) => equipo.disponible).length

  return (
    <header className="inventory-header">
      <div>
        <p className="inventory-eyebrow">Laboratorio de cómputo</p>
        <h1>Préstamos Lab — 0902-23-5284</h1>
        <p className="inventory-subtitle">Inventario de equipos</p>
      </div>
      <p className="availability-count" aria-live="polite">
        {estado === 'cargando' ? 'Consultando disponibilidad…' : estado === 'error' ? 'Disponibilidad sin confirmar' : (
          <><span className="availability-count__number">{disponibles}</span> de {equipos.length} equipos disponibles</>
        )}
      </p>
    </header>
  )
}

export default Encabezado
