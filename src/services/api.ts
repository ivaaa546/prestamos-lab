import type { Equipo, Prestamo } from '../types'

export type NuevoPrestamo = Omit<Prestamo, 'id'>

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function obtenerBaseApi(): string {
  const base = import.meta.env.VITE_API_URL?.trim()
  if (!base) {
    throw new ApiError('Falta configurar VITE_API_URL. Revisa el archivo .env y reinicia Vite.')
  }
  return base.replace(/\/$/, '')
}

async function solicitudJson<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const base = obtenerBaseApi()
  const controlador = new AbortController()
  const cancelar = () => controlador.abort(init.signal?.reason)
  let tiempoAgotado = false
  const temporizador = setTimeout(() => {
    tiempoAgotado = true
    controlador.abort()
  }, 10_000)
  init.signal?.addEventListener('abort', cancelar, { once: true })
  if (init.signal?.aborted) cancelar()

  try {
    const respuesta = await fetch(`${base}${ruta}`, { ...init, signal: controlador.signal })
    if (!respuesta.ok) {
      throw new ApiError(`La API respondió con un error (${respuesta.status}).`, respuesta.status)
    }
    return (await respuesta.json()) as T
  } catch (error) {
    if (init.signal?.aborted) throw error
    if (tiempoAgotado) {
      const detalle = init.method && init.method !== 'GET'
        ? ' El servidor podría haber aplicado el cambio. Comprueba los datos antes de repetir la operación.'
        : ' Comprueba la conexión y pulsa Reintentar.'
      throw new ApiError(`La API tardó más de 10 segundos en responder.${detalle}`)
    }
    if (error instanceof ApiError) throw error
    if (error instanceof SyntaxError) throw new ApiError('La API devolvió una respuesta JSON no válida.')
    throw new ApiError('No se pudo conectar con la API. Comprueba que json-server esté en ejecución.')
  } finally {
    clearTimeout(temporizador)
    init.signal?.removeEventListener('abort', cancelar)
  }
}

function opcionesJson(metodo: 'POST' | 'PATCH', datos: unknown): RequestInit {
  return {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  }
}

export function obtenerEquipos(signal?: AbortSignal): Promise<Equipo[]> {
  return solicitudJson<Equipo[]>('/equipos', { signal })
}

export function obtenerPrestamosActivos(signal?: AbortSignal): Promise<Prestamo[]> {
  return solicitudJson<Prestamo[]>('/prestamos?devuelto=false', { signal })
}

export function crearPrestamo(prestamo: NuevoPrestamo): Promise<Prestamo> {
  return solicitudJson<Prestamo>('/prestamos', opcionesJson('POST', prestamo))
}

export function actualizarDisponibilidadEquipo(
  id: number,
  disponible: boolean,
): Promise<Equipo> {
  return solicitudJson<Equipo>(`/equipos/${id}`, opcionesJson('PATCH', { disponible }))
}

export function marcarPrestamoDevuelto(id: number): Promise<Prestamo> {
  return solicitudJson<Prestamo>(`/prestamos/${id}`, opcionesJson('PATCH', { devuelto: true }))
}

export function restaurarPrestamoActivo(id: number): Promise<Prestamo> {
  return solicitudJson<Prestamo>(`/prestamos/${id}`, opcionesJson('PATCH', { devuelto: false }))
}

export function eliminarPrestamoCompensado(id: number): Promise<void> {
  return solicitudJson<unknown>(`/prestamos/${id}`, { method: 'DELETE' }).then(() => undefined)
}
