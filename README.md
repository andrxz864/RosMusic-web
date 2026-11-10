# RosMusic Web

Plataforma musical web independiente, adaptable a Android y escritorio. No utiliza Expo ni forma parte de RosMusic APK.

## Incluye en esta versión
- Interfaz responsive con navegación inferior táctil en Android.
- Manifest y service worker para instalación como PWA desde un navegador compatible.
- Caché básica de la interfaz para poder abrir la app shell sin conexión.
- Búsqueda musical en el catálogo independiente de Jamendo.
- Reproducción de las pistas de Jamendo que ofrecen una URL de streaming disponible.
- Favoritos y preferencias guardados localmente.
- Color de ambiente aproximado a partir de la portada de la canción actual.

## Publicar con GitHub Pages
En el repositorio: Settings → Pages → Build and deployment → Deploy from a branch → main → /(root). Guarda los cambios y espera a que GitHub muestre la URL.

## Instalar en Android
Abre la URL publicada con Chrome en Android y usa el menú del navegador → Instalar aplicación (o Añadir a pantalla de inicio, según versión).

## Límites actuales
Jamendo está enfocado principalmente en artistas independientes y no contiene todo el catálogo comercial. La disponibilidad de streaming y las condiciones de cada pista dependen de sus licencias. Esta versión no ofrece acceso universal a artistas comerciales ni garantiza todas las canciones completas. Para ampliar el catálogo se necesita una integración autorizada con proveedores que permitan la reproducción en web.

## Archivos
- index.html: estructura y navegación.
- styles.css: diseño adaptable y tema.
- app.js: búsqueda, favoritos y reproductor de previews.
- manifest.webmanifest: metadatos PWA.
- sw.js: caché de la interfaz.
- icon.svg: icono de RosMusic.
