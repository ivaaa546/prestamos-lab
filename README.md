# Préstamos Lab

Aplicación React + TypeScript para administrar el inventario y los préstamos del laboratorio. La API de desarrollo usa `json-server` y guarda sus datos en `db.json`.

## Requisitos

- Node.js 20.19+ o 22.12+ (requerido por Vite 8).
- npm.

## Instalación

```bash
npm install
```

Copia `.env.example` a `.env` (o crea el archivo manualmente) y configura la URL de la API:

```env
VITE_API_URL=http://localhost:3001
```

Si cambias `VITE_API_URL`, debes reiniciar Vite para que tome la nueva configuración.

## Ejecución

Abre dos terminales en la carpeta del proyecto.

Terminal 1, API REST:

```bash
npm run api
```

`json-server` escucha en `http://localhost:3001`. La base `db.json` contiene los datos iniciales y se modifica directamente con POST y PATCH; no se regenera al iniciar la API. No restaures la base mientras el servidor esté ejecutándose.

Terminal 2, frontend:

```bash
npm run dev
```

Abre la URL que informe Vite, normalmente `http://localhost:5173`.

## Verificación

```bash
npm run lint
npm run build
```

## API

- `GET /equipos`
- `GET /prestamos?devuelto=false`
- `POST /prestamos`
- `PATCH /equipos/:id`
- `PATCH /prestamos/:id`

Se usa `json-server` 0.17.4: al crear un registro sin `id`, asigna un id numérico que continúa la secuencia numérica existente. La versión 1 beta cambia el comportamiento de ids, por eso no se usa.

## Persistencia y limitación de atomicidad

Las mutaciones se guardan en `db.json` y persisten al reiniciar la página y el servidor. El registro y la devolución requieren dos peticiones independientes (préstamo y equipo); `json-server` no ofrece transacciones ni garantías de concurrencia entre ellas. La interfaz intenta compensar una petición parcial (borrando un préstamo recién creado o revirtiendo el indicador de devolución), vuelve a consultar la API e informa si la compensación también falla. Esto reduce inconsistencias, pero no promete atomicidad.

Durante una carga, un error de lectura o una inconsistencia entre equipos y préstamos, las operaciones quedan bloqueadas. Reintentar solo vuelve a consultar los datos, nunca repite un POST. Si la inconsistencia persiste, hay que revisar y corregir los registros en la API antes de reintentar; recargar no repara por sí solo la base. Una respuesta de escritura perdida puede dejar un resultado incierto y el uso simultáneo desde varias pestañas sigue sin estar protegido por transacciones.
