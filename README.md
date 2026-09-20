# Proyecto85 5.0

Reconstrucción completa de Proyecto85 con una base nueva y sin capas de parches sobre versiones 4.x.

## Principios
- Interfaz clara y luminosa.
- Entrenamientos con continuidad + rotación semanal.
- Menús con variedad real y memoria de repeticiones.
- Perfil “Mi gimnasio” para limitar propuestas al equipamiento disponible.
- Registro de molestias/dolor por ejercicio e interrupción sin penalización.
- Check-in de energía, cansancio, sueño, hinchazón y molestias.
- Modo recuperación cuando las sensaciones no son buenas.
- Evolución basada en tendencias y bienestar, no en una sola medición.
- Copia de seguridad e importación.
- Migración legacy de solo lectura: no borra claves antiguas.
- Sin service worker.
- Assets físicos nuevos (`app-v5.js`, `styles-v5.css`) para evitar que Safari/GitHub reutilicen la versión 4.x desde caché.

## Instalación en GitHub Pages
Sube todos los archivos de este ZIP a la raíz del repositorio y sustituye los anteriores. No añadas sw.js.

## Almacenamiento
La nueva clave principal es `p85v5_state`. La app detecta de forma segura algunas claves históricas (`p85pro2_state`, `p85proclean_state`, `p85_state`) y copia datos reconocibles sin borrar los originales.

## Pruebas realizadas
- Sintaxis JavaScript.
- Carga real en Chromium headless.
- Navegación principal.
- Generación de 5 días de entrenamiento.
- Generación de 7 días de comidas con variedad mínima.
- Check-in y modo recuperación.
- Registro de molestias y alternativas.
- Persistencia con localStorage.
- Exportación/importación disponible.
- Ausencia de service worker.
