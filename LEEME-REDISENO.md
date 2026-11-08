# Fredy's Burger · Rediseño "Parrilla de noche"

Rediseño de la parte pública de la app (`apps/web`). El panel de administración no se tocó.
Fecha: 3 de noviembre de 2026.

## Qué cambió y dónde está

| Pieza | Archivo |
|---|---|
| Colores, letras, botones, vidrio, cuadrillé, semillas | `apps/web/app/globals.css`, `apps/web/tailwind.config.ts` |
| Valores de movimiento y ayudantes | `apps/web/lib/motion.ts` |
| Scroll suave y animaciones al bajar (`data-reveal`, `data-split`, `data-draw-scrub`, `data-burst`, `data-pop`) | `apps/web/components/fredys/MotionProvider.tsx` |
| Portada con la animación firma | `apps/web/components/fredys/Hero.tsx` |
| Las elegidas, Cómo llega tu pedido, Por qué Fredy's, Horario y contacto | `apps/web/components/fredys/Secciones.tsx` |
| Parrilla, semillas e íconos | `apps/web/components/fredys/Piezas.tsx` |
| Barra fija del celular | `apps/web/components/fredys/CartBar.tsx` |
| Inicio | `apps/web/app/(store)/page.tsx` |
| Ficha, carrito, checkout, contacto, nosotros, 404 | sus páginas en `apps/web/app/` |
| Zonas de envío, pagos, horarios, WhatsApp | `apps/web/lib/utils.ts` (una sola fuente) |
| Fotos optimizadas, imagen para compartir y apple-touch-icon | `apps/web/public/img/rediseno/` |
| Hoja de muestra aprobada (no se publica) | `diseno/direccion-de-arte.html` |

## Dirección de arte aprobada

**Idea:** parrilla de noche. Fondo carbón, la burger como protagonista, el naranja solo donde querés que miren.

### Colores y contraste (AA comprobado)

| Rol | HEX | Uso | Contraste |
|---|---|---|---|
| Fondo (carbón tostado) | `#0F0B09` | Fondo general | — |
| Principal / acción | `#FB8500` | Botones, precios, palabra clave | Letra blanca: 2.5 (no pasa). Letra `#160D09`: 7.6 (pasa) |
| Letra sobre el botón | `#160D09` | Texto de botones naranjas | ver arriba |
| Hover del botón | `#FF9D33` | Aclara (oscurecer bajaba el contraste); presionado = se hunde | > 8 con `#160D09` |
| Crema | `#FFF3E0` | Texto principal | ≈ 18 sobre el fondo |
| Texto secundario | `#C9B3A1` | Párrafos de apoyo | ≈ 10 sobre el fondo |
| Chocolate | `#3A1F1A` | Sombra de letras y botones | decorativo |
| Cuero de gorra | `#5A3A33` | Cuadrillé y líneas | decorativo |
| Cheddar | `#FFC23D` | Detalles (semillas, "Gratis") | ≈ 12 sobre el fondo |

### Letras
- Titulares: **Anton** (Google Fonts, servida por `next/font`), siempre en mayúsculas por CSS.
- Texto: **Poppins** 400/600/800 (la que ya usaba la app).
- "Letra sticker" (borde naranja + sombra marrón, como el logo): solo en la portada, nombres de burgers y títulos clave.

### Elementos propios
1. **Cuadrillé de la gorra de Fredy** → parrilla alrededor de las fotos y textura de fondo.
2. **Semillas del pan** → saltan desde la burger y flotan.
3. **Chorreado de cheddar** → un hilo de cheddar (imagen 2) baja por los pasos de "Cómo pedir" y, con las demás imágenes del dueño, se derrite de la burger y los platos al bajar. (La línea de "MORDIDA" al botón se sacó: no parecía cheddar.)
4. **Letras con borde** del logo.
5. **Vidrio tostado** en tarjetas (lo pediste; lleva el cuadrillé para que sea propio).

### Movimiento (ficha técnica)
- Se siente: golosa, enérgica y cálida.
- `M = { ease: 'power4.out', easeIO: 'power3.inOut', pop: 'back.out(2.2)', dur: 0.8, stagger: 0.05, dist: 56, lerp: 0.1 }`
- CSS: `--ease: cubic-bezier(.22,1,.36,1)`, `--ease-io: cubic-bezier(.76,0,.24,1)`, `--ease-pop: cubic-bezier(.34,1.75,.68,1)`, `--dur: .8s`, `--dist: 56px`.
- Firma (≈ 2,4 s, se salta con un toque, la mitad de tiempo en la segunda visita): la parrilla se dibuja naranja y se enfría, la burger sube desde la penumbra, saltan las semillas, y el titular entra por líneas.
- Librerías: **gsap 3.13.0** (ScrollTrigger y SplitText) y **lenis 1.3.11**, versiones exactas en `package.json`. Framer Motion se conserva para el menú lateral y el carrito.
- Con "Reducir movimiento" o sin JavaScript todo se ve completo y quieto (guardia `js` en `<html>` y rescates por tiempo en CSS).

### Animaciones de la segunda ronda
- **Sumar al pedido** (`volarAlCarrito` en `lib/motion.ts`): una semilla vuela en arco del botón al carrito (`[data-cart-icon]`), el carrito se sacude y el contador rebota. 0,75 s.
- **Menú** (`data-cascada`, `data-franja`): los renglones entran en cascada corta al bajar (24 px, sin rebote) y la franja de cuadrillé se dibuja de izquierda a derecha.
- **Portada al bajar** (`Hero.tsx`): con el scroll, la burger se aleja y gira (`.hero__escena`), la parrilla rota y las semillas se dispersan (`.hero__semillas`).
- **"¿Le sumás algo?"** (`components/fredys/Sugerencia.tsx`, `lib/sugerencia.ts`): al sumar una burger aparece una tarjeta con una opción de papas (prefiere "con cheddar"), una de dip y una bebida (prefiere lata). Se suma con un toque, no ofrece lo que ya está en el pedido, se cierra sola a los 10 s y con "No, gracias" no vuelve en la visita. "Ver más opciones" abre todas las papas, dips y bebidas en filas que se deslizan; cada toque suma una más (marca "✓ 2") y ahí no se cierra sola ("Listo" la cierra). Las categorías se reconocen por slug: `papas`, `salsas`, `bebidas`.
- **"¿Lo mismo que la otra vez?"** (`components/fredys/RepetirPedido.tsx`, `lib/ultimo-pedido.ts`): al confirmar el checkout, el pedido queda guardado en el navegador del cliente. La próxima vez, debajo del buscador del menú, aparece con fotos, resumen y total con los precios de hoy; "Repetir pedido" lo pone en el carrito y lo abre. Lo que ya no está en el menú se deja afuera (y avisa). Con ✕ se oculta en la visita. No guarda datos personales, solo los productos.
- **Estado del local en vivo** (`estadoLocal()` en `lib/utils.ts`, `lib/use-estado-local.ts`): siempre con la hora de Argentina, se actualiza solo cada 30 s. Portada: "Abierto · cierra 23:30 · demora aprox. 30–45 min" (punto verde que late; "cierra en 20 min" en los últimos 45) o "Cerrado · abrimos en 2 h 15 min / hoy 19:30 / mañana 19:30 / el martes 19:30". La franja de cerrado usa la misma cuenta, y en Horario y contacto se marca el día de hoy (`ListaHorarios.tsx`). La demora está en `DEMORA`.
- **Ingredientes en la ficha**: si la descripción es una lista separada por comas (3 o más), va en un desplegable "Ingredientes · 5" con cada uno en una cápsula. "Ver cómo se arma" lleva a la última foto de la galería (la burger desarmada con los nombres).
- **Elegí el tamaño sin salir del menú** (`components/fredys/ElegirTamano.tsx`, `lib/elegir-tamano.ts`): el "+" de una burger con tamaños abre una hoja desde abajo (en computadora, ventana centrada) con tamaño, cantidad y "Sumar al pedido". Se cierra tocando afuera, con ✕, Escape o arrastrando hacia abajo; "Ver fotos y detalle" lleva a la ficha. Al sumar, la hoja baja y aparece "¿Le sumás algo?". El menú queda donde estaba.
- **Galería de la ficha**: las fotos se pasan deslizando (scroll con imán). Cada una según su forma (se mide al cargar): las verticales van enteras y fundidas con la parrilla (`.foto-fundida`); las cuadradas o anchas (papas, salsas, bebidas, promo) en un plato redondo de borde difuminado (`.foto-plato`). En el celular, puntitos dentro del plato; en computadora, miniaturas.
- **Tarjetas y fotos vivas**: "Las elegidas" se inclinan con el mouse (`data-tilt`, solo con mouse), y al pasar sobre una foto con parrilla (`.foto-parrilla`) la parrilla se enciende naranja.

### Cheddar que chorrea con el scroll (tercera ronda)
- Cinco imágenes del dueño (`cheddar 1-5.png`), pasadas a WebP sin fondo en `apps/web/public/img/rediseno/cheddar-*.webp` (a la 4 y la 5 se les sacó el fondo negro).
- Componente `Chorro` en `components/fredys/Piezas.tsx` + `animarChorros` en `lib/motion.ts` (atributo `data-chorro`): al bajar, el cheddar se estira hacia abajo a la par del scroll; al subir, se recoge. La salpicadura (`modo="mancha"`) se abre con el scroll.
- Regla (pensada para celular): el cheddar siempre sale de algo con queso y nunca pasa por encima de texto.
  - **Portada:** el queso de la burger se derrite por el pan (imagen 4) y se desvanece antes del titular.
  - ~~Ficha de producto~~: se sacó la gota (imagen 1). Con la foto vertical no salía de ningún queso y no había lugar abajo sin tapar el nombre.
  - **Por qué Fredy's:** un hilo (imagen 2) cae sobre el plato del sello.
  - **Nosotros:** la salpicadura (imagen 3) se abre detrás del plato de la Bacon Cheeseburger.
  - **Pie:** la salpicadura (imagen 3) se abre detrás del logo.
  - **Barra "Ver tu pedido" (celular):** cada vez que se suma algo, el borde con gotas (imagen 5, teñido más amarillo para que se distinga del botón) chorrea sobre la barra, entre el texto y el total, y a los 2 s se recoge (`CartBar.tsx`, `.queso-barra`).
- En el pie el recorrido se ajusta al final de la página para que siempre termine de chorrear.
- Con "Reducir movimiento" o sin JavaScript se ven completas y quietas.

### Google y compartir (cuarta ronda, punto 10)
- **Una sola dirección del sitio:** `lib/sitio.ts` (`NEXT_PUBLIC_SITE_URL`, hoy la de Vercel). La usan los metadatos, `sitemap.xml`, `robots.txt` y los datos para Google. Antes `robots` y `sitemap` apuntaban a fredysburger.com.ar.
- **Imagen al compartir cada ficha** (`app/producto/[slug]/opengraph-image.tsx`): 1200 × 630 con la foto de esa burger, el nombre en Anton y "desde $8.100". Las letras están en `apps/web/assets/fonts/` (licencia OFL) y las fotos en `public/img/opt/**/*.og.png` (bordes transparentes, las arma `optimizar-fotos.mjs`).
- **Título y descripción por ficha** (`app/producto/[slug]/layout.tsx`): "Bacon Cheeseburger | Fredy's Burger" con ingredientes y precio, más los datos de producto con su rango de precios (`Product`/`AggregateOffer`).
- **La carta para Google** en el inicio (`Menu` con secciones, platos y precios) y el restaurante con dirección, horario, rango de precios, pagos y enlace a la carta.
- **sitemap.xml** con todas las fichas disponibles (se rehace cada hora); **robots.txt** deja afuera `/admin`, `/checkout` y `/carrito`.
- Títulos unificados como "Fredy's Burger" (antes había "Fredys Burger" y en el inicio la marca salía repetida).

### Instalable como app (punto 11)
- **Manifiesto** (`public/manifest.json`): "Fredy's Burger" / "Fredy's", colores de la marca, pantalla vertical, accesos directos al mantener apretado el ícono ("Ver el menú" y "Mi pedido"). Abre en `/?origen=app` para poder contar después cuánta gente entra desde la app.
- **Íconos** (`public/iconos/`, los arma `scripts/iconos.mjs`): logo sobre el carbón con el aro de la parrilla; versión "maskable" para Android y favicon con la burger sola. Hoy salen de `public/img/logo-slide.png` (una captura de 884 px): con el logo original, cambiar `LOGO` en el script y correr `node scripts/iconos.mjs`.
- **"Instalá Fredy's en tu celu"** (`BotonInstalar` en `components/fredys/App.tsx`): en el menú lateral y en la pantalla de pedido confirmado. En Android y computadora abre el aviso del navegador; en iPhone explica "Compartir → Agregar a inicio". No aparece si ya está instalada.
- **Sin conexión** (`public/sw.js`, `public/offline.html`): página propia con "Probar de nuevo" y "Pedir por WhatsApp"; se recarga sola cuando vuelve la señal. El service worker no guarda el menú ni los precios: siempre se piden en vivo.

### Medir las ventas (punto 12)
Google Analytics 4 (gratis; Vercel Analytics no cuenta acciones en el plan gratis). Código en `lib/medir.ts` y `components/fredys/Analitica.tsx`. **Está apagado hasta cargar `NEXT_PUBLIC_GA_ID`.**

**Cómo activarlo (una vez):**
1. Entrar a analytics.google.com con la cuenta del negocio → Crear cuenta "Fredy's Burger" → propiedad en zona horaria Argentina y moneda peso argentino → flujo de datos "Web" con la dirección del sitio.
2. Copiar el "ID de medición" (empieza con `G-`) y cargarlo en Vercel → Settings → Environment Variables como `NEXT_PUBLIC_GA_ID`. Volver a publicar.
3. En GA: Informes → Monetización → "Recorrido de compra" muestra el embudo.

**Qué se mide** (sin nombres, teléfonos ni direcciones):

| Evento | Cuándo |
|---|---|
| `view_item` | Abre una ficha |
| `select_item` | Abre la hoja "Elegí el tamaño" desde el menú |
| `add_to_cart` | Suma algo; con `origen`: menu, hoja, ficha, sugerencia o repetir |
| `view_cart` | Abre el carrito (panel o página) |
| `begin_checkout` | Llega al checkout con productos |
| `purchase` | Confirma el pedido y se abre WhatsApp (con N° de pedido, total, envío, entrega y forma de pago) |
| `clic_whatsapp` / `clic_instagram` | Cualquier botón a WhatsApp o Instagram, con dónde estaba |
| `sugerencia_vista` / `sugerencia_no_gracias` | "¿Le sumás algo?" |
| `repetir_pedido` | Usa "¿Lo mismo que la otra vez?" |
| `instalar_app` / `instalar_app_aviso` | Instala la app o responde el aviso |

Las visitas desde la app instalada se ven por la dirección `/?origen=app`.

## Menú y pedidos dentro de Vercel (sin servidor aparte)
La API de NestJS en Railway se cayó (y Railway ya no es gratis). Ahora **todo corre en la misma web en Vercel**: el menú, los pedidos, el login del panel y la subida de fotos. `apps/api` queda como referencia y ya no se publica.

| Pieza | Archivo |
|---|---|
| Conexión a la base (Supabase, con Prisma) | `apps/web/lib/server/db.ts` |
| Menú (leer y editar desde el panel) | `apps/web/lib/server/menu.ts` |
| Pedidos (precios tomados de la base, no del navegador) | `apps/web/lib/server/pedidos.ts` |
| Login del panel (token JWT) | `apps/web/lib/server/auth.ts` |
| Rutas `/api/...` (mismas direcciones que la API vieja) | `apps/web/app/api/` |
| Tablas, migraciones y carga del menú | `apps/web/prisma/` (`seed.mts`) |
| Pedidos en vivo en el panel (revisa cada 8 s; antes era WebSocket) | `apps/web/lib/use-orders-socket.ts` |

- El inicio, las fichas, el sitemap y la imagen al compartir leen la base directo (más rápido, sin ir y volver por `/api`).
- Al editar el menú desde el panel, el inicio y las fichas se actualizan al momento.
- **Seguridad:** la contraseña del admin ya no está escrita en el código (antes `fredys2026admin`, visible en el repositorio público). Sale de `ADMIN_PASSWORD` al cargar la base.

**Variables en Vercel** (Settings → Environment Variables):

| Variable | Qué es |
|---|---|
| `DATABASE_URL` | Supabase → Connect → "Transaction pooler" (puerto 6543), agregando `?pgbouncer=true&connection_limit=1` al final |
| `DIRECT_URL` | Supabase → Connect → "Session pooler" (puerto 5432) |
| `JWT_SECRET` | Texto al azar de 32+ caracteres (firma las sesiones del panel) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Las mismas de `apps/api/.env` (subida de fotos desde el panel) |
| ~~`NEXT_PUBLIC_API_URL`~~ | Ya no se usa: borrarla |

**Crear las tablas y cargar el menú** (una vez, desde la compu): poner `DATABASE_URL`, `DIRECT_URL`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `apps/web/.env.production.local` (no se sube a git) y correr `pnpm --filter @fredys/web exec prisma migrate deploy` y después `node prisma/seed.mts` desde `apps/web`.

## Qué se edita fácil
- **Titular y textos de la portada:** `components/fredys/Hero.tsx`.
- **Pasos, envío, "Por qué", horario:** `components/fredys/Secciones.tsx`.
- **Precios de envío:** `DELIVERY_COSTS` en `lib/utils.ts` (cambian en el inicio y el checkout a la vez).
- **Mensajes de WhatsApp:** buscá `waLink(` en el código.
- **Burgers destacadas ("Las elegidas"):** las que tengan `featured` en el panel/base de datos.

## Mensajes de WhatsApp

| Botón | Mensaje |
|---|---|
| Checkout | El detalle del pedido (sin cambios) |
| Horario y contacto / Contacto | "Hola Fredy's, vengo de la web y tengo una consulta." |
| Menú lateral y pie | "Hola Fredy's, quiero hacer una consulta sobre un pedido." |
| Franja de cerrado | "Hola Fredy's, quiero dejar un pedido para cuando abran." |

## De dónde salió cada dato
- Productos, precios y destacados: `apps/api/prisma/seed.ts` (precios confirmados por el dueño el 3/11/2026).
- Horario, zonas de envío, medios de pago, tiempo 30–45 min: código anterior de la app.
- Textos de Nosotros y "Sin congelados, sin atajos": página Nosotros anterior.
- Titular "Sabor intenso en cada mordida": carrusel anterior de la portada (elegido por el dueño).
- Colores: `#FB8500` de la app; marrones y crema sacados del logo a ojo (aprobados).

## Por validar (decisiones tomadas por Claude)
- Botones naranjas con letra oscura (la blanca no se lee bien sobre el naranja).
- Tonos chocolate, cuero, crema y cheddar sacados a ojo del logo.
- Portada con la Mushroom Burger; tarjeta y Nosotros con la Bacon Cheeseburger.
- Textos nuevos escritos por Claude: pasos de "Cómo pedir" ("sin llamar a nadie", "Te llega el detalle armado"), "La plancha se prende a las 19:30", "Elegí la tuya", "Elegí la tuya y la ponemos en la plancha", "Hablemos de burgers".
- "Las elegidas de Fredy" usa las destacadas del sistema; no dice "más vendidas" porque no hay esa cifra.
- Cuando está cerrado: franja arriba (ya no tapa la pantalla), el botón de la portada dice "Mirá el menú" y aparece "Cerrado ahora · próxima apertura".
- Retiro: "te pasamos la dirección por WhatsApp" (no hay dirección pública).
- En el menú, el "+" suma directo si el producto tiene un solo precio; si tiene tamaños, abre la hoja "Elegí el tamaño".
- Al sumar (desde el menú o la ficha) ya no se abre el panel del carrito: avisa la semilla que vuela, el contador y la barra "Ver tu pedido".
- Se sacó el bloque de reseña hasta tener una real (pedido del dueño).
- Los grises oscuros del sistema (`dark-*`) ahora son cálidos: el panel de administración se ve apenas más marrón.
- Se quitó la animación de transición entre páginas (escondía el contenido sin JavaScript).

## Arreglos de fallas que ya existían
- Checkout en computadora: el botón "Confirmar pedido" no enviaba el formulario (faltaba `id="checkoutForm"`).
- Al recargar `/checkout` siempre mandaba al inicio (no esperaba a leer el carrito guardado).
- Fotos rotas en el panel del carrito (faltaba la `/` inicial de la ruta).
- Errores del checkout: antes una ventana `alert`, ahora un aviso dentro de la página.

## Pendientes
1. **[RESEÑA REAL DE CLIENTE]** y **[NOMBRE Y DE DÓNDE ES LA RESEÑA]** en "Por qué Fredy's" (con permiso).
2. **Fotos que no existen** en el seed/base: `img/hallfredys.jpg`, `img/fredys-muzz.jpg`, `img/crispy-muzz.jpg`, `img/big-muzz.jpg` y otras. Mientras tanto se muestra la foto de promo (a pedido del dueño). Al subirlas a `public/img/`, el build las optimiza solo.
3. **Logo original** (SVG, AI o PNG grande) en `materiales/logo/`: hoy se usa el PNG de 150 px en la web y una captura de 884 px para los íconos de la app.
4. ~~La API publicada no responde~~ Resuelto: el menú y los pedidos corren en Vercel (ver "Menú y pedidos dentro de Vercel"). Falta la base en Supabase y las variables en Vercel.
5. ~~Fotos de productos pesadas~~ Resuelto: `scripts/optimizar-fotos.mjs` (corre solo antes de cada build, o `pnpm --filter @fredys/web fotos`) las pasa a WebP en `public/img/opt/` en dos tamaños (900 px y 240 px) y escribe `lib/fotos.generated.ts`. `imgSrc(ruta, 'sm' | 'lg')` sirve la liviana sin cambiar las rutas de la base; si no existe, la de promo. 40,9 MB → 2,7 MB.
6. `components/ui/Button.tsx` tiene un error de tipos previo al rediseño (no frena el build porque `ignoreBuildErrors` está activo).
7. `components/PageTransition.tsx` y `HeroSlider.tsx` quedaron sin uso; se pueden borrar.

## Cómo probar y publicar
1. `pnpm install` en la raíz (instala gsap y lenis).
2. `pnpm --filter @fredys/web build && pnpm --filter @fredys/web start`.
3. Publicar: subir la rama y Vercel despliega solo. Al tener dominio propio, cargar `NEXT_PUBLIC_SITE_URL` (por ejemplo `https://fredysburger.com.ar`) en Vercel: cambia de una vez el sitemap, robots, las imágenes al compartir y los datos para Google.
4. Después de publicar: dar de alta el sitio en Google Search Console y mandar `/sitemap.xml`. Para ver la imagen al compartir: [opengraph.xyz](https://www.opengraph.xyz) o mandarse el enlace por WhatsApp.
