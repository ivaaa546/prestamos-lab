import type { Equipo } from '../types'
import TarjetaEquipo from './TarjetaEquipo'

export interface ListaEquiposProps {
  equipos: Equipo[]
  onPrestar: (id: number) => void
}

function ListaEquipos({ equipos, onPrestar }: ListaEquiposProps) {
  return (
    <section className="equipment-section" aria-labelledby="equipment-heading">
      <div className="equipment-section__heading">
        <div>
          <p className="inventory-eyebrow">Equipamiento</p>
          <h2 id="equipment-heading">Equipos</h2>
        </div>
        <span className="equipment-total">{equipos.length} equipos</span>
      </div>
      {equipos.length === 0 ? (
        <p className="empty-equipment">No hay equipos que coincidan con los filtros.</p>
      ) : (
        <div className="equipment-grid">
          {equipos.map((equipo) => (
            <TarjetaEquipo key={equipo.id} equipo={equipo} onPrestar={onPrestar} />
          ))}
        </div>
      )}
    </section>
  )
}

export default ListaEquipos
