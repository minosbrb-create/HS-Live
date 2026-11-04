# HS Live

Sitio de HoliSofi Live. Permite mostrar un reproductor configurable junto al chat de Twitch.

## Código y publicación

- `index.html`, `assets/` y `functions/` contienen el sitio y sus funciones de Cloudflare Pages.
- `build-cloudflare-pages.cjs` genera la carpeta `cloudflare pages/` para publicar.
- `GUIA-DE-USO.md` explica la configuración habitual del sitio y sus valores de KV.
- `PUBLICAR-CLOUDFLARE-PAGES.md` describe el proceso de publicación.

La carpeta generada y los archivos temporales de Wrangler se excluyen del repositorio; se pueden volver a generar localmente.

## Configuración sensible

Las claves de Twitch y otros valores secretos se guardan en las variables y secretos de Cloudflare Pages, no en este repositorio. No publiques claves de transmisión de Twitch, VK u otras plataformas.
