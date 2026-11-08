# Propuestas pendientes de decisión

## 1. Envío del formulario (W-01)

Requisitos: que los datos lleguen de verdad, antispam **sin cookies de terceros** (trampa *honeypot* + límite de envíos) y coste mensual conocido. **No se ha implementado ninguna opción**: la web queda preparada y, mientras no haya proveedor, al enviar muestra el correo de contacto en lugar de un falso «Solicitud recibida».

Lo que ya hace la web, sea cual sea la opción:

- Campo trampa oculto (`website`): si llega relleno, el envío se descarta.
- Tiempo mínimo de 4 s entre cargar la página y enviar.
- Límite de 3 envíos por hora en el navegador (configurable en `src/data/site.json`).
- Envío por `fetch` a la dirección configurada en `form.endpoint`; sin JavaScript, el formulario envía por POST normal a esa misma dirección.

El límite del navegador se puede saltar; el límite real tiene que aplicarlo el servidor. Por eso las opciones se comparan también por eso.

| | A. Web3Forms | B. Formspree | C. Función propia en Cloudflare Pages |
|---|---|---|---|
| Coste mensual | 0 € (plan gratuito, 250 envíos/mes). Pro: 12 $/mes o 149 $/año | 0 € (50 envíos/mes). Personal: 15 $/mes o 120 $/año (200 envíos). La trampa *honeypot* propia solo está en Business: 90 $/mes o 720 $/año | 0 €/mes (plan gratuito de Workers; el envío a una dirección propia verificada es gratuito). Solo el dominio: ~11 $/año |
| Honeypot | Sí | Solo plan Business | Sí (lo programamos) |
| Límite de envíos en servidor | Lo gestiona el proveedor (no configurable en el plan gratuito) | No documentado | Sí, por IP y por hora, configurable |
| Cookies de terceros | No, si no se activa captcha (hCaptcha sí usa cookies) | No, si no se activa reCAPTCHA (sí usa cookies) | No |
| Dónde quedan los datos | En el proveedor; la página de precios no indica país ni plazo de conservación | En el proveedor; archivo 30 días en el plan gratuito; no indica país | No se guardan: se reenvían a su correo |
| Trabajo de integración | 15 min (clave de acceso en un campo oculto) | 15 min | 2-3 h (función, límite y pruebas) y alojar la web en Cloudflare Pages |
| Riesgo RGPD | Medio: hay que firmar el contrato de encargado y revisar transferencias fuera de la UE | Medio: igual | Bajo: no hay un tercero que almacene las solicitudes |

**Recomendación: C.** Es la única que cumple todos los requisitos sin pagar, no guarda los datos en un tercero (importante con datos patrimoniales de clientes) y, al alojar la web en Cloudflare Pages, resuelve también las cabeceras HSTS que GitHub Pages no permite (W-97). Si se prefiere no programar nada, **A** con el plan gratuito es la alternativa más rápida.

Fuentes de precios (consultadas el 08/11/2026): [Web3Forms](https://web3forms.com/pricing), [Formspree](https://formspree.io/plans), [Cloudflare Email Service](https://developers.cloudflare.com/email-service/platform/pricing/).

## 2. Dominio (W-02)

Comprobado en el registro oficial de `.com` (RDAP de Verisign) el 08/11/2026. **No se ha comprado ninguno.** Estar libre en el registro no garantiza el precio estándar: algunos registradores marcan ciertos nombres como *premium*; hay que confirmarlo al comprar.

| Dominio | Estado |
|---|---|
| salimcapital.com | **Ocupado** (registrado en GoDaddy el 06/10/2025, caduca en 2027) |
| **saidsalim.com** | Libre — **elegido como provisional** |
| saidsalimcapital.com | Libre |
| salimcapitaladvisors.com | Libre |
| salimadvisory.com | Libre |
| salimcapitalpartners.com | Libre |
| salimcapitalgroup.com | Libre |
| salimwealth.com | Libre |
| salim-capital.com | Libre (desaconsejado, ver abajo) |

Precio de un `.com` (primer año / renovación anual):

| Registrador | Primer año | Renovación |
|---|---|---|
| Cloudflare Registrar | 11,17 $ | 11,17 $ |
| Porkbun | 11,81 $ | 11,81 $ |
| Namecheap | 12,28 $ | 20,18 $ |
| GoDaddy | 13,19 $ | 23,19 $ |

Fuente: [comparativa de Porkbun](https://porkbun.com/about/domain-cost-calculator/com.txt), precios de la competencia revisados el 07/11/2026.

**Por qué saidsalim.com:** es el más corto, coincide con la forma en que se presenta («Soy Said Salim») y protege su nombre. **salim-capital.com** se desaconseja: los correos que alguien escriba sin guion irían a salimcapital.com, que es de otro titular, con el riesgo de que mensajes confidenciales lleguen a un tercero. Recomendación: comprar saidsalim.com y saidsalimcapital.com (este último redirigido al primero), en Cloudflare Registrar por precio de renovación. Antes de comprar, conviene que el cliente consulte la marca «Salim Capital» en la OEPM y la EUIPO, porque hay otras empresas con «Salim» en el sector financiero.

El dominio se cambia en un solo sitio: `siteUrl` y los correos de `src/data/site.json`.

## 3. Estructura del sitio (W-49): opción (b), sitio estático multipágina

| | (a) Landing larga con anclas | (b) Multipágina generado ✔ |
|---|---|---|
| URL y título por sección | No: una URL por idioma | Sí: `/es/servicios/`, `/en/services/`, `/ar/services/` |
| Vista previa al compartir | Una por idioma | Una por página e idioma |
| Longitud | 10 secciones muy largas en una sola página (Modelos, FAQ y el formulario son extensos) | Cada página tiene un objetivo y termina con su llamada a la acción |
| Sin JavaScript | Sí | Sí |
| Mantenimiento | Igual | Igual: los textos están en un JSON por idioma |

Se eligió **(b)** porque el contenido del cliente es demasiado extenso para una sola página, porque W-89 pide título y descripción por página, y porque cada sección (Modelos, Contacto) se comparte por separado.

El generador es un script propio de unas 600 líneas sin dependencias (`scripts/build.mjs`) en lugar de Astro o Eleventy: no hay nada que actualizar ni que se pueda romper con una versión nueva, y el sitio no necesita más. Si en el futuro hace falta un CMS o un blog, migrarlo a Astro es directo porque los textos ya están separados.

## 4. Alojamiento y HTTPS (W-97)

- **GitHub Pages:** gratis; activar «Enforce HTTPS». No permite cabeceras propias, así que con un dominio propio no se puede enviar HSTS.
- **Cloudflare Pages (recomendado):** gratis; aplica el archivo `dist/_headers` (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`) y permite la opción C del formulario.

La web también lleva una política CSP en cada página que solo permite recursos del propio sitio.
