export interface FiltrosInventarioProps {
  busqueda: string
  categoriaSeleccionada: string
  onCambiarBusqueda: (busqueda: string) => void
  onCambiarCategoria: (categoria: string) => void
  onLimpiar: () => void
  filtrosAplicados: boolean
}

function FiltrosInventario({
  busqueda,
  categoriaSeleccionada,
  onCambiarBusqueda,
  onCambiarCategoria,
  onLimpiar,
  filtrosAplicados,
}: FiltrosInventarioProps) {
  return (
    <section className="inventory-filters" aria-label="Filtros del inventario">
      <div className="inventory-filters__fields">
        <div className="filter-field">
          <label htmlFor="inventory-search">Buscar por nombre</label>
          <input
            id="inventory-search"
            type="search"
            value={busqueda}
            onChange={(evento) => onCambiarBusqueda(evento.target.value)}
            placeholder="Ej. Cámara Canon"
          />
        </div>

        <div className="filter-field">
          <label htmlFor="inventory-category">Categoría</label>
          <select
            id="inventory-category"
            value={categoriaSeleccionada}
            onChange={(evento) => onCambiarCategoria(evento.target.value)}
          >
            <option value="">Todas las categorías</option>
            <option value="Tablet">Tablet</option>
            <option value="Cámara">Cámara</option>
            <option value="Micrófono">Micrófono</option>
          </select>
        </div>
      </div>

      <button
        className="clear-filters-button"
        type="button"
        disabled={!filtrosAplicados}
        onClick={onLimpiar}
      >
        Limpiar filtros
      </button>
    </section>
  )
}

export default FiltrosInventario
