# Publicar Holisofi Live

Holisofi Live ya está publicado y funcionando en Cloudflare Pages bajo la cuenta de Minos, en el proyecto `hslive`. La carpeta fuente es `Holisofi Live`; la carpeta lista para publicar es `cloudflare pages`.

## Actualizar el sitio

1. Los cambios de código se hacen en los archivos fuente de `Holisofi Live`.
2. `actualizar-cloudflare-pages.bat` genera la versión actualizada en `cloudflare pages`.
3. Desde PowerShell, en la carpeta `Holisofi Live`, se publica con:

```powershell
npx.cmd wrangler pages deploy ".\cloudflare pages" --project-name hslive
```

Wrangler despliega tanto los archivos estáticos como las Pages Functions. Subir solo archivos desde el panel de Cloudflare no actualiza las funciones.

La configuración cotidiana de Twitch, video, KV y nombre del sitio se describe en [GUIA-DE-USO.md](GUIA-DE-USO.md).

## Capacidad y costo de Cloudflare

El proyecto y su código son gratuitos; el uso puede mantenerse en el nivel gratuito mientras no se superen sus límites. Los archivos estáticos de Pages —HTML, CSS, JavaScript e imágenes— tienen solicitudes gratuitas e ilimitadas. Las llamadas a `functions/api/site-config.js` y `functions/api/twitch-channel.js` sí cuentan como solicitudes de Workers/Pages Functions.

En el nivel gratuito hay **100,000 solicitudes de Workers/Pages Functions por día para toda la cuenta Cloudflare**, compartidas con los demás Workers y Pages Functions de esa cuenta. No son “tokens de Twitch”: son ejecuciones de funciones contabilizadas por Cloudflare. [Límites oficiales de Workers](https://developers.cloudflare.com/workers/platform/limits/) · [Precios de Pages Functions](https://developers.cloudflare.com/pages/functions/pricing/).

En la implementación actual, cada apertura normal de la página llama una vez a `site-config` y una vez a `twitch-channel`. Además, mientras la pestaña está visible, `site-config` se consulta cada cinco minutos para revisar el modo del sitio; el sondeo se pausa cuando la pestaña está oculta. Ese sondeo consulta la configuración de KV, no la API de Twitch.

Como referencia, 400 pestañas visibles durante todo un día generarían hasta 115,200 solicitudes diarias solo por el sondeo de cinco minutos (`400 × 288`), más las llamadas iniciales. Es un escenario sostenido e ilustrativo, no una medición del tráfico real. Aún se desconoce el consumo habitual; por eso conviene revisar **Workers & Pages → hslive → Metrics/Usage** en la cuenta de Minos antes de decidir.

Si el uso real excede lo que permite el nivel gratuito, puede ser necesario activar **Workers Paid**, que empieza en **US$5 al mes por cuenta** e incluye 10 millones de solicitudes mensuales; después, cada millón adicional cuesta US$0.30. Este pago amplía la capacidad de las funciones; no es una tarifa por el alojamiento de los archivos estáticos ni por el código. El uso de CPU y las operaciones de KV tienen sus propias cuotas y cargos. El plan no es un requisito actual ni está confirmado que vaya a hacer falta: sería una ampliación de capacidad si las métricas muestran que el tráfico la requiere. [Precios oficiales de Workers](https://developers.cloudflare.com/workers/platform/pricing/).
