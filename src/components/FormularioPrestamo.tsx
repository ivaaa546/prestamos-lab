import { useState, type FormEvent } from 'react'
import type { Equipo } from '../types'

interface FormularioPrestamoProps {
  equipo: Equipo
  onCancelar: () => void
}

interface DatosFormulario {
  solicitante: string
  carne: string
  fechaLimite: string
}

type ErroresFormulario = Partial<Record<keyof DatosFormulario, string>>

const FORMULARIO_VACIO: DatosFormulario = {
  solicitante: '',
  carne: '',
  fechaLimite: '',
}

function parsearFechaLocal(valor: string): Date | null {
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

function validarDatos(datos: DatosFormulario): ErroresFormulario {
  const errores: ErroresFormulario = {}
  const solicitante = datos.solicitante.trim()

  if (!solicitante) {
    errores.solicitante = 'El solicitante es obligatorio.'
  } else if (solicitante.length < 5) {
    errores.solicitante = 'Escribe al menos 5 caracteres.'
  }

  if (!datos.carne) {
    errores.carne = 'El carné es obligatorio.'
  } else if (!/^\d{4}-\d{2}-\d{5}$/.test(datos.carne)) {
    errores.carne = 'Usa el formato 0000-00-00000.'
  }

  if (!datos.fechaLimite) {
    errores.fechaLimite = 'La fecha límite es obligatoria.'
  } else {
    const fecha = parsearFechaLocal(datos.fechaLimite)
    if (!fecha) {
      errores.fechaLimite = 'Introduce una fecha válida.'
    } else {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const limite = new Date(hoy)
      limite.setDate(limite.getDate() + 2)

      if (fecha < hoy) {
        errores.fechaLimite = 'La fecha no puede ser anterior a hoy.'
      } else if (fecha > limite) {
        errores.fechaLimite = 'La fecha no puede superar 2 días calendario.'
      } else if (fecha.getDay() === 0 || fecha.getDay() === 6) {
        errores.fechaLimite = 'La fecha límite no puede caer en sábado ni domingo.'
      }
    }
  }

  return errores
}

function FormularioPrestamo({ equipo, onCancelar }: FormularioPrestamoProps) {
  const [datos, setDatos] = useState<DatosFormulario>(FORMULARIO_VACIO)
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [confirmado, setConfirmado] = useState(false)

  const actualizarCampo = (campo: keyof DatosFormulario, valor: string) => {
    setDatos((datosActuales) => ({ ...datosActuales, [campo]: valor }))
    setConfirmado(false)
  }

  const manejarEnvio = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const nuevosErrores = validarDatos(datos)
    setErrores(nuevosErrores)
    setConfirmado(Object.keys(nuevosErrores).length === 0)
  }

  return (
    <section className="loan-form-panel" aria-labelledby="loan-form-heading">
      <div className="loan-form-panel__heading">
        <div>
          <p className="inventory-eyebrow">Nuevo préstamo</p>
          <h2 id="loan-form-heading">Solicitar equipo</h2>
          <p className="loan-form-panel__equipment">Equipo: {equipo.nombre}</p>
        </div>
        <button className="panel-close-button" type="button" onClick={onCancelar} aria-label="Cancelar y cerrar">
          ×
        </button>
      </div>

      <form noValidate onSubmit={manejarEnvio}>
        <div className="form-field">
          <label htmlFor="solicitante">Solicitante</label>
          <input
            autoComplete="name"
            id="solicitante"
            name="solicitante"
            value={datos.solicitante}
            onChange={(evento) => actualizarCampo('solicitante', evento.target.value)}
            aria-invalid={Boolean(errores.solicitante)}
            aria-describedby={errores.solicitante ? 'solicitante-error' : undefined}
          />
          {errores.solicitante && <p className="field-error" id="solicitante-error">{errores.solicitante}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="carne">Carné del solicitante</label>
          <input
            autoComplete="off"
            id="carne"
            name="carne"
            value={datos.carne}
            onChange={(evento) => actualizarCampo('carne', evento.target.value)}
            aria-invalid={Boolean(errores.carne)}
            aria-describedby={errores.carne ? 'carne-error' : undefined}
          />
          {errores.carne && <p className="field-error" id="carne-error">{errores.carne}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="fechaLimite">Fecha límite</label>
          <input
            id="fechaLimite"
            name="fechaLimite"
            type="date"
            value={datos.fechaLimite}
            onChange={(evento) => actualizarCampo('fechaLimite', evento.target.value)}
            aria-invalid={Boolean(errores.fechaLimite)}
            aria-describedby={errores.fechaLimite ? 'fechaLimite-error' : undefined}
          />
          {errores.fechaLimite && <p className="field-error" id="fechaLimite-error">{errores.fechaLimite}</p>}
        </div>

        {confirmado && (
          <p className="form-confirmation" role="status">
            Los datos son válidos. Aún no se ha registrado ningún préstamo.
          </p>
        )}

        <div className="loan-form-actions">
          <button className="loan-button" type="submit">Validar datos</button>
          <button className="cancel-button" type="button" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>
    </section>
  )
}

export default FormularioPrestamo
