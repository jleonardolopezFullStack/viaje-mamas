# SPEC 06 — Fondos vivos (galaxia / amanecer) y collage visible en móvil

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 04
> **Fecha:** 2026-09-28
> **Objetivo:** Dar al tema oscuro un fondo galáctico y al claro un cielo de amanecer, con título y cajas a juego, y hacer que en móvil las fotos del collage se vean grandes y siempre visibles.

---

## Por qué existe este spec

Tras SPEC 04, ambos temas usan un fondo de color plano (`bg-background`). El usuario quiere algo más vivo: "galáctico" en oscuro y más colorido en claro.

Además, en móvil el collage no funciona bien. Las 6 figuras miden 35–45 vw, están repartidas a lo largo de una página de ~2600 px de alto y tienen 40% de opacidad. Casi todas quedan detrás de las cajas o cortadas por los bordes.

---

## Alcance

**Entra:**

- **Fondo oscuro galáctico (solo CSS):**
  - base casi negra azulada;
  - 2–3 nebulosas con degradados radiales en morado, índigo y magenta;
  - 2 capas de estrellas (puntos con `radial-gradient` en mosaico) con titileo lento (animación de opacidad, ciclo ≥ 4 s).
- **Fondo claro "cielo de amanecer":** degradado vertical celeste → lavanda → durazno/rosa.
- **Capa de fondo:** componente `components/sky-background.tsx`, fijo a la pantalla (`fixed inset-0`), detrás del collage y de las cajas. Cambia con el tema mediante la variante `dark:` (sin JS).
- **`prefers-reduced-motion`:** el titileo de estrellas se desactiva (estrellas estáticas).
- **Título "Trip Time":** texto con degradado. En oscuro: violeta → fucsia → celeste. En claro: celeste → violeta → rosa.
- **Cajas:** cristal con leve tinte y borde luminoso acorde al tema. En oscuro, fondo más translúcido con aro y sombra violeta suaves. En claro, fondo blanco translúcido con aro celeste suave. Sin cambios en su contenido ni en su layout.
- **Collage en móvil (< 768 px):**
  - fijo a la pantalla (`fixed`): siempre visible mientras se hace scroll;
  - figuras de **55–65 vw**, distribuidas en la pantalla visible (arriba, centro y abajo, a izquierda y derecha, asomando por los bordes);
  - opacidad **70%** (antes 40%).
- **Collage en desktop (≥ 768 px):** sin cambios (posición, tamaños, opacidad 100%).
- El brillo atenuado del collage en oscuro (`brightness(0.7)`, SPEC 04) se mantiene.

**Fuera de alcance (specs futuros):**

- Animación de movimiento (estrellas que se desplazan, parallax, canvas).
- Imágenes de galaxia o de cielo reales.
- Estrellas fugaces u otros efectos.
- Cambios de tipografía o del contenido de las cajas.
- Cambios en el collage de desktop.
- El aviso `loading="eager"` de la imagen LCP.

---

## Modelo de datos

Este spec no introduce estructuras de datos. Solo añade estilos.

Clases nuevas en `app/globals.css` (nombres fijos):

```css
.sky-dawn {
  /* degradado claro: celeste → lavanda → durazno/rosa */
}
.sky-galaxy {
  /* base oscura + nebulosas (radial-gradient) */
}
.stars {
  /* capa de estrellas en mosaico + animación twinkle */
}
.stars-far {
  /* segunda capa: estrellas más pequeñas, otro tamaño de mosaico y otro ritmo */
}
@keyframes twinkle {
  /* opacidad 0.4 ↔ 1 */
}
@media (prefers-reduced-motion: reduce) {
  .stars,
  .stars-far {
    animation: none;
  }
}
```

```tsx
// components/sky-background.tsx (Server Component, sin estado)
// <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
//   claro: .sky-dawn          (visible sin .dark)
//   oscuro: .sky-galaxy + .stars + .stars-far  (visibles con .dark)
// </div>
```

Orden de capas dentro de `<main>` (que ya tiene `isolate`): fondo `-z-20` < collage `-z-10` < título y cajas.

---

## Plan de implementación

1. **Clases de fondo.** Añadir a `app/globals.css` `.sky-dawn`, `.sky-galaxy`, `.stars`, `.stars-far`, `@keyframes twinkle` y la regla de `prefers-reduced-motion`. Verificar: `npm run build` pasa.
2. **Componente de fondo.** Crear `components/sky-background.tsx` y montarlo en `app/page.tsx` dentro de `<main>`, antes del collage. Verificar en `npm run dev` con el botón de tema: galaxia en oscuro, amanecer en claro, sin scroll horizontal.
3. **Título con degradado.** En `app/page.tsx`, aplicar al `<h1>` `bg-linear-to-r … bg-clip-text text-transparent` con los colores de cada tema (`dark:`). Verificar legibilidad en ambos temas.
4. **Cajas a juego.** En `components/trip-card.tsx`, ajustar las clases del `Card`: tinte, aro y sombra por tema. Solo clases; contenido y layout intactos. Verificar que contadores, etiquetas y textos secundarios siguen legibles en ambos temas.
5. **Collage en móvil.** En `components/collage.tsx`:
   - contenedor `fixed inset-0` en móvil y `md:absolute` en desktop;
   - opacidad `opacity-70 md:opacity-100`;
   - nuevas posiciones y tamaños base (55–65 vw) repartidos en la pantalla visible;
   - las clases `md:` de desktop quedan iguales.
     Verificar a 375 × 812: las 6 figuras se ven al cargar y siguen visibles al hacer scroll hasta el final.
6. **Revisión y cierre.** Revisar a 1400 px y 375 px en ambos temas. Verificar con `prefers-reduced-motion` que las estrellas no titilan. `npm run lint` y `npm run build` sin errores.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] En oscuro, el fondo muestra nebulosas de color (morado/índigo/magenta) y estrellas sobre base casi negra; no es un color plano.
- [ ] Las estrellas titilan (cambio de opacidad visible en ≤ 10 s) y con `prefers-reduced-motion: reduce` no tienen animación (`animation-name: none`).
- [ ] En claro, el fondo es un degradado vertical celeste → lavanda → durazno/rosa.
- [ ] El fondo cambia al instante con el botón de tema, sin recargar.
- [ ] El fondo queda fijo al hacer scroll (no se corta al final de la página) y no genera scroll horizontal.
- [ ] El título "Trip Time" se ve con degradado de color en ambos temas.
- [ ] Las cajas tienen un tinte/aro distinto en cada tema, y nombres, contadores, textos secundarios y etiquetas de estado siguen legibles en ambos.
- [ ] A 375 × 812, al cargar se ven las 6 figuras del collage, cada una de al menos 55% del ancho de pantalla (parcialmente fuera del borde se permite).
- [ ] A 375 px, al hacer scroll hasta el final, las figuras siguen visibles detrás de las cajas (collage `position: fixed`).
- [ ] A 375 px el collage tiene opacidad 0.7.
- [ ] A 1400 px el collage tiene las mismas posiciones, tamaños y opacidad que antes de este spec.
- [ ] En oscuro el collage mantiene `brightness(0.7)`.
- [ ] El crossfade del collage, los contadores y el botón de tema siguen funcionando.

---

## Decisiones

- **Sí:** galaxia solo con CSS (degradados radiales + estrellas en mosaico). Cero imágenes y cero JS. **No:** canvas animado (más código y batería). **No:** imagen real de galaxia (peso y compite con el collage).
- **Sí:** titileo suave de estrellas. **No:** movimiento o parallax.
- **Sí:** titileo desactivado con `prefers-reduced-motion`, igual que el crossfade (SPEC 01).
- **Sí:** amanecer (celeste → lavanda → durazno/rosa) en claro, a juego con la temática de viaje. **No:** aurora pastel. **No:** degradado de 2 colores.
- **Sí:** fondo en un componente propio fijo a la pantalla (`sky-background.tsx`). Separa estilos del collage y no se corta con el alto de la página.
- **Sí:** retoques suaves en título y cajas para que combinen. **No:** cambios de tipografía ni de contenido.
- **Sí:** collage fijo en móvil, más grande (55–65 vw) y con 70% de opacidad. Las fotos siempre se ven, a través de las cajas de cristal. **No:** franja de fotos entre las cajas (cambia más el layout). **No:** solo agrandar (seguirían detrás de las cajas en una página alta).
- **Sí:** desktop del collage sin cambios; el problema es solo en móvil.
- **Sí:** mantener `brightness(0.7)` en oscuro (decisión de SPEC 04). No se reabre.

---

## Riesgos

| Riesgo                                                                    | Mitigación                                                                                                                                    |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Menor legibilidad del texto sobre fondos más vivos                        | Las cajas mantienen el cristal con blur. El paso 4 y el criterio de legibilidad lo verifican en ambos temas.                                  |
| Rendimiento en móvil (blur + collage fijo + animación)                    | Solo se anima la opacidad (barato). Las capas `fixed` se componen en GPU. Si hay tirones, se quita el titileo en móvil en un cambio del spec. |
| `position: fixed` con `-z-*` dentro de `<main>` se ve encima de las cajas | `<main>` ya tiene `isolate`. Orden explícito: fondo `-z-20` < collage `-z-10` < contenido.                                                    |
| Las figuras grandes en móvil tapan demasiado el fondo galáctico           | Opacidad 70% y figuras asomando por los bordes. Se ajusta en el paso 5 viendo la pantalla.                                                    |
| El título con `text-transparent` desaparece si falla `bg-clip-text`       | Soportado por todos los navegadores actuales. Se verifica en el paso 3.                                                                       |

---

## Lo que **no** está en este spec

- Estrellas en movimiento, parallax o canvas.
- Imágenes reales de fondo.
- Estrellas fugaces.
- Cambios de tipografía o contenido.
- Cambios del collage en desktop.

Cada uno, si llega, va en su propio spec.
