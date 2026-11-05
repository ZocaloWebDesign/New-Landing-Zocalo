# SEO: antes
https://new-landing-zocalo.vercel.app/ · 2026-11-04 · opciones: base

**Puntaje SEO técnico: 74/100 · Veredicto: MEJORABLE**

| Área | Puntos | % |
|---|---|---|
| Indexación y rastreo | 17/27 | 63% 🟠 |
| Metadatos | 17/20 | 85% 🟢 |
| Contenido y estructura | 17/17 | 100% 🟢 |
| Datos estructurados | 0/4 | 0% 🔴 |
| Vista previa al compartir | 1/8 | 13% 🔴 |
| Enlaces | 7/7 | 100% 🟢 |
| Móvil y experiencia | 8/8 | 100% 🟢 |

## Qué arreglar (ordenado por puntos que se pierden)
- 🔴 **Canonical autorreferente y absoluta** (−4.0 pts): Sin <link rel=canonical> → Agregar canonical absoluta a la URL final de producción.
- 🔴 **Tiene JSON-LD (en la página ya renderizada)** (−4.0 pts): Sin JSON-LD → Agregar Organization/LocalBusiness + WebSite en JSON-LD.
- 🔴 **Open Graph (título, descripción, imagen, url)** (−4.0 pts): Tiene: ninguno → Completar og:title, og:description, og:image y og:url.
- 🔴 **sitemap.xml válido con las URLs del sitio** (−3.0 pts): https://new-landing-zocalo.vercel.app/sitemap.xml devolvió 404 → Crear sitemap.xml con las URLs canónicas absolutas.
- 🟠 **robots.txt existe y no bloquea todo** (−2.0 pts): robots.txt devolvió 404 → Crear robots.txt que permita rastrear.
- 🔴 **La imagen para compartir existe y es absoluta** (−2.0 pts): Sin og:image → Agregar og:image absoluta (1200×630).
- 🟠 **Largo del title (25 a 65 caracteres)** (−1.5 pts): 18 caracteres → Ajustar a 25 a 65 caracteres para que no se corte.
- 🟠 **Largo de la description (70 a 165)** (−1.5 pts): 62 caracteres → Ajustar a 70 a 165 caracteres.
- 🟠 **robots.txt indica el sitemap** (−0.5 pts): Sin línea Sitemap: → Agregar `Sitemap: https://dominio/sitemap.xml`.
- 🟠 **Usa dominio propio (no de prueba)** (−0.5 pts): new-landing-zocalo.vercel.app → Antes de entregar al cliente, publicar en su dominio.
- 🟠 **Tarjeta de X/Twitter** (−0.5 pts): Sin twitter:card → Agregar twitter:card=summary_large_image.
- 🟠 **og:locale y og:site_name** (−0.5 pts): locale=— site_name=— → Agregarlos.

## Lo que ya está bien
- ✅ La página responde 200
- ✅ Usa HTTPS
- ✅ http:// redirige a https:// con 301
- ✅ No bloquea la indexación (noindex)
- ✅ Una URL inexistente devuelve 404 real
- ✅ Tiene <title>
- ✅ Tiene meta description
- ✅ Exactamente un <h1>
- ✅ Idioma declarado (lang)
- ✅ Favicon
- ✅ El texto está en el HTML inicial (no solo por JavaScript)
- ✅ Hay texto suficiente (200+ palabras)
- ✅ Jerarquía de títulos sin saltos
- ✅ Imágenes con alt
- ✅ Enlaces con texto descriptivo
- ✅ Enlaces internos sin romper
- ✅ Los enlaces ancla (#) llevan a una sección que existe
- ✅ Viewport para móviles
- ✅ Lighthouse SEO (comprobaciones automáticas de Google)

No aplican: Una sola versión (con o sin www); El JSON-LD no tiene errores de sintaxis; Usa un tipo útil (Organization, LocalBusiness, WebSite…); Incluye nombre y URL.

## Lo que este puntaje NO mide
Es un puntaje **propio** de preparación técnica, no un ranking de Google. No mide: en qué posición aparece la página, si Google ya la indexó, calidad ni intención del contenido, enlaces de otros sitios, ficha de Google Business ni reseñas. Eso requiere Search Console y revisión manual (ver el skill).
