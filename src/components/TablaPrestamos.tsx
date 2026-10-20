import type { Equipo, Prestamo } from '../types'

export interface TablaPrestamosProps {
  prestamos: Prestamo[]
  equipos: Equipo[]
  onDevolver: (id: number) => void
}

function interpretarFechaLocal(valor: string): Date | null {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (!coincidencia) return null

  const anio = Number(coincidencia[1])
  const mes = Number(coincidencia[2])
  const dia = Number(coincidencia[3])
  const fecha = new Date(anio, mes - 1, dia)

  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return null
  }

  return fecha
}

function formatearFechaLocal(valor: string): string {
  const fecha = interpretarFechaLocal(valor)
  return fecha
    ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium' }).format(fecha)
    : valor
}

function estaVencido(fechaLimite: string): boolean {
  const hoy = new Date()
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  return Boolean(interpretarFechaLocal(fechaLimite)) && fechaLimite < fechaHoy
}

function TablaPrestamos({ prestamos, equipos, onDevolver }: TablaPrestamosProps) {
  return (
    <section className="loans-section" aria-labelledby="loans-heading">
      <div className="loans-section__heading">
        <div>
          <p className="inventory-eyebrow">Seguimiento</p>
          <h2 id="loans-heading">Préstamos activos</h2>
        </div>
        <span className="equipment-total">{prestamos.length} activos</span>
      </div>

      {prestamos.length === 0 ? (
        <p className="empty-loans">No hay préstamos activos.</p>
      ) : (
        <div className="loans-table-scroll" role="region" aria-label="Tabla de préstamos activos" tabIndex={0}>
          <table className="loans-table">
            <thead>
              <tr>
                <th scope="col">Equipo</th>
                <th scope="col">Solicitante</th>
                <th scope="col">Fecha límite</th>
                <th scope="col">Acción</th>
              </tr>
            </thead>
            <tbody>
              {prestamos.map((prestamo) => {
                const vencido = estaVencido(prestamo.fechaLimite)
                const equipo = equipos.find((elemento) => elemento.id === prestamo.equipoId)

                return (
                  <tr className={vencido ? 'loan-row loan-row--overdue' : 'loan-row'} key={prestamo.id}>
                    <td>{equipo?.nombre ?? 'Equipo no encontrado'}</td>
                    <td>{prestamo.solicitante}</td>
                    <td>
                      {formatearFechaLocal(prestamo.fechaLimite)}
                      {vencido && <span className="overdue-label">Vencido</span>}
                    </td>
                    <td>
                      <button
                        className="return-button"
                        type="button"
                        onClick={() => onDevolver(prestamo.id)}
                      >
                        Devolver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default TablaPrestamos
