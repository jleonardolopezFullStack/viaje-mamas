# SPEC 04 — Tema oscuro por defecto con botón para cambiar a claro

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-28
> **Objetivo:** Mostrar el dashboard en tema oscuro por defecto, con un botón redondo fijo abajo a la derecha que alterna entre oscuro y claro y recuerda la elección en el navegador.

---

## Por qué existe este spec

shadcn (SPEC 01) ya dejó definidas las variables de color de ambos temas en `app/globals.css` (`:root` para claro y `.dark` para oscuro). También configuró la variante `dark` de Tailwind como `&:is(.dark *)`. Pero nada añade la clase `dark` al `<html>`, así que la página siempre se ve en claro. Este spec la activa por defecto y añade el botón para cambiarla.

---

## Alcance

**Entra:**

- **Tema por defecto oscuro:** el `<html>` se renderiza con la clase `dark`.
- **Botón de tema:**
  - redondo, con Button de shadcn (`variant="outline"`, `size="icon"`) e íconos de `lucide-react`;
  - fijo abajo a la derecha (`fixed bottom-4 right-4`), encima del resto de la página;
  - en oscuro muestra `Sun` (pasar a claro); en claro muestra `Moon` (pasar a oscuro);
  - `aria-label`: `Switch to light theme` / `Switch to dark theme`.
- **Persistencia:** la elección se guarda en `localStorage` con la clave `theme` (`"dark"` | `"light"`). Sin librerías.
- **Sin parpadeo al cargar:** un script mínimo en `<head>` lee `localStorage.theme` antes de pintar. Si vale `"light"`, quita la clase `dark`. Si `localStorage` no está disponible, se queda en oscuro.
- **Cambio instantáneo:** sin animación al cambiar de tema.
- **Collage en oscuro:** fotos atenuadas al 70% de brillo (`dark:brightness-[.7]` en el contenedor del collage). En claro, sin cambios.
- Revisión visual del tema oscuro: título, cajas de cristal, textos secundarios, etiquetas de estado (SPEC 03) y totales, en desktop y móvil.

**Fuera de alcance (specs futuros):**

- Opción "según el sistema" (`prefers-color-scheme`) o toggle de 3 estados.
- Animación o fundido al cambiar de tema.
- Paletas de color personalizadas o rediseño de colores de marca.
- Guardar el tema en el servidor o en cookies.
- Deploy.

---

## Modelo de datos

```ts
// localStorage
// key:   "theme"
// value: "dark" | "light"   (ausente = "dark")
```

```ts
// components/theme-toggle.tsx
type Theme = "dark" | "light";
// Fuente de verdad: la clase "dark" en document.documentElement.
// Al hacer clic: alterna la clase y guarda el nuevo valor en localStorage.theme.
```

Convenciones:

- Todo acceso a `localStorage` va en `try/catch`. Si falla, el tema funciona pero no se recuerda.
- El `<html>` lleva `suppressHydrationWarning`, porque el script de `<head>` puede cambiar su clase antes de que React hidrate.

---

## Plan de implementación

1. **Oscuro por defecto.** En `app/layout.tsx` añadir `dark` a la clase del `<html>` y `suppressHydrationWarning`. Verificar en `npm run dev`: la página se ve en oscuro.
2. **Collage atenuado.** En `components/collage.tsx` añadir `dark:brightness-[.7]` al contenedor. Verificar que las fotos se ven más tenues en oscuro.
3. **Script anti-parpadeo.** En `app/layout.tsx` añadir en `<head>` un `<script>` en línea que lea `localStorage.theme` y quite `dark` si vale `"light"`, envuelto en `try/catch`. Revisar en `node_modules/next/dist/docs/` la forma recomendada de scripts en línea en el layout. Verificar: con `localStorage.theme = "light"` y recarga, la página abre en claro sin mostrar el oscuro antes.
4. **Componente del botón.** `npx shadcn@latest add button`. Crear `components/theme-toggle.tsx` (`"use client"`): lee el tema de la clase del `<html>` sin errores de hidratación (`useSyncExternalStore`), alterna la clase, guarda en `localStorage` y muestra `Sun`/`Moon` con su `aria-label`.
5. **Montar el botón.** Renderizar `<ThemeToggle />` en `app/layout.tsx`, fijo abajo a la derecha. Verificar a 1400 px y 375 px que no tapa las cajas ni el contenido. Revisar el aspecto del oscuro: título, cajas, textos secundarios, etiquetas y totales legibles.
6. **Cierre.** `npm run lint` y `npm run build` sin errores.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] Con `localStorage` vacío, la página abre en oscuro (el `<html>` tiene la clase `dark`).
- [ ] El botón está fijo abajo a la derecha y sigue visible al hacer scroll.
- [ ] En oscuro el botón muestra el ícono de sol y `aria-label="Switch to light theme"`. En claro muestra la luna y `aria-label="Switch to dark theme"`.
- [ ] Un clic cambia el tema al instante, sin recargar la página y sin reiniciar el collage ni los contadores.
- [ ] Tras cambiar a claro y recargar, la página abre en claro, y `localStorage.theme` vale `"light"`.
- [ ] Al recargar en claro no se ve un destello del tema oscuro.
- [ ] En oscuro las fotos del collage tienen `brightness(0.7)`; en claro, brillo normal.
- [ ] En oscuro, el título, los nombres, los contadores, los textos secundarios y las etiquetas de estado son legibles sobre sus fondos.
- [ ] A 375 px el botón no tapa texto de las cajas y no hay scroll horizontal.
- [ ] La consola no muestra errores ni avisos de hidratación en ninguno de los dos temas.
- [ ] Con `localStorage` bloqueado (p. ej. `localStorage.getItem` lanzando error), la página abre en oscuro y el botón sigue alternando el tema.

---

## Decisiones

- **Sí:** oscuro por defecto. Es lo que pidió el usuario. **No:** seguir el sistema. **No:** claro por defecto.
- **Sí:** toggle de 2 estados (oscuro/claro). **No:** 3 estados con "sistema"; más complejidad sin pedido.
- **Sí:** `localStorage` + script en `<head>`, sin librerías. **No:** `next-themes`; hace lo mismo con una dependencia más.
- **Sí:** clase `dark` en `<html>`. Es lo que ya espera la configuración de shadcn (`@custom-variant dark (&:is(.dark *))`).
- **Sí:** abajo a la derecha. Abajo a la izquierda lo ocupa el indicador de Next en desarrollo. Arriba a la derecha en móvil choca con el título y el hexágono del collage.
- **Sí:** botón redondo con íconos sol/luna (shadcn Button + `lucide-react`, que ya está instalado). **No:** pastilla con texto.
- **Sí:** cambio instantáneo. **No:** fundido; puede verse raro con el blur de las cajas y el collage.
- **Sí:** collage atenuado al 70% en oscuro, para que las fotos no deslumbren y las cajas resalten.

---

## Riesgos

| Riesgo                                                              | Mitigación                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Destello de tema incorrecto al cargar (FOUC)                        | Script en `<head>` que corre antes de pintar. El HTML del servidor ya viene en oscuro, que es el valor por defecto.                   |
| Error de hidratación por la clase del `<html>` o el ícono del botón | `suppressHydrationWarning` en `<html>`. El botón usa `useSyncExternalStore` con valor de servidor `"dark"`.                           |
| `localStorage` no disponible (modo privado, bloqueado)              | `try/catch`. El tema cambia pero no se recuerda; por defecto queda en oscuro.                                                         |
| Algún color fijo (no token) se ve mal en oscuro                     | El paso 5 revisa todo en oscuro. Hoy el único color fijo es el degradado cielo→rosa de las formas sin foto, aceptable en ambos temas. |
| El botón tapa contenido en móvil                                    | Paso 5 verifica a 375 px. El contenido tiene padding inferior suficiente; si no, se añade padding al final de `<main>`.               |

---

## Lo que **no** está en este spec

- Tema según el sistema o toggle de 3 estados.
- Animación de cambio de tema.
- Paletas personalizadas.
- Tema guardado en servidor o cookies.
- Deploy.

Cada uno, si llega, va en su propio spec.
