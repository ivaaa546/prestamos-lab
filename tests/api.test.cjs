const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

const fuente = readFileSync(`${__dirname}/../src/services/api.ts`, 'utf8')
  .replaceAll('import.meta.env.VITE_API_URL', 'globalThis.apiUrl')
const codigo = ts.transpileModule(fuente, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText

function preparar(fetch, apiUrl = 'http://localhost:3001') {
  let vencer
  const contexto = {
    exports: {}, apiUrl, fetch, AbortController, Error, SyntaxError,
    setTimeout: (callback, ms) => {
      assert.equal(ms, 10_000)
      vencer = callback
      return 1
    },
    clearTimeout: () => { vencer = undefined },
  }
  vm.runInNewContext(codigo, contexto)
  return {
    api: contexto.exports,
    vencer: () => vencer(),
    tieneTemporizador: () => Boolean(vencer),
  }
}

function esperarCancelacion(signal) {
  return new Promise((_, reject) => {
    if (signal.aborted) reject(signal.reason)
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

test('informa de configuración ausente sin llamar a fetch', async () => {
  const { api } = preparar(() => assert.fail('No debe llamar a fetch'), '')
  await assert.rejects(api.obtenerEquipos(), /Falta configurar VITE_API_URL/)
})

test('lee los activos y libera el temporizador al completar', async () => {
  const p = preparar(async (url) => {
    assert.equal(url, 'http://localhost:3001/prestamos?devuelto=false')
    return { ok: true, json: async () => [{ id: 1, devuelto: false }] }
  })
  assert.deepEqual(await p.api.obtenerPrestamosActivos(), [{ id: 1, devuelto: false }])
  assert.equal(p.tieneTemporizador(), false)
})

test('conserva el estado HTTP al fallar', async () => {
  const p = preparar(async () => ({ ok: false, status: 503 }))
  await assert.rejects(p.api.obtenerEquipos(), (error) => error.status === 503)
  assert.equal(p.tieneTemporizador(), false)
})

test('informa del error de conexión', async () => {
  const { api } = preparar(async () => { throw new TypeError('offline') })
  await assert.rejects(api.obtenerEquipos(), /No se pudo conectar/)
})

test('rechaza JSON inválido con un mensaje comprensible', async () => {
  const { api } = preparar(async () => ({
    ok: true,
    json: async () => { throw new SyntaxError('JSON inválido') },
  }))
  await assert.rejects(api.obtenerEquipos(), /respuesta JSON no válida/)
})

test('la cancelación externa conserva AbortError, no un error de conexión', async () => {
  const p = preparar(async (_, { signal }) => esperarCancelacion(signal))
  const controlador = new AbortController()
  const pendiente = p.api.obtenerEquipos(controlador.signal)
  controlador.abort()
  await assert.rejects(pendiente, (error) => error.name === 'AbortError')
  assert.equal(p.tieneTemporizador(), false)
})

test('respeta una señal cancelada antes de iniciar la lectura', async () => {
  const { api } = preparar(async (_, { signal }) => esperarCancelacion(signal))
  const controlador = new AbortController()
  controlador.abort()
  await assert.rejects(api.obtenerEquipos(controlador.signal), (error) => error.name === 'AbortError')
})

test('una lectura bloqueada termina con timeout y permite un reintento', async () => {
  let llamadas = 0
  const p = preparar(async (_, { signal }) => {
    llamadas += 1
    if (llamadas === 1) return esperarCancelacion(signal)
    return { ok: true, json: async () => [] }
  })
  const pendiente = p.api.obtenerEquipos()
  p.vencer()
  await assert.rejects(pendiente, /10 segundos.*Reintentar/)
  assert.equal(p.tieneTemporizador(), false)
  assert.deepEqual(await p.api.obtenerEquipos(), [])
})

test('el timeout cubre también la lectura del cuerpo, no solo los encabezados', async () => {
  let leyendo
  const inicioLectura = new Promise((resolve) => { leyendo = resolve })
  const p = preparar(async (_, { signal }) => ({
    ok: true,
    json: () => {
      leyendo()
      return esperarCancelacion(signal)
    },
  }))
  const pendiente = p.api.obtenerEquipos()
  await inicioLectura
  p.vencer()
  await assert.rejects(pendiente, /10 segundos/)
})

test('POST no envía id ni reintenta al agotar el tiempo', async () => {
  let llamadas = 0
  const p = preparar(async (_, init) => {
    llamadas += 1
    assert.equal(init.method, 'POST')
    assert.equal(init.headers['Content-Type'], 'application/json')
    assert.equal('id' in JSON.parse(init.body), false)
    return esperarCancelacion(init.signal)
  })
  const pendiente = p.api.crearPrestamo({ equipoId: 1, devuelto: false })
  p.vencer()
  await assert.rejects(pendiente, /servidor podría haber aplicado el cambio/)
  assert.equal(llamadas, 1)
})

test('PATCH y DELETE compensatorio también tienen límite de espera', async () => {
  for (const metodo of ['PATCH', 'DELETE']) {
    const p = preparar(async (_, init) => {
      assert.equal(init.method, metodo)
      return esperarCancelacion(init.signal)
    })
    const pendiente = metodo === 'PATCH'
      ? p.api.marcarPrestamoDevuelto(1)
      : p.api.eliminarPrestamoCompensado(1)
    p.vencer()
    await assert.rejects(pendiente, /10 segundos/)
    assert.equal(p.tieneTemporizador(), false)
  }
})
