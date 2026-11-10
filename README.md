# RosMusic Web

Plataforma musical web independiente, adaptable a Android y escritorio. No utiliza Expo ni forma parte de RosMusic APK.

## Incluye en esta versión
- Interfaz responsive con navegación inferior táctil en Android.
- Manifest y service worker para instalación como PWA desde un navegador compatible.
- Caché básica de la interfaz para poder abrir la app shell sin conexión.
- Búsqueda musical con la API pública de Deezer.
- Reproducción de las muestras disponibles (normalmente fragmentos de 30 segundos).
- Favoritos y preferencias guardados localmente.
- Color de ambiente aproximado a partir de la portada de la canción actual.

## Publicar con GitHub Pages
En el repositorio: Settings → Pages → Build and deployment → Deploy from a branch → main → /(root). Guarda los cambios y espera a que GitHub muestre la URL.

## Instalar en Android
Abre la URL publicada con Chrome en Android y usa el menú del navegador → Instalar aplicación (o Añadir a pantalla de inicio, según versión).

## Límites actuales
La API pública de Deezer y sus muestras están sujetas a disponibilidad y políticas del proveedor. Esta versión no ofrece catálogo completo ni reproducción de canciones completas. Para ello se necesita una integración autorizada con un servicio musical, respetando sus licencias y requisitos de cuenta.

## Archivos
- index.html: estructura y navegación.
- styles.css: diseño adaptable y tema.
- app.js: búsqueda, favoritos y reproductor de previews.
- manifest.webmanifest: metadatos PWA.
- sw.js: caché de la interfaz.
- icon.svg: icono de RosMusic.
