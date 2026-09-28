# SPEC 01 — Dashboard "Trip Time" con cuentas regresivas y collage de fondo

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-09-28
> **Objetivo:** Una página única que muestra, por cada viajera, la cuenta regresiva de salida y de llegada de cada tramo de vuelo sobre un collage animado de fotos.

---

## Por qué existe este spec

Es el primer spec del proyecto (scaffold `create-next-app` limpio). Fija las convenciones base: datos en archivos TS, imágenes locales en `public/`, shadcn solo donde aporta, y cero backend. La prioridad explícita del usuario es **el código más sencillo posible**.

---

## Alcance

**Entra:**

- Página `/` con título "Trip Time" y 3 cajas (Card de shadcn), una por persona.
- Título de cada caja = nombre de la persona.
- Cada caja muestra una fila por tramo: izquierda "Departure <destino>" con cuenta regresiva a la salida; derecha "Arrive <destino>" con cuenta regresiva a la llegada.
- Ana tiene 2 tramos (Colombia → China, China → Australia). María y Sonia tienen 1 tramo (Colombia → Australia).
- Formato del contador: `12d 04h 14m 09s`, actualizado cada segundo.
- Contador en cero: salida muestra `Departed! ✈️`; llegada muestra `Arrived! 🎉`. La caja sigue visible.
- Datos de viaje inventados (placeholder) en `data/trips.ts`.
- Collage de fondo: 6 figuras (círculo, blob, hexágono, rombo, rectángulo redondeado, estrella) hechas con CSS `clip-path` / `border-radius`, detrás de las cajas.
- Cada figura hace fundido (crossfade) a otra foto cada ~5 s, escalonadas entre sí, en loop infinito.
- Fotos en `public/collage/`. La lista se obtiene leyendo la carpeta y ordenando por nombre; se usan por **índice**, nunca por nombre fijo. Cualquier nombre de archivo sirve.
- Fotos placeholder: 12 imágenes aleatorias descargadas de internet (picsum.photos) a `public/collage/`.
- UI en inglés (como el boceto): "Trip Time", "Departure", "Arrive".
- Layout desktop: 2 cajas arriba, 1 centrada abajo, con leve inclinación (±2–3°).
- Layout móvil: cajas apiladas, sin inclinación, collage más tenue.
- `prefers-reduced-motion`: el collage no hace crossfade (fotos estáticas).

**Fuera de alcance (specs futuros):**

- Datos reales de vuelos y dónde persistirlos (el usuario los dará después; se decide en otro spec).
- Deploy (Vercel u otro). Por ahora solo local.
- Cloudinary u otro CDN de imágenes.
- Formulario/admin para editar viajes o subir fotos.
- Internacionalización / selector de idioma.
- Estado del vuelo en tiempo real (APIs de aerolíneas), retrasos, escalas.
- Tests automatizados (el proyecto no tiene runner).

---

## Modelo de datos

```ts
// data/trips.ts
export type Leg = {
  destination: string; // "China", "Australia"
  departure: string; // ISO 8601 con offset, hora local de la ciudad de salida. Ej: "2026-11-10T22:30:00-05:00"
  arrival: string; // ISO 8601 con offset, hora local del destino. Ej: "2026-11-12T06:15:00+08:00"
};

export type Traveler = {
  name: string; // "Ana Rairon"
  legs: Leg[]; // 1..n, en orden cronológico
};

export const travelers: Traveler[] = [
  /* Ana (2 legs), María Cruz (1), Sonia Tovar (1) */
];
```

```ts
// lib/countdown.ts
export type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};
// getRemaining(targetIso: string, now: number): Remaining  — función pura, done = target <= now
```

Convenciones:

- Las fechas **siempre** llevan offset explícito (`-05:00` Colombia, `+08:00` China, `+10:00/+11:00` Australia según fecha). `Date.parse` las resuelve sin librería de zonas horarias.
- Fechas placeholder: todas posteriores a 2026-09-28 para que los contadores estén corriendo.
- Imágenes del collage: `string[]` de rutas públicas (`/collage/<archivo>`), extensiones `.jpg .jpeg .png .webp .avif`, orden alfabético. La figura `i` en el ciclo `k` muestra `images[(i + k * 6) % images.length]`.

---

## Plan de implementación

1. **Instalar shadcn.** `npx shadcn@latest init` (Tailwind v4) y `npx shadcn@latest add card`. Crea `components.json`, `lib/utils.ts`, `components/ui/card.tsx` y variables en `app/globals.css`. Verificar: `npm run build` pasa.
2. **Datos placeholder.** Crear `data/trips.ts` con tipos y los 3 viajeros inventados (Ana con 2 tramos). Verificar: `npm run build` pasa.
3. **Lógica de cuenta regresiva.** Crear `lib/countdown.ts` con `getRemaining` pura y un formateador `12d 04h 14m 09s` (padding a 2 dígitos en h/m/s).
4. **Componente `Countdown`.** `components/countdown.tsx` (`"use client"`): recibe `target` y `doneLabel`; `setInterval` de 1 s; antes de montar muestra `--d --h --m --s` para evitar hydration mismatch. Verificar en `npm run dev`: el contador baja cada segundo.
5. **Componente `TripCard`.** `components/trip-card.tsx`: Card de shadcn con nombre como título y una fila por tramo (izq. Departure, der. Arrive, separador vertical). Fondo semitransparente + `backdrop-blur`.
6. **Página.** Reescribir `app/page.tsx`: título "Trip Time" y las 3 `TripCard` en grid (2 arriba, 1 centrada abajo en `md+`; apiladas en móvil), rotación leve solo en `md+`. Actualizar `metadata` en `app/layout.tsx` (title "Trip Time"). Verificar visualmente contra el boceto.
7. **Fotos placeholder.** Descargar 12 imágenes de `https://picsum.photos` a `public/collage/` (tamaño ~800px). Nombres arbitrarios.
8. **Lectura de la carpeta.** En `app/page.tsx` (Server Component) leer `public/collage/` con `fs.readdirSync`, filtrar extensiones de imagen, ordenar y mapear a `/collage/<archivo>`. Pasar el array al collage.
9. **Figuras estáticas.** `components/collage.tsx` (`"use client"`): 6 figuras con posición absoluta detrás del contenido (`-z-10`), cada una con su forma CSS (clases en `app/globals.css`) y su primera imagen vía `next/image` (`fill`, `object-cover`). Verificar: las 6 formas se ven detrás de las cajas.
10. **Crossfade en loop.** En `Collage`: un `setInterval` global de ~833 ms que avanza una figura a la vez (cada figura cambia cada ~5 s). Cada figura apila imagen actual y siguiente y cambia opacidad con `transition-opacity duration-1000`. Respetar `prefers-reduced-motion` (sin intervalo). Si hay 0 imágenes, figuras con gradiente de color; si hay menos de 6, se repiten.
11. **Ajuste móvil.** En pantallas `< md`: collage con opacidad reducida (~40%) y figuras reubicadas para no tapar lectura. Verificar en DevTools a 375 px.
12. **Cierre.** `npm run lint` y `npm run build` sin errores.

---

## Criterios de aceptación

- [ ] `npm run dev` abre `/` sin errores ni warnings de hydration en consola.
- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] Se ven el título "Trip Time" y exactamente 3 cajas: Ana Rairon, Maria Cruz, Sonia Tovar.
- [ ] La caja de Ana muestra 2 filas (China y Australia); las otras dos muestran 1 fila (Australia).
- [ ] Cada fila tiene "Departure <destino>" a la izquierda y "Arrive <destino>" a la derecha, cada una con contador `Xd HHh MMm SSs`.
- [ ] Los segundos de cada contador bajan en 1 cada segundo.
- [ ] Cambiando temporalmente una fecha en `data/trips.ts` a una pasada, la salida muestra `Departed! ✈️` y la llegada `Arrived! 🎉`.
- [ ] El contador de llegada respeta el offset: una llegada `…+08:00` equivale a 13 h menos que la misma hora con `-05:00`.
- [ ] Detrás de las cajas se ven 6 figuras con formas distintas, cada una con una foto.
- [ ] Cada figura cambia de foto con fundido aprox. cada 5 s, y nunca cambian todas a la vez.
- [ ] Añadir o quitar un archivo en `public/collage/` (con cualquier nombre) cambia las fotos del loop sin tocar código (tras recargar/reiniciar dev).
- [ ] Con `public/collage/` vacía la página carga sin errores y las figuras muestran un color.
- [ ] En desktop (≥ 768 px): 2 cajas arriba, 1 centrada abajo, levemente inclinadas.
- [ ] En móvil (375 px): cajas apiladas, rectas, sin scroll horizontal, texto legible sobre el collage.
- [ ] Con `prefers-reduced-motion: reduce` las fotos no rotan.

---

## Decisiones

- **Sí:** imágenes en `public/collage/` + `next/image`. Pocas fotos (~12–30), cero cuentas ni config, optimización incluida.
- **No:** Cloudinary. Solo compensa con muchas fotos o si hay que cambiarlas sin redeploy; añade cuenta y `remotePatterns`.
- **Sí:** leer la carpeta con `fs.readdirSync` y usar las fotos por índice. El usuario puede soltar sus fotos con cualquier nombre sin renombrar.
- **No:** lista hardcodeada de nombres de archivo. Obliga a renombrar o editar código.
- **Sí:** datos en `data/trips.ts`, inventados por ahora. Lo más simple; la persistencia real se decide en otro spec.
- **Sí:** fechas ISO con offset explícito. Resuelve zonas horarias Colombia/China/Australia sin librería (`date-fns-tz`, `luxon` descartadas).
- **Sí:** modelo `legs[]` por persona. Cubre a Ana (2 destinos) sin caso especial.
- **Sí:** formato `Xd HHh MMm SSs` con segundos. Pedido del usuario.
- **Sí:** mensaje al llegar a cero (`Departed! ✈️` / `Arrived! 🎉`). **No:** contar hacia arriba ni quedarse en `00`.
- **Sí:** UI en inglés como el boceto.
- **Sí:** 6 figuras, crossfade escalonado ~5 s con un único intervalo global. **No:** librerías de animación (framer-motion); CSS `transition-opacity` basta.
- **Sí:** formas con `clip-path` / `border-radius`. **No:** SVG masks; más código para el mismo resultado.
- **Sí:** shadcn solo `Card`. Nada más hace falta.
- **Sí:** inclinación leve (±2–3°) solo en desktop.
- **Sí:** placeholders de picsum.photos descargados localmente. **No:** hotlinking a picsum en runtime (requiere `remotePatterns` y red).
- **No (por ahora):** deploy. Solo local; otro spec.

---

## Riesgos

| Riesgo                                                                           | Mitigación                                                                               |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hydration mismatch por `Date.now()` distinto en server y cliente                 | `Countdown` muestra placeholder hasta montar; el tiempo solo se calcula en cliente.      |
| Offset incorrecto en Australia (horario de verano AEDT +11 vs AEST +10)          | Escribir el offset vigente en la fecha concreta del vuelo; comentado en `data/trips.ts`. |
| Next 16 difiere de lo conocido (APIs, `next/image`)                              | Consultar `node_modules/next/dist/docs/` antes de usar APIs, según `AGENTS.md`.          |
| shadcn init con Tailwind v4 / Next 16 modifica `globals.css` de forma inesperada | Revisar el diff de `globals.css` tras el paso 1; `npm run build` debe pasar.             |
| `readdirSync` se ejecuta en build: fotos nuevas no aparecen en prod sin rebuild  | Aceptado: en local `npm run dev` las recoge al recargar; deploy va en otro spec.         |
| Fotos pesadas ralentizan el fondo                                                | `next/image` con `sizes` adecuado; placeholders de ~800 px.                              |

---

## Lo que **no** está en este spec

- Datos reales de vuelos ni su persistencia definitiva.
- Deploy.
- Cloudinary / CDN externo.
- Admin, formularios o subida de fotos desde la UI.
- Estado de vuelo en tiempo real.
- Tests automatizados.

Cada uno, si llega, va en su propio spec.
