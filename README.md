# Salim Capital — página web

Web de una sola página (HTML, CSS y JavaScript, sin dependencias) en español, inglés y árabe, con modo claro y oscuro.

## Archivos

- `index.html` — toda la web
- `favicon.svg` — icono de la pestaña (monograma SC)

## Publicar con GitHub Pages

1. Crea un repositorio nuevo en GitHub y sube estos archivos a la raíz.
2. Ve a **Settings → Pages**.
3. En **Source**, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
4. En un par de minutos la web estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.

## Pendiente antes de publicar

- **Formulario de contacto:** ahora solo muestra el mensaje de confirmación; no envía los datos. Hay que conectarlo a un servicio de formularios o a tu correo (busca el comentario «Aquí se conectará el envío real» en `index.html`).
- **[TU EMAIL]** en la sección de empleo (en los tres idiomas).
- **[ENLACE A LA POLÍTICA DE PRIVACIDAD]** en el formulario (en los tres idiomas).

## Editar textos

Todos los textos están al final de `index.html`, en el objeto `T` (`es`, `en`, `ar`) y en los bloques `Object.assign(T.…)`.
