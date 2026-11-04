> **Minos:** Sí este si soy yo hablando... bueno probablemente la guía suene o mal explicada o demasiado técnica dependiendo del caso... me disculpo, pero hey yo no escribí todo esto.. aunque insistí en que sonará mas como una guía cuidadosa que solo órdenes secas jaja. Esto siempre fue pensado más como una medida de emergencia, así que no hay problema en lo absoluto si este proyecto solo quieren usarlo de referencia o una base para una versión 100% controlada por ustedes. También aclaro que no tengo inconveniente de mantener la página en línea si al final prefieren hacerlo así, pero me gusta prevenir a futuro, así que es mejor que tengan todo el paquete en caso de que existan cambios.

# Uso y administración de Holisofi Live

Este documento reúne información práctica para administrar la página y sus canales. Para publicar en Cloudflare Pages se utiliza la carpeta `cloudflare pages`; la carpeta raíz `Holisofi Live` contiene los archivos fuente. El procedimiento de publicación está en `PUBLICAR-CLOUDFLARE-PAGES.md`. La captura `captura-vk-anotada.png` queda como referencia visual para comprender la interfaz de VK. Estos materiales son locales y no forman parte del sitio público.

## KV de Cloudflare y VK Video

**KV** significa *key-value* (clave-valor). Es un almacenamiento de Cloudflare donde la página guarda ajustes sencillos, como el canal de Twitch, la fuente del reproductor y el modo del sitio. Cada ajuste tiene una clave y un valor, y se puede cambiar desde Cloudflare sin volver a desplegar el sitio.

KV no es VK Video. **KV pertenece a Cloudflare y guarda configuración; VK Video es la plataforma que aloja o transmite el video que aparece en el reproductor.**

### Preparación inicial del namespace KV

Esta configuración se realiza una sola vez. Si el namespace ya está enlazado al proyecto, estos pasos se pueden omitir y la administración continúa desde **KV Pairs**.

1. En el panel de Cloudflare, abrir **Workers & Pages → Storage & Databases → KV** y crear un namespace. En la cuenta actual se llama `holisofi-live-channels`.
2. En **Workers & Pages → hslive → Settings → Bindings**, elegir **Add → KV namespace**.
3. Como nombre de variable, indicar `TWITCH_CHANNEL_CONFIG` y seleccionar el namespace recién creado.
4. Guardar el binding y hacer un despliegue para que Pages Functions lo reciba.
5. Abrir el namespace y su pestaña **KV Pairs**. Ahí se crean o editan las entradas que controlan la página.

Los valores iniciales recomendados para esta configuración son `channel_login = holisofi`, `video_source = vk:numeatest` y `site_mode = online`. `brand_name` es opcional y, si no existe, la página muestra `HoliSofi`.

## 1. Cuenta y canal de VK Video

La administración de una transmisión o un canal de VK Video requiere una cuenta en [VK Video Live](https://live.vkvideo.ru/). La cuenta debe ser autorizada por la titular del canal, y sus credenciales se mantienen privadas, fuera de los archivos de la página.

La traducción automática del navegador puede interferir con formularios y acciones de VK Video y ocasionar errores de carga. Para reducir ese riesgo, la interfaz se utiliza en su idioma original; la captura anotada sirve de apoyo para interpretarla.

## 2. Canal de Twitch mostrado en la página

El namespace KV enlazado al proyecto Pages contiene la entrada `channel_login`. Su valor inicial es `holisofi` y corresponde al nombre de usuario de Twitch, sin `@` ni URL. La ficha del canal, el chat y los botones de Twitch usan el mismo valor.

Al cambiar `channel_login` en KV, la página recoge el nuevo canal al recargarse manualmente. El cambio no requiere un nuevo despliegue.

La ficha y el estado del canal requieren una aplicación registrada en la [consola de desarrolladores de Twitch](https://dev.twitch.tv/console/apps). Actualmente se utiliza `HS Live1`, la aplicación registrada por Minos. `functions/api/twitch-channel.js` usa su ID y secreto para obtener un token de aplicación y consultar la API Helix de Twitch. Esta integración consulta información pública del canal; el chat integrado y los botones abren los servicios de Twitch directamente.

### Aplicación propia para administrar las credenciales

Si quienes reciben el proyecto quieren controlar también la aplicación de Twitch, pueden registrar una desde su propia cuenta y sustituir las credenciales en Cloudflare. El proceso es:

1. En la cuenta de Twitch de quien administrará la aplicación, abrir la [consola de desarrolladores](https://dev.twitch.tv/console/apps) y elegir **Register Your Application**.
2. Asignar un nombre único, por ejemplo `Holisofi Live`.
3. En **OAuth Redirect URLs**, registrar `https://hslive-ati.pages.dev/` mientras ese sea el dominio publicado. Esta integración usa el flujo de credenciales de aplicación y no utiliza una redirección para iniciar sesión; Twitch solicita que se registre una URL en el formulario.
4. Elegir **Website Integration** como categoría y **Confidential** como tipo de cliente, ya que el secreto se conserva en el backend.
5. Crear la aplicación, abrir **Manage** y copiar el **Client ID**. Generar un **Client Secret** nuevo y guardarlo de forma privada.
6. En Cloudflare Pages, abrir el proyecto `hslive` y entrar a **Settings → Variables and Secrets**. Sustituir `TWITCH_CLIENT_ID` por el nuevo ID y `TWITCH_CLIENT_SECRET` por el nuevo secreto, manteniendo el segundo como tipo **Secret**.
7. Guardar y hacer un nuevo despliegue. Después, comprobar que la ficha y el estado del canal vuelvan a cargarse.

La sustitución cambia qué aplicación hace las consultas de API, pero no cambia el canal elegido en `channel_login`. El secreto no se comparte en la carpeta ni en mensajes; solo se guarda en Cloudflare. [Registro oficial de aplicaciones de Twitch](https://dev.twitch.tv/docs/authentication/register-app) · [Flujo de credenciales de aplicación](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow).

## 3. Fuente del reproductor

La entrada `video_source`, en el mismo namespace KV, determina el reproductor mediante una plataforma y un identificador separados por dos puntos:

- `vk:numeatest` — canal de Minos usado durante las pruebas. Para la emisión final, este valor se sustituye por `vk:IDENTIFICADOR` del canal que decidan utilizar.
- `vk:IDENTIFICADOR` — canal de VK Video; el identificador corresponde a lo que aparece después de la barra en el enlace del canal.
- `twitch:holisofi` — canal de Twitch.
- `youtube:VIDEO_ID` — video o directo de YouTube; se utiliza el ID, no la URL completa.
- `drive:FILE_ID` — archivo de Drive con acceso de lector para cualquiera que tenga el enlace.

Esta entrada solo controla el reproductor. Después de guardar un valor nuevo, la página consulta la configuración al recargarse manualmente. Un video grabado se reproduce de forma independiente en cada navegador; su posición no se sincroniza entre espectadores.

## 4. Modo del sitio y nombre visible

En el mismo namespace KV, `site_mode = online` corresponde al sitio normal y `site_mode = offline` muestra la pantalla de mantenimiento. Las páginas abiertas y visibles consultan este modo cada cinco minutos; el sondeo se detiene en pestañas ocultas. Los demás cambios —canal, video y nombre de marca— se aplican al recargar manualmente. Esta decisión reduce las llamadas y el uso de la cuota de Cloudflare; el sondeo de mantenimiento solo lee la configuración y no consulta la API de Twitch.

La entrada opcional `brand_name` determina el nombre visible. Si no existe o está vacía, se muestra `HoliSofi`.

## 5. Datos privados y cambios

Las contraseñas, claves de transmisión y el valor de `TWITCH_CLIENT_SECRET` se mantienen fuera de esta carpeta. `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` se configuran como variables y secretos en Cloudflare Pages.

Los cambios de código se realizan en los archivos fuente; la carpeta `cloudflare pages` es la versión generada para publicar. El flujo de actualización y despliegue está descrito en `PUBLICAR-CLOUDFLARE-PAGES.md`. Los cambios de valores KV no requieren reconstruir ni volver a desplegar la carpeta.
