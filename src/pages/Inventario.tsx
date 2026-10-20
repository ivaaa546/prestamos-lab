import { useEffect, useRef, useState } from 'react'
import type { Prestamo } from '../types'
import Encabezado from '../components/Encabezado'
import FormularioPrestamo, { type DatosPrestamoFormulario } from '../components/FormularioPrestamo'
import FiltrosInventario from '../components/FiltrosInventario'
import ListaEquipos from '../components/ListaEquipos'
import TablaPrestamos from '../components/TablaPrestamos'
import { useEquipos } from '../hooks/useEquipos'
import {
  actualizarDisponibilidadEquipo,
  crearPrestamo,
  eliminarPrestamoCompensado,
  marcarPrestamoDevuelto,
  obtenerPrestamosActivos,
  restaurarPrestamoActivo,
} from '../services/api'

function fechaActualLocalISO(): string {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado al comunicarse con la API.'
}

function Inventario() {
  const { equipos, cargando: cargandoEquipos, error: errorEquipos, recargar: recargarEquipos, actualizarEquipoConfirmado } = useEquipos()
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [cargandoPrestamos, setCargandoPrestamos] = useState(true)
  const [errorPrestamos, setErrorPrestamos] = useState<string | null>(null)
  const [versionRecargaPrestamos, setVersionRecargaPrestamos] = useState(0)
  const solicitudPrestamosActual = useRef(0)
  const controladorPrestamosActual = useRef<AbortController | null>(null)
  const operacionActiva = useRef(false)
  const [equipoSeleccionadoId, setEquipoSeleccionadoId] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [operacionEnCurso, setOperacionEnCurso] = useState(false)
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null)

  useEffect(() => {
    const controlador = new AbortController()
    const solicitud = solicitudPrestamosActual.current + 1
    solicitudPrestamosActual.current = solicitud
    controladorPrestamosActual.current = controlador
    obtenerPrestamosActivos(controlador.signal)
      .then((prestamosRecibidos) => {
        if (solicitudPrestamosActual.current === solicitud) setPrestamos(prestamosRecibidos)
      })
      .catch((error: unknown) => {
        if (controlador.signal.aborted || (error instanceof Error && error.name === 'AbortError')) return
        if (solicitudPrestamosActual.current === solicitud) setErrorPrestamos(mensajeError(error))
      })
      .finally(() => {
        if (solicitudPrestamosActual.current === solicitud && !controlador.signal.aborted) {
          setCargandoPrestamos(false)
        }
      })

    return () => {
      controlador.abort()
      if (controladorPrestamosActual.current === controlador) controladorPrestamosActual.current = null
    }
  }, [versionRecargaPrestamos])

  const recargarPrestamos = () => {
    solicitudPrestamosActual.current += 1
    controladorPrestamosActual.current?.abort()
    setCargandoPrestamos(true)
    setErrorPrestamos(null)
    setVersionRecargaPrestamos((version) => version + 1)
  }
  const recargarTodo = () => {
    recargarEquipos()
    recargarPrestamos()
  }

  const equipoSeleccionado = equipos.find((equipo) => equipo.id === equipoSeleccionadoId)
  const prestamosActivos = prestamos.filter((prestamo) => prestamo.devuelto === false)
  const errorDeLectura = errorEquipos || errorPrestamos
  const cargando = cargandoEquipos || cargandoPrestamos
  // Solo comprobamos coherencia cuando ambas lecturas han terminado correctamente.
  const datosInconsistentes = !cargando && !errorDeLectura && (
    equipos.some((equipo) => {
      const activos = prestamosActivos.filter((prestamo) => prestamo.equipoId === equipo.id).length
      return activos > 1 || equipo.disponible !== (activos === 0)
    }) || prestamosActivos.some((prestamo) => !equipos.some((equipo) => equipo.id === prestamo.equipoId))
  )
  const datosBloqueados = cargando || Boolean(errorDeLectura) || datosInconsistentes
  const terminoNormalizado = busqueda.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
  const equiposFiltrados = equipos.filter((equipo) => {
    const coincideCategoria = !categoriaSeleccionada || equipo.categoria === categoriaSeleccionada
    const nombreNormalizado = equipo.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    const coincideNombre = !terminoNormalizado || nombreNormalizado.includes(terminoNormalizado)
    return coincideCategoria && coincideNombre
  })
  const filtrosAplicados = busqueda.trim().length > 0 || categoriaSeleccionada !== ''

  const manejarPrestar = (id: number) => {
    if (operacionActiva.current || datosBloqueados) return
    const equipo = equipos.find((elemento) => elemento.id === id)
    if (equipo?.disponible) {
      setErrorOperacion(null)
      setEquipoSeleccionadoId(id)
    }
  }

  const registrarPrestamo = async (datos: DatosPrestamoFormulario): Promise<void> => {
    if (operacionActiva.current || datosBloqueados) return
    const equipo = equipos.find((elemento) => elemento.id === equipoSeleccionadoId)
    if (!equipo?.disponible) {
      setErrorOperacion('Este equipo ya no está disponible. Vuelve a cargar el inventario.')
      recargarTodo()
      return
    }

    operacionActiva.current = true
    setOperacionEnCurso(true)
    setErrorOperacion(null)
    let prestamoCreado: Prestamo | null = null

    try {
      const prestamoConfirmado = await crearPrestamo({
        equipoId: equipo.id,
        solicitante: datos.solicitante.trim(),
        carne: datos.carne,
        fechaPrestamo: fechaActualLocalISO(),
        fechaLimite: datos.fechaLimite,
        devuelto: false,
      })
      prestamoCreado = prestamoConfirmado
      const equipoActualizado = await actualizarDisponibilidadEquipo(equipo.id, false)
      actualizarEquipoConfirmado(equipoActualizado)
      setPrestamos((actuales) => [...actuales, prestamoConfirmado])
      setEquipoSeleccionadoId(null)
    } catch (error: unknown) {
      let detalle = mensajeError(error)
      if (prestamoCreado) {
        const erroresCompensacion: string[] = []
        try {
          await eliminarPrestamoCompensado(prestamoCreado.id)
          // No liberamos el equipo mientras pueda seguir existiendo un préstamo activo.
          await actualizarDisponibilidadEquipo(equipo.id, true)
        } catch (errorCompensacion: unknown) {
          erroresCompensacion.push(mensajeError(errorCompensacion))
        }
        detalle = erroresCompensacion.length > 0
          ? `INCONSISTENCIA: falló una parte del registro ${prestamoCreado.id} y la compensación no pudo completarse. ${erroresCompensacion.join(' ')} ${detalle}`
          : `El préstamo no se completó: se anuló el registro ${prestamoCreado.id} y se restauró la disponibilidad del equipo. ${detalle}`
      }
      setErrorOperacion(detalle)
      recargarTodo()
    } finally {
      operacionActiva.current = false
      setOperacionEnCurso(false)
    }
  }

  const devolverPrestamo = async (id: number): Promise<void> => {
    if (operacionActiva.current || datosBloqueados) return
    const prestamo = prestamosActivos.find((elemento) => elemento.id === id)
    if (!prestamo) return

    const equipo = equipos.find((elemento) => elemento.id === prestamo.equipoId)
    if (!equipo) {
      setErrorOperacion('No se encontró el equipo asociado al préstamo. Vuelve a cargar los datos.')
      recargarTodo()
      return
    }

    operacionActiva.current = true
    setOperacionEnCurso(true)
    setErrorOperacion(null)
    let devolucionConfirmada: Prestamo | null = null

    try {
      devolucionConfirmada = await marcarPrestamoDevuelto(id)
      const equipoActualizado = await actualizarDisponibilidadEquipo(equipo.id, true)
      actualizarEquipoConfirmado(equipoActualizado)
      setPrestamos((actuales) => actuales.filter((actual) => actual.id !== devolucionConfirmada?.id))
    } catch (error: unknown) {
      let detalle = mensajeError(error)
      if (devolucionConfirmada) {
        const erroresCompensacion: string[] = []
        try {
          await restaurarPrestamoActivo(id)
        } catch (errorCompensacion: unknown) {
          erroresCompensacion.push(mensajeError(errorCompensacion))
        }
        try {
          await actualizarDisponibilidadEquipo(equipo.id, false)
        } catch (errorCompensacion: unknown) {
          erroresCompensacion.push(mensajeError(errorCompensacion))
        }
        detalle = erroresCompensacion.length > 0
          ? `INCONSISTENCIA: falló una parte de la devolución ${id} y la compensación no pudo completarse. ${erroresCompensacion.join(' ')} ${detalle}`
          : `La devolución no se completó: se revirtió el préstamo ${id} y se restauró el equipo como prestado. ${detalle}`
      }
      setErrorOperacion(detalle)
      recargarTodo()
    } finally {
      operacionActiva.current = false
      setOperacionEnCurso(false)
    }
  }

  const cancelarPrestamo = () => {
    if (!operacionEnCurso) setEquipoSeleccionadoId(null)
  }

  return (
    <main className="inventory-page">
      <Encabezado equipos={equipos} estado={cargando ? 'cargando' : errorDeLectura || datosInconsistentes ? 'error' : 'listo'} />

      {(errorDeLectura || datosInconsistentes) && (
        <div className="api-read-error" role="alert">
          <p>{errorDeLectura
            ? `No se pudieron cargar todos los datos. ${errorDeLectura}`
            : 'Los equipos y préstamos no coinciden. Las operaciones están bloqueadas. Revisa los registros en la API y vuelve a cargar los datos.'}</p>
          <button className="return-button" type="button" disabled={operacionEnCurso || cargando} onClick={() => {
            if (!operacionActiva.current) recargarTodo()
          }}>Reintentar</button>
        </div>
      )}
      {errorOperacion && !equipoSeleccionado && <p className="operation-error" role="alert">{errorOperacion}</p>}

      {cargando ? (
        <p className="api-loading" role="status">Cargando inventario y préstamos…</p>
      ) : errorEquipos ? null : (
        <>
          <FiltrosInventario
            busqueda={busqueda}
            categoriaSeleccionada={categoriaSeleccionada}
            onCambiarBusqueda={setBusqueda}
            onCambiarCategoria={setCategoriaSeleccionada}
            onLimpiar={() => {
              setBusqueda('')
              setCategoriaSeleccionada('')
            }}
            filtrosAplicados={filtrosAplicados}
          />
          <ListaEquipos
            equipos={equiposFiltrados}
            onPrestar={manejarPrestar}
            operacionEnCurso={operacionEnCurso || datosBloqueados}
          />
        </>
      )}

      {equipoSeleccionado && (
        <FormularioPrestamo
          key={equipoSeleccionado.id}
          equipo={equipoSeleccionado}
          onCancelar={cancelarPrestamo}
          onRegistrar={registrarPrestamo}
          operacionEnCurso={operacionEnCurso}
          registroBloqueado={datosBloqueados}
          errorOperacion={errorOperacion}
        />
      )}

      {!cargando && !errorDeLectura && (
        <TablaPrestamos
          prestamos={prestamosActivos}
          equipos={equipos}
          onDevolver={(id) => void devolverPrestamo(id)}
          operacionEnCurso={operacionEnCurso || datosBloqueados}
        />
      )}
    </main>
  )
}

export default Inventario
