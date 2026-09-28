# SPEC 05 — Deploy en Vercel conectado a GitHub

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 03, SPEC 04
> **Fecha:** 2026-09-28
> **Objetivo:** Publicar el dashboard en `viaje-mamas.vercel.app` conectado al repositorio de GitHub, de forma que cada push a `master` se publique solo.

---

## Por qué existe este spec

SPEC 03 movió la consulta de vuelos al servidor, con la clave en una variable de entorno y la página regenerándose cada 5 min. Por eso GitHub Pages quedó descartado y el deploy va en una plataforma con servidor: Vercel.

Hay un riesgo técnico concreto. En Vercel la página se regenera dentro de una función del servidor, y los archivos de `public/` **no** se incluyen en esa función (se sirven desde el CDN). `getCollageImages()` (`fs.readdirSync("public/collage")`, SPEC 01) devolvería `[]` tras la primera regeneración y el collage quedaría vacío. Este spec lo evita incluyendo esa carpeta en la función.

**Requisito previo:** SPEC 04 debe estar commiteado y fusionado en `master` antes de empezar.

---

## Alcance

**Entra:**

- **Conexión:** proyecto de Vercel creado desde el dashboard ("Import Git Repository") con el repo `jleonardolopezFullStack/viaje-mamas`. Lo hace el usuario con su cuenta.
- **Nombre del proyecto:** `viaje-mamas`. La URL es `viaje-mamas.vercel.app` o la que Vercel asigne si está ocupada.
- **Deploy automático:**
  - cada push a `master` publica en producción (~1–2 min);
  - cada rama o PR tiene su URL de preview.
- **Cómo se actualizan los datos:** editar `data/trips.ts` o `public/collage/` y hacer push a `master`. El seguimiento en vivo (SPEC 03) se actualiza solo, cada ≤ 30 min por vuelo.
- **Variables de entorno en Vercel:**
  - Production: `AERODATABOX_API_KEY` (la real) y `TRACKING_MOCK=false`.
  - Preview: `TRACKING_MOCK=true`, sin clave. Las previews no gastan cuota.
- **Arreglo del collage:** `outputFileTracingIncludes` en `next.config.ts` para incluir `public/collage/**` en la función del servidor de `/`.
- **README:** sección "Deploy" con la URL, las variables de entorno y cómo publicar cambios.
- Repositorio y sitio **públicos** (decisión del usuario).

**Fuera de alcance (specs futuros):**

- Dominio propio.
- Protección con contraseña o login.
- Hacer privado el repositorio.
- Editar vuelos o fotos sin deploy (admin o base de datos).
- Analítica, monitoreo o alertas.
- Aviso `loading="eager"` de la imagen LCP del collage.
- Fondo espacial (anotado para SPEC 06).

---

## Modelo de datos

Este spec no introduce estructuras de datos nuevas. Reutiliza el modelo de SPEC 02 y SPEC 03.

Configuración nueva:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./public/collage/**/*"],
  },
};
```

Variables de entorno en Vercel (Settings → Environment Variables):

| Variable              | Production | Preview | Development             |
| --------------------- | ---------- | ------- | ----------------------- |
| `AERODATABOX_API_KEY` | clave real | —       | — (se usa `.env.local`) |
| `TRACKING_MOCK`       | `false`    | `true`  | — (se usa `.env.local`) |

---

## Plan de implementación

1. **Incluir el collage en la función.** Añadir `outputFileTracingIncludes` a `next.config.ts`. Consultar antes `node_modules/next/dist/docs/` (referencia de `next.config.js` → `outputFileTracingIncludes`). Verificar: `npm run build` pasa y el archivo de trazas de `/` (`.next/server/app/page.js.nft.json` o equivalente) lista los archivos de `public/collage/`.
2. **README.** Reemplazar el README de `create-next-app` por uno corto: qué es, `npm run dev`, variables de `.env.example`, sección "Deploy" (URL, variables en Vercel, "push a `master` = publicado"). Commit y push a `master` (lo hace el usuario tras revisar).
3. **Crear el proyecto en Vercel (usuario).**
   - Entrar a vercel.com con GitHub → Add New → Project → importar `viaje-mamas`.
   - Nombre `viaje-mamas`, framework Next.js (autodetectado), comandos por defecto.
   - Cargar las variables de entorno de la tabla antes del primer deploy.
   - Deploy.
4. **Verificar producción.**
   - La URL responde, se ven las 3 cajas, el collage con fotos y el tema oscuro.
   - Esperar más de 5 min y recargar dos veces. El collage sigue con fotos, lo que confirma la regeneración.
   - Buscar la clave en el código fuente y en el JavaScript descargado: no aparece.
   - Revisar los logs de la función en Vercel: sin errores `[tracking]`.
5. **Verificar el deploy automático.**
   - Hacer un push pequeño a `master` (p. ej. el README del paso 2 o un ajuste de texto). Vercel lo publica solo y la URL muestra el cambio.
   - Abrir un PR desde una rama de prueba: Vercel comenta la URL de preview y en ella se ven las etiquetas del modo mock.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores con el nuevo `next.config.ts`.
- [ ] El archivo de trazas de la ruta `/` incluye los archivos de `public/collage/`.
- [ ] El proyecto `viaje-mamas` existe en Vercel y está conectado al repo `jleonardolopezFullStack/viaje-mamas`, rama de producción `master`.
- [ ] La URL de producción responde 200 y muestra "Trip Time", las 3 cajas y el collage con 6 fotos.
- [ ] Tras más de 5 min y dos recargas, el collage sigue mostrando fotos.
- [ ] La página abre en oscuro y el botón de tema funciona en producción.
- [ ] `AERODATABOX_API_KEY` no aparece en el HTML ni en ningún `.js` que descarga el navegador.
- [ ] En producción, hoy (fuera de las ventanas de vuelo) no se ve ninguna etiqueta de estado, y los logs no muestran llamadas fallidas a AeroDataBox.
- [ ] Un push a `master` genera un deploy de producción automático que llega a "Ready" sin intervención manual.
- [ ] Un PR genera una URL de preview donde se ven las etiquetas del modo mock (`Delayed 40m`, `In air`, `Landed`, `Cancelled`).
- [ ] El README explica la URL, las variables de entorno y que un push a `master` publica.

---

## Decisiones

- **Sí:** Vercel. Soporta Next 16 con servidor, regeneración cada 5 min y caché de `fetch` sin configuración. **No:** GitHub Pages; solo sirve archivos estáticos y expondría la clave (ver SPEC 03).
- **Sí:** importar el repo desde el dashboard de Vercel. **No:** Vercel CLI; mismo resultado con más pasos locales.
- **Sí:** push a `master` = publicado. **No:** editar datos sin deploy; requiere admin o base de datos, en otro spec.
- **Sí:** `outputFileTracingIncludes` para `public/collage/**`. Una línea y el código de SPEC 01 no cambia. **No:** generar la lista de fotos en un script de build; más piezas móviles.
- **Sí:** previews con `TRACKING_MOCK=true` y sin clave. No gastan cuota y permiten ver todos los estados.
- **Sí:** repositorio y sitio públicos (decisión del usuario, sabiendo que incluye fotos familiares y fechas de vuelo). **No:** repositorio privado ni contraseña por ahora.
- **Sí:** nombre de proyecto `viaje-mamas`.

---

## Riesgos

| Riesgo                                       | Mitigación                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Collage vacío tras la regeneración en Vercel | `outputFileTracingIncludes` (paso 1) y verificación con más de 5 min (paso 4).                             |
| La clave se filtra                           | Solo en variables de entorno de Vercel. Nunca con prefijo `NEXT_PUBLIC_`. Verificación en el paso 4.       |
| Las previews gastan cuota de la API          | Las previews usan `TRACKING_MOCK=true` y no tienen la clave.                                               |
| Fotos pesadas en la función del servidor     | ~5 MB hoy, muy por debajo del límite de Vercel (250 MB descomprimido). Si crece mucho, se revisa.          |
| Fotos familiares y fechas públicas           | Decisión consciente del usuario. Hacer privado el repo o añadir contraseña va en otro spec si se necesita. |
| `viaje-mamas` ya existe en Vercel            | Vercel asigna un sufijo. Se actualiza la URL en el README.                                                 |
| El plan Hobby de Vercel tiene límites de uso | Uso personal y bajo tráfico. La regeneración cada 5 min y la caché mantienen el cómputo mínimo.            |

---

## Lo que **no** está en este spec

- Dominio propio.
- Contraseña o login.
- Repositorio privado.
- Admin para editar datos sin deploy.
- Analítica o monitoreo.
- Fondo espacial (SPEC 06).

Cada uno, si llega, va en su propio spec.
