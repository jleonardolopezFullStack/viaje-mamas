# SPEC 07 — Vuelos reales de Ana (Bogotá → París → Hong Kong → Sídney)

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 03
> **Fecha:** 2026-10-04
> **Objetivo:** Reemplazar el tramo inventado BOG → HKG de Ana por sus dos vuelos reales de Air France y corregir la fecha del CX161.

---

## Por qué existe este spec

En SPEC 02, el tramo de Ana de Bogotá a Hong Kong quedó inventado (`flight: "TBD"`), a la espera de los datos reales. El usuario ya los tiene. Además, el CX161 quedó un día corrido: sale el 23 oct y llega el sábado 24 oct, no el 24 → 25.

---

## Alcance

**Entra:**

- En `data/trips.ts`, cambiar los tramos de Ana:
  - **AF0435** (Air France) BOG → CDG: sale dom 11 oct 2026 21:35, llega lun 12 oct 2026 15:00.
  - **AF0188** (Air France) CDG → HKG: sale lun 12 oct 2026 23:30, llega mar 13 oct 2026 17:40.
  - **CX161** (Cathay Pacific) HKG → SYD: sale vie 23 oct 2026 21:35, llega sáb 24 oct 2026 09:40.
- Eliminar el tramo `TBD` de Ana y sus comentarios `// unconfirmed`.
- Añadir CDG al comentario de offsets al inicio de `data/trips.ts`.
- La caja de Ana pasa a mostrar 3 vuelos, con el mismo diseño que la de Maria. No hay cambios en la UI.
- La tarjeta muestra `AF0435` / `AF0188`. El seguimiento de SPEC 03 consulta `AF435` / `AF188` vía `trackAs`, por si AeroDataBox no reconoce el cero inicial.

**Fuera de alcance (specs futuros):**

- Mostrar en la UI la estadía de Ana en Hong Kong (13 → 23 oct).
- Editar `specs/02-real-flight-data.md` (ver Decisiones).
- Tiempos de escala entre vuelos.
- Cambios en los vuelos de Maria o Sonia.
- Nuevos estados en el modo mock (`lib/tracking-mock.ts`).

---

## Modelo de datos

Este spec no introduce estructuras nuevas. Reutiliza `Leg` y `Traveler` de SPEC 02 (con `trackAs` de SPEC 03).

Offset nuevo:

| Aeropuerto                     | Offset   |
| ------------------------------ | -------- |
| CDG París (CEST, hasta 25 oct) | `+02:00` |

Tramos de Ana:

```ts
// data/trips.ts — Ana Rairan
{ flight: "AF0435", airline: "Air France", trackAs: "AF435", from: "BOG", to: "CDG",
  departure: "2026-10-11T21:35:00-05:00", arrival: "2026-10-12T15:00:00+02:00" }, // 10h25
{ flight: "AF0188", airline: "Air France", trackAs: "AF188", from: "CDG", to: "HKG",
  departure: "2026-10-12T23:30:00+02:00", arrival: "2026-10-13T17:40:00+08:00" }, // 12h10
{ flight: "CX161", airline: "Cathay Pacific", from: "HKG", to: "SYD",
  departure: "2026-10-23T21:35:00+08:00", arrival: "2026-10-24T09:40:00+11:00" }, // 9h05
```

Todos los valores los dio el usuario. Ninguno lleva `// unconfirmed`.

---

## Plan de implementación

1. **Vuelos reales de Ana.** En `data/trips.ts`, reemplazar el tramo `TBD` por AF0435 y AF0188 (con `trackAs: "AF435"` / `"AF188"`), y corregir las fechas del CX161 (quitar el comentario de cálculo de llegada del 25 oct). Añadir `CDG +02:00 (CEST)` al comentario de offsets. Verificar en `npm run dev`: la caja de Ana muestra `AF0435 · BOG → CDG`, `AF0188 · CDG → HKG` y `CX161 · HKG → SYD`.
2. **Revisión visual y seguimiento.** Revisar la caja de Ana a 1400 px y 375 px en ambos temas. Con `TRACKING_MOCK=true`, comprobar que los dos vuelos AF muestran la etiqueta `Scheduled` y que CX161 sigue mostrando `Landed`. Dejar `TRACKING_MOCK=false` al terminar.
3. **Cierre.** `npm run lint` y `npm run build` sin errores.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `data/trips.ts` ya no contiene ningún tramo con `flight: "TBD"`.
- [ ] La caja de Ana muestra 3 vuelos, en este orden: `AF0435 · BOG → CDG`, `AF0188 · CDG → HKG`, `CX161 · HKG → SYD`.
- [ ] AF0435 sale `2026-10-11T21:35:00-05:00` y llega `2026-10-12T15:00:00+02:00`.
- [ ] AF0188 sale `2026-10-12T23:30:00+02:00` y llega `2026-10-13T17:40:00+08:00`.
- [ ] CX161 sale `2026-10-23T21:35:00+08:00` y llega `2026-10-24T09:40:00+11:00`.
- [ ] AF0435 tiene `trackAs: "AF435"` y AF0188 tiene `trackAs: "AF188"`. La tarjeta muestra `AF0435` / `AF0188`.
- [ ] Ninguno de los 3 tramos de Ana lleva el comentario `// unconfirmed`.
- [ ] El comentario de offsets de `data/trips.ts` incluye CDG `+02:00`.
- [ ] La fila Total de Ana cuenta hasta `2026-10-24T09:40:00+11:00`.
- [ ] A 1400 px y a 375 px la caja de Ana no tiene scroll horizontal y sus 3 filas se leen bien.
- [ ] Con `TRACKING_MOCK=true`, AF0435 y AF0188 muestran `Scheduled`, y CX161 muestra `Landed`.
- [ ] `.env.local` queda con `TRACKING_MOCK=false`.

---

## Decisiones

- **Sí:** número de vuelo tal como aparece en el tiquete (`AF0435`, `AF0188`), por decisión del usuario. **No:** `AF435` / `AF188`, aunque sería el formato de los demás vuelos.
- **Sí:** `trackAs: "AF435"` / `"AF188"` siempre puesto, por si AeroDataBox no reconoce el cero inicial. Evita el riesgo sin código nuevo; `trackAs` ya existe desde SPEC 03. **No:** reintentar con y sin cero en `lib/tracking.ts`; gasta cuota y añade lógica.
- **Sí:** AF0188 sale el 12 oct, mismo día que llega el AF0435 (escala de 8h30 en CDG). Confirmado por el usuario.
- **Sí:** CX161 corregido a 23 oct 21:35 → sáb 24 oct 09:40. Confirmado por el usuario. Reemplaza la corrección de SPEC 02 (24 → 25 oct); la duración de 9h05 se mantiene.
- **Sí:** CDG con `+02:00`. Francia sigue en horario de verano hasta el 25 oct 2026.
- **No:** mostrar la estadía en Hong Kong. La caja muestra solo los vuelos, como la de Maria.
- **No:** editar `specs/02-real-flight-data.md`. Es un registro histórico ya implementado; este spec deja constancia del cambio.
- **No:** añadir los vuelos AF al mock. Sin entrada, el mock los muestra como `Scheduled`, que basta para revisar la UI.

---

## Riesgos

| Riesgo                                                                             | Mitigación                                                                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Los dos vuelos AF suman consultas a la cuota mensual de AeroDataBox (600 unidades) | Ventanas de ~18 h y ~20 h con caché de 30 min: como máximo ~80 consultas (~160 unidades). Cabe en la cuota. |
| El AF0435 sale el 11 oct, antes que todos los demás vuelos                         | Ningún cambio de lógica: los contadores ya funcionan por tramo.                                             |

---

## Lo que **no** está en este spec

- Estadía en Hong Kong en la UI.
- Tiempos de escala.
- Cambios en los vuelos de Maria o Sonia.
- Cambios en el modo mock.

Cada uno, si llega, va en su propio spec.
