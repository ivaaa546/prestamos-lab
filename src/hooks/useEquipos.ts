import { useEffect, useRef, useState } from 'react'
import type { Equipo } from '../types'
import { obtenerEquipos } from '../services/api'

interface UseEquiposResult {
  equipos: Equipo[]
  cargando: boolean
  error: string | null
  recargar: () => void
  actualizarEquipoConfirmado: (equipo: Equipo) => void
}

export function useEquipos(): UseEquiposResult {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versionRecarga, setVersionRecarga] = useState(0)
  const solicitudActual = useRef(0)
  const controladorActual = useRef<AbortController | null>(null)

  useEffect(() => {
    const controlador = new AbortController()
    const solicitud = solicitudActual.current + 1
    solicitudActual.current = solicitud
    controladorActual.current = controlador
    obtenerEquipos(controlador.signal)
      .then((equiposRecibidos) => {
        if (solicitudActual.current === solicitud) setEquipos(equiposRecibidos)
      })
      .catch((errorRecibido: unknown) => {
        if (controlador.signal.aborted || (errorRecibido instanceof Error && errorRecibido.name === 'AbortError')) return
        if (solicitudActual.current === solicitud) {
          setError(errorRecibido instanceof Error ? errorRecibido.message : 'No se pudo cargar el inventario.')
        }
      })
      .finally(() => {
        if (solicitudActual.current === solicitud && !controlador.signal.aborted) setCargando(false)
      })

    return () => {
      controlador.abort()
      if (controladorActual.current === controlador) controladorActual.current = null
    }
  }, [versionRecarga])

  const recargar = () => {
    solicitudActual.current += 1
    controladorActual.current?.abort()
    setCargando(true)
    setError(null)
    setVersionRecarga((version) => version + 1)
  }

  const actualizarEquipoConfirmado = (equipoActualizado: Equipo) => {
    setEquipos((equiposActuales) =>
      equiposActuales.map((equipo) => (equipo.id === equipoActualizado.id ? equipoActualizado : equipo)),
    )
  }

  return { equipos, cargando, error, recargar, actualizarEquipoConfirmado }
}
