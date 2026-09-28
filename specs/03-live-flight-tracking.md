# SPEC 03 — Seguimiento en vivo de vuelos con AeroDataBox

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-28
> **Objetivo:** Consultar desde el servidor el estado real de cada vuelo en AeroDataBox (con caché de 30 min y solo cerca de cada vuelo) y mostrarlo como etiqueta, usando sus horas reales en los contadores.

---

## Por qué existe este spec

SPEC 02 cargó horarios programados, algunos marcados `// unconfirmed`. Este spec añade el estado real (retrasos, en el aire, aterrizado) sin gastar más cuota de la que da el plan gratuito. El plan Basic de AeroDataBox da **600 unidades/mes**. La consulta de estado por número cuesta **~2 unidades**, así que hay ~300 consultas al mes. Por eso la consulta es en el servidor, con caché, y solo en una ventana alrededor de cada vuelo.

Consecuencia importante: la página deja de ser 100% estática y necesita un servidor Node. El deploy futuro deberá ser en una plataforma con servidor (p. ej. Vercel), **no** GitHub Pages. El deploy sigue fuera de este spec.

---

## Alcance

**Entra:**

- API: **AeroDataBox vía RapidAPI**, plan Basic gratuito. El usuario crea la cuenta y la clave.
- Clave en `.env.local` como `AERODATABOX_API_KEY`. Solo se lee en el servidor; nunca llega al navegador.
- `.env.example` versionado con las variables (sin valores), con excepción `!.env.example` en `.gitignore`.
- Consulta por vuelo: `GET https://aerodatabox.p.rapidapi.com/flights/number/{número}/{fecha local de salida}`.
- Campo opcional `trackAs` en `Leg`: número del vuelo operador a consultar. QF4112 lleva `trackAs: "AA73"`.
- Tramos con `flight: "TBD"` no se consultan (BOG → HKG de Ana).
- **Ventana de consulta:** solo desde **6 h antes** de la salida programada hasta **2 h después** de la llegada programada. Fuera de la ventana no hay llamada ni etiqueta.
- **Caché de 30 min por vuelo** en el servidor (`fetch` con `next: { revalidate: 1800 }`). El consumo no depende de cuántas personas abran la página.
- La página se regenera como máximo cada 5 min (`export const revalidate = 300` en `app/page.tsx`).
- **Auto-refresh:** con la página abierta, el navegador pide la versión nueva cada 5 min (`router.refresh()`). No gasta cuota extra: usa la caché del servidor.
- **UI por vuelo:** etiqueta de estado (Badge de shadcn) junto al encabezado `LA575 · BOG → SCL`, en inglés:
  - `Scheduled`, `Boarding`, `Departed`, `In air`, `Landed`, `Delayed 40m`, `Cancelled`, `Diverted`.
  - `Delayed Xm` sustituye a `Scheduled`/`Boarding` cuando el retraso de salida es ≥ 15 min y el vuelo aún no salió.
- **Horas reales en contadores:** Departure, Arrive y Total usan la mejor hora conocida de la API (real > revisada/estimada > programada). Sin datos de la API, usan `data/trips.ts` como hoy.
- **Error o cuota agotada:** la página se ve igual que hoy (sin etiqueta, horas de `trips.ts`). El error solo se registra con `console.error` en el servidor.
- **Modo mock:** `TRACKING_MOCK=true` en `.env.local` usa respuestas falsas de `lib/tracking-mock.ts`, ignora la ventana y no llama a la API. Cubre los estados Delayed, In air, Landed, Cancelled y Scheduled.
- **Una prueba real** con la clave contra un vuelo del día (AA1130) para validar la clave y el formato de la respuesta.

**Fuera de alcance (specs futuros):**

- Deploy (Vercel u otra plataforma con servidor).
- Posición en mapa, altitud, velocidad.
- Puerta, terminal, cinta de equipaje.
- Notificaciones (push, email, WhatsApp).
- Historial de estados o guardado en base de datos.
- Seguimiento del vuelo real BOG → HKG de Ana (cuando tenga número entra solo cambiando `data/trips.ts`).
- Resolver el número del operador de LA575 (Wamos Air) si la API no lo encuentra como LA575.

---

## Modelo de datos

```ts
// data/trips.ts — campo nuevo
export type Leg = {
  // ...campos de SPEC 02
  trackAs?: string; // número a consultar en la API si difiere de `flight` (codeshare): "AA73"
};
```

```ts
// lib/tracking.ts
export type FlightState =
  | "Scheduled"
  | "Boarding"
  | "Departed"
  | "In air"
  | "Landed"
  | "Delayed"
  | "Cancelled"
  | "Diverted";

export type FlightStatus = {
  state: FlightState;
  departure: string; // ISO UTC, mejor hora conocida (real > revisada > programada)
  arrival: string; // ISO UTC, mejor hora conocida
  delayMinutes: number; // retraso de salida vs programada; 0 si a tiempo
};

// getFlightStatus(leg: Leg, now: number): Promise<FlightStatus | null>
// null = fuera de ventana, TBD, error o sin datos → la UI usa trips.ts
```

```bash
# .env.local (no versionado) / .env.example (versionado, sin valores)
AERODATABOX_API_KEY=
TRACKING_MOCK=false
```

Convenciones:

- La fecha de la URL es la fecha local de salida: los primeros 10 caracteres de `leg.departure` (`"2026-10-22"`).
- Cabeceras RapidAPI: `x-rapidapi-key: AERODATABOX_API_KEY`, `x-rapidapi-host: aerodatabox.p.rapidapi.com`.
- Si la respuesta trae varios vuelos, se elige el que coincide con `from` y `to` (IATA).
- El mapeo exacto de los estados de AeroDataBox a `FlightState` se fija en el paso 1 con la respuesta real.

---

## Plan de implementación

1. **Cuenta y prueba real.** El usuario crea cuenta en RapidAPI, se suscribe al plan Basic de AeroDataBox y pega la clave en `.env.local`. Crear `.env.example` y añadir `!.env.example` a `.gitignore`. Hacer **una** llamada con `curl` a AA1130 del día de hoy. Guardar un extracto de la respuesta como referencia del formato en el comentario de `lib/tracking.ts` (paso 3). Verificar: respuesta 200 con horas y estado.
2. **Datos y tipos.** Añadir `trackAs?` a `Leg` y `trackAs: "AA73"` a QF4112 en `data/trips.ts`. Crear `lib/tracking.ts` con los tipos `FlightState` y `FlightStatus`, y `getFlightStatus` que devuelve siempre `null`. Verificar: `npm run build` pasa.
3. **Consulta real.** Implementar `getFlightStatus`: descartar `TBD`, comprobar la ventana (6 h antes / 2 h después), llamar a AeroDataBox con `fetch` y `next: { revalidate: 1800 }`, elegir el vuelo por `from`/`to`, mapear estado y horas, calcular `delayMinutes`. Cualquier error → `console.error` y `null`. Consultar antes `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`.
4. **Modo mock.** Crear `lib/tracking-mock.ts` con una respuesta por vuelo: LA575 `Delayed` 40 min, LA809 `In air`, CX161 `Landed`, AA1130 `Cancelled`, resto `Scheduled`. Con `TRACKING_MOCK=true`, `getFlightStatus` usa el mock e ignora la ventana.
5. **Conectar la página.** En `app/page.tsx` obtener el estado de todos los tramos con `Promise.all`, pasarlo a cada `TripCard` y añadir `export const revalidate = 300`. En `TripCard`, los contadores Departure, Arrive y Total usan `status?.departure ?? leg.departure` y `status?.arrival ?? leg.arrival`.
6. **Etiqueta de estado.** `npx shadcn@latest add badge`. En `TripCard`, Badge junto al encabezado del vuelo con el texto de `FlightState` (`Delayed 40m` cuando aplica). Sin estado → sin Badge. Verificar con `TRACKING_MOCK=true` en desktop y móvil.
7. **Auto-refresh.** Crear `components/auto-refresh.tsx` (`"use client"`) que llama a `router.refresh()` cada 5 min. Montarlo en `app/page.tsx`.
8. **Cierre.** Con `TRACKING_MOCK=false` y la fecha de hoy (fuera de ventana), comprobar que no se hace ninguna llamada a la API. `npm run lint` y `npm run build` sin errores.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `AERODATABOX_API_KEY` no aparece en ningún archivo versionado ni en el JavaScript que recibe el navegador (buscar la clave en `.next/static`).
- [ ] `.env.example` está versionado y contiene `AERODATABOX_API_KEY=` y `TRACKING_MOCK=false`.
- [ ] La prueba real con `curl` a AA1130 del día devuelve 200 con estado y horas.
- [ ] QF4112 tiene `trackAs: "AA73"` en `data/trips.ts`.
- [ ] Con `TRACKING_MOCK=true`: LA575 muestra `Delayed 40m`, LA809 `In air`, CX161 `Landed`, AA1130 `Cancelled` y los demás vuelos con número `Scheduled`.
- [ ] Con `TRACKING_MOCK=true`, el contador Departure de LA575 cuenta hasta la hora programada + 40 min.
- [ ] Con `TRACKING_MOCK=true`, el Total de cada caja cuenta hasta la llegada del mock del último vuelo.
- [ ] El tramo `TBD · BOG → HKG` nunca muestra etiqueta ni provoca llamada.
- [ ] Con `TRACKING_MOCK=false` hoy (2026-09-28, fuera de toda ventana): ninguna llamada a AeroDataBox, ninguna etiqueta, contadores iguales a SPEC 02.
- [ ] Con una clave inválida y un vuelo dentro de ventana: la página carga sin errores visibles, sin etiqueta, con horas de `trips.ts`, y el servidor registra un `console.error`.
- [ ] Recargar la página varias veces dentro de 30 min no repite la llamada a la API para el mismo vuelo.
- [ ] Con la página abierta, cada 5 min se pide una versión nueva (petición visible en la pestaña Network), sin recargar la página completa (el collage no se reinicia).
- [ ] A 375 px las etiquetas no causan scroll horizontal.

---

## Decisiones

- **Sí:** AeroDataBox vía RapidAPI. HTTPS, consulta por número y fecha, plan gratis de 600 unidades/mes. **No:** AviationStack (100–500 llamadas, solo HTTP en plan gratis). **No:** FlightAware AeroAPI (pide tarjeta).
- **Sí:** consulta en el servidor de Next con la clave en `.env.local`. **No:** llamada desde el navegador; expondría la clave y cada visitante gastaría cuota.
- **Consecuencia:** el deploy futuro necesita servidor (Vercel u otra). GitHub Pages queda descartado para este proyecto.
- **Sí:** caché de 30 min por vuelo (decisión del usuario). **No:** 15 min ni 5 min; excederían la cuota.
- **Sí:** ventana de 6 h antes a 2 h después (~205 consultas ≈ 410 unidades). **No:** 12 h antes (~560 unidades, sin margen para pruebas).
- **Sí:** `fetch` con `next: { revalidate }`. El proyecto no usa `cacheComponents`, así que aplica el modelo de caché anterior de Next 16.
- **Sí:** auto-refresh cada 5 min con `router.refresh()`. **No:** una ruta `/api` más estado en el cliente; más código para lo mismo.
- **Sí:** `trackAs` para códigos compartidos (QF4112 → AA73). **No:** confiar en que la API resuelva el codeshare.
- **Sí:** etiqueta + horas reales en los contadores. **No:** solo etiqueta. **No:** puerta/terminal (otro spec si hace falta).
- **Sí:** ante errores, la página se ve como en SPEC 02 y el error va a los logs. **No:** texto "Tracking unavailable".
- **Sí:** modo mock + una prueba real. Los vuelos son del 22 al 28 oct; hoy no hay datos en vivo para probar.
- **Sí:** `Delayed Xm` solo si el retraso es ≥ 15 min. Retrasos menores son ruido.

---

## Riesgos

| Riesgo                                                                      | Mitigación                                                                                                            |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Agotar la cuota de 600 unidades (pruebas en dev, recargas)                  | Caché 30 min por vuelo, ventana 6 h/2 h, modo mock para desarrollo. Solo 1 prueba real.                               |
| El coste real del endpoint no es 2 unidades                                 | Verificar en el panel de RapidAPI tras la prueba del paso 1. Si cuesta más, reducir la ventana en un cambio del spec. |
| LA575 (operado por Wamos Air) no aparece como LA575 en la API               | Queda sin etiqueta y usa `trips.ts`. Si pasa, se añade `trackAs` con el número de Wamos en un cambio del spec.        |
| El formato de respuesta de AeroDataBox difiere de lo esperado               | Paso 1 valida el formato con una respuesta real antes de escribir el mapeo.                                           |
| Estados de AeroDataBox que no encajan en `FlightState`                      | Estados desconocidos → `null` (sin etiqueta) y `console.error` con el valor recibido.                                 |
| La caché de `fetch` en `npm run dev` se comporta distinto que en producción | Desarrollar con `TRACKING_MOCK=true`. Verificar la caché con `npm run build && npm run start`.                        |
| Horas de la API en UTC vs las de `trips.ts` con offset                      | Todo se compara con `Date.parse`, que entiende ambos formatos.                                                        |

---

## Lo que **no** está en este spec

- Deploy.
- Mapa, posición o altitud.
- Puerta, terminal, equipaje.
- Notificaciones.
- Historial o base de datos.
- Vuelo real BOG → HKG de Ana.

Cada uno, si llega, va en su propio spec.
