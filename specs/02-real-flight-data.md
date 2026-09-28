# SPEC 02 — Datos reales de vuelos por viajera

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-28
> **Objetivo:** Reemplazar los datos inventados por los vuelos reales de cada viajera (número, aerolínea, ruta y horarios) y mostrar cada vuelo como una fila en su caja.

---

## Por qué existe este spec

El usuario pidió datos reales y seguimiento en vivo. Se dividió en dos specs. Este (02) solo carga los vuelos reales y adapta la caja. El seguimiento con API gratuita va en SPEC 03, porque implica elegir API, manejar una clave secreta y decidir dónde corre (servidor). El deploy sigue fuera, en un spec futuro.

---

## Alcance

**Entra:**

- Nuevo modelo de tramo en `data/trips.ts`: número de vuelo, aerolínea, operador opcional, origen y destino en código IATA, salida y llegada.
- Vuelos reales dados por el usuario:
  - **Sonia Tovar:** LA575 (operado por Wamos Air) BOG → SCL, sale 22 oct 2026 06:35. LA809 (LATAM) SCL → SYD, sale 23 oct 2026 02:30, llega 24 oct 2026 07:50.
  - **Ana Rairan:** tramo inventado BOG → HKG (número `TBD`, sale unos días antes del 24 oct). CX161 (Cathay Pacific) HKG → SYD, sale 24 oct 2026 21:35 (corregido según tiquete; antes 23 oct 09:40), duración 9h05.
  - **Maria Cruz:** AA1130 (American Airlines) BOG → MIA, sale 26 oct 2026 06:40. AA1115 MIA → LAX, sale 26 oct 2026 13:45. QF4112 LAX → SYD, sale 26 oct 2026 23:45.
- Horas de llegada que faltan (LA575, CX161, AA1130, AA1115, QF4112): se buscan en horarios públicos durante la implementación.
- Operador real de QF4112 (código compartido): se busca y se guarda en `operatedBy`.
- Datos no confirmados (tramo inventado de Ana y llegadas buscadas) marcados **solo en código** con el comentario `// unconfirmed`.
- `TripCard` muestra un bloque por vuelo:
  - Encabezado `LA575 · BOG → SCL`.
  - Debajo, en texto pequeño, `Operated by Wamos Air` (solo si `operatedBy` existe).
  - Debajo, dos columnas "Departure" / "Arrive" con sus contadores (lógica de SPEC 01 sin cambios).
- Se muestran **todos** los vuelos de cada viajera (Maria: 3, Sonia: 2, Ana: 2).
- Nombre de Ana corregido a "Ana Rairan" (ya cambiado a mano en `data/trips.ts`).
- Sección **Total** al final de cada caja, en negrilla: a la izquierda `Total`, en frente la cuenta regresiva hasta la llegada del último vuelo (Sídney). Al llegar a cero muestra `Arrived to Australia 🎉`. (Añadido tras implementar los pasos 1–7.)

**Fuera de alcance (specs futuros):**

- Seguimiento en vivo con API (estado, retrasos, hora real, puerta) → SPEC 03.
- Deploy (GitHub Pages / Vercel) → spec futuro.
- Datos reales del vuelo Bogotá → Hong Kong de Ana (se cargarán cuando el usuario los tenga).
- Indicador visual de dato "estimado" en la UI.
- Nombres de ciudad o aeropuerto completos en la UI.
- Tiempo de escala entre vuelos.

---

## Modelo de datos

```ts
// data/trips.ts
export type Leg = {
  flight: string; // "LA575", "TBD" si aún no se conoce
  airline: string; // aerolínea que vende el vuelo: "LATAM", "Cathay Pacific", "American Airlines", "Qantas"
  operatedBy?: string; // solo si opera otra aerolínea: "Wamos Air"
  from: string; // IATA origen: "BOG"
  to: string; // IATA destino: "SCL"
  departure: string; // ISO 8601 con offset, hora local del origen
  arrival: string; // ISO 8601 con offset, hora local del destino
};

export type Traveler = {
  name: string;
  legs: Leg[]; // orden cronológico
};
```

Se elimina el campo `destination` de SPEC 01. Lo reemplazan `from` y `to`.

Offsets vigentes en las fechas de los vuelos (octubre 2026):

| Aeropuerto                       | Offset   |
| -------------------------------- | -------- |
| BOG Bogotá                       | `-05:00` |
| SCL Santiago (horario de verano) | `-03:00` |
| HKG Hong Kong                    | `+08:00` |
| MIA Miami (EDT)                  | `-04:00` |
| LAX Los Ángeles (PDT)            | `-07:00` |
| SYD Sídney (AEDT)                | `+11:00` |

Ejemplo real:

```ts
{ flight: "LA809", airline: "LATAM", from: "SCL", to: "SYD",
  departure: "2026-10-23T02:30:00-03:00", arrival: "2026-10-24T07:50:00+11:00" }
```

---

## Plan de implementación

1. **Nuevo modelo con datos actuales.** Cambiar `Leg` en `data/trips.ts` al modelo nuevo y migrar los datos de ejemplo existentes (`flight: "TBD"`, IATA inventados). Ajustar `TripCard` para compilar usando `to` en vez de `destination`. Verificar: `npm run build` pasa.
2. **Nuevo diseño de fila en `TripCard`.** Un bloque por vuelo con encabezado `FLIGHT · FROM → TO`, la línea `Operated by X` si existe `operatedBy`, y las columnas Departure / Arrive debajo. Verificar en `npm run dev` con los datos de ejemplo.
3. **Datos dados por el usuario.** Cargar en `data/trips.ts` los números, aerolíneas, operador de LA575, orígenes, destinos y horas de salida de los 7 vuelos. También la llegada de LA809. Las llegadas que faltan quedan provisionalmente con un valor aproximado y marcadas `// unconfirmed`.
4. **Llegadas faltantes.** Buscar en horarios públicos la llegada programada de LA575, CX161, AA1130, AA1115 y QF4112, y el operador de QF4112. Reemplazar los valores aproximados. Mantener `// unconfirmed` y anotar la fuente en el comentario.
5. **Tramo inventado de Ana.** BOG → HKG con `flight: "TBD"`, salida y llegada inventadas y coherentes (llega a HKG antes del 24 oct 21:35), todo marcado `// unconfirmed`.
6. **Ajuste visual.** Revisar a 1400 px y 375 px que la caja de Maria (3 vuelos) no rompa el layout: sin scroll horizontal y con las cajas legibles. Ajustar espaciados si hace falta.
7. **Cierre.** `npm run lint` y `npm run build` sin errores.
8. **Sección Total.** En `TripCard`, bajo el último vuelo y separada por una línea, una fila en negrilla `Total` + `Countdown` con `target` = `arrival` del último tramo y `doneLabel="Arrived to Australia 🎉"`. Verificar en desktop y móvil; `npm run lint` y `npm run build` sin errores.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `data/trips.ts` ya no contiene el campo `destination`. Todos los tramos tienen `flight`, `airline`, `from`, `to`, `departure` y `arrival`.
- [ ] La caja de Sonia muestra 2 vuelos: `LA575 · BOG → SCL` con `Operated by Wamos Air`, y `LA809 · SCL → SYD`.
- [ ] La caja de Ana muestra 2 vuelos: `TBD · BOG → HKG` y `CX161 · HKG → SYD`.
- [ ] La caja de Maria muestra 3 vuelos: `AA1130 · BOG → MIA`, `AA1115 · MIA → LAX` y `QF4112 · LAX → SYD` (con su `Operated by …` si el operador real no es Qantas).
- [ ] La salida de LA575 es `2026-10-22T06:35:00-05:00`.
- [ ] LA809 sale `2026-10-23T02:30:00-03:00` y llega `2026-10-24T07:50:00+11:00`.
- [ ] CX161 sale `2026-10-24T21:35:00+08:00` y llega `2026-10-25T09:40:00+11:00` (9h05 según tiquete).
- [ ] AA1130 sale `2026-10-26T06:40:00-05:00`, AA1115 sale `2026-10-26T13:45:00-04:00` y QF4112 sale `2026-10-26T23:45:00-07:00`.
- [ ] En cada viajera, la llegada de cada vuelo es anterior a la salida del siguiente.
- [ ] Todos los valores no dados por el usuario llevan el comentario `// unconfirmed` en `data/trips.ts`.
- [ ] Ningún indicador de "unconfirmed" o "estimated" aparece en la UI.
- [ ] A 1400 px y a 375 px no hay scroll horizontal y todas las filas de vuelo son legibles.
- [ ] Los contadores siguen bajando cada segundo, y los mensajes `Departed! ✈️` / `Arrived! 🎉` siguen funcionando (lógica de SPEC 01 intacta).
- [ ] Cada caja termina con una fila en negrilla `Total` y, en frente, la cuenta regresiva hasta la llegada del último vuelo (Ana: CX161, Maria: QF4112, Sonia: LA809).
- [ ] Con la llegada del último vuelo en el pasado, la fila Total muestra `Arrived to Australia 🎉`.

---

## Decisiones

- **Sí:** dividir en SPEC 02 (datos) y SPEC 03 (tracking). El tracking añade API, clave secreta y servidor; mezclarlo aumenta el riesgo.
- **No:** deploy en este spec. El usuario lo deja para un spec futuro.
- **Sí:** mostrar todos los vuelos de cada viajera. **No:** mostrar solo la salida desde Colombia y la llegada final.
- **Sí:** encabezado `LA575 · BOG → SCL`. Compacto; cabe con 3 vuelos. **No:** nombres de ciudad completos.
- **Sí:** mostrar `Operated by X` en texto pequeño cuando otra aerolínea opera el vuelo.
- **Sí:** guardar `airline` aunque no se muestre. SPEC 03 probablemente lo necesite para consultar la API.
- **Sí:** buscar las llegadas faltantes en horarios públicos. **No:** estimar por duración típica (menos preciso), ni esperar a que el usuario las dé.
- **Sí:** marcar datos no confirmados solo en código (`// unconfirmed`). La UI queda limpia.
- **Sí:** llegada de LA809 el 24 oct 07:50 (no el 25). Cuadra con ~15 h de vuelo SCL → SYD cruzando la línea de cambio de fecha.
- **Sí:** tramo BOG → HKG de Ana inventado con `flight: "TBD"`, hasta tener los datos reales.
- **Sí:** mantener fechas ISO con offset explícito (convención de SPEC 01). Los offsets de octubre 2026 están documentados arriba.
- **Sí:** sección Total dentro de SPEC 02 (decisión del usuario) en vez de un spec nuevo. Cambio pequeño que reutiliza `Countdown`.
- **Sí:** el Total usa la llegada del último tramo; todas las viajeras terminan en SYD. **No:** buscar el tramo con destino SYD (innecesario hoy).
- **Sí:** CX161 corregido a 24 oct 21:35 según tiquete (el usuario confirmó que 09:40 era un error). Llegada calculada con la duración del tiquete (9h05) y Sídney en AEDT (+11, desde el 4 oct 2026): 25 oct 09:40.

---

## Riesgos

| Riesgo                                                                  | Mitigación                                                                                                  |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Horarios publicados cambian antes de octubre                            | Marcados `// unconfirmed` con su fuente. SPEC 03 (tracking) dará la hora real.                              |
| Offset equivocado por horario de verano (Chile, EE. UU., Sídney)        | Tabla de offsets en este spec. Criterio: la llegada de cada vuelo es anterior a la salida del siguiente.    |
| La caja de Maria (3 vuelos) desequilibra el layout de SPEC 01           | Paso 6 revisa desktop y móvil. Se ajusta solo el espaciado, no el layout.                                   |
| QF4112 es código compartido; el número del operador real puede ser otro | Se guarda el operador en `operatedBy`. El número del operador se resuelve en SPEC 03 si la API lo necesita. |
| No se encuentra un horario público para algún vuelo                     | Queda el valor aproximado con `// unconfirmed` y se avisa al usuario.                                       |

---

## Lo que **no** está en este spec

- Seguimiento en vivo por API → SPEC 03.
- Deploy.
- Datos reales del vuelo Bogotá → Hong Kong de Ana.
- Indicadores visuales de datos no confirmados.
- Tiempos de escala.

Cada uno, si llega, va en su propio spec.
