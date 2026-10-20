import type { Equipo } from '../types'

export interface TarjetaEquipoProps {
  equipo: Equipo
  onPrestar: (id: number) => void
}

function TarjetaEquipo({ equipo, onPrestar }: TarjetaEquipoProps) {
  return (
    <article className="equipment-card">
      <div className="equipment-card__details">
        <p className="equipment-card__category">{equipo.categoria}</p>
        <h3>{equipo.nombre}</h3>
      </div>
      <div className="equipment-card__actions">
        <span
          className={`status-badge ${equipo.disponible ? 'status-badge--available' : 'status-badge--loaned'}`}
        >
          <span className="status-badge__dot" aria-hidden="true" />
          {equipo.disponible ? 'Disponible' : 'Prestado'}
        </span>
        <button
          className="loan-button"
          type="button"
          disabled={!equipo.disponible}
          onClick={() => onPrestar(equipo.id)}
        >
          Prestar
        </button>
      </div>
    </article>
  )
}

export default TarjetaEquipo
