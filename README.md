# Proyecto85 Coach 7.0

Reconstrucción funcional de Proyecto85 centrada en Entrenador85 como guía diaria. No es un parche sobre 6.2: usa nuevos archivos `*-v7.*` y una nueva clave `p85coach7_state`, con migración no destructiva desde `p85coach6_state`.

## Núcleo de entrenamiento

- Full Body 5 días con énfasis rotativo.
- 10 ejercicios en sesión normal y cobertura semanal explícita de cuádriceps, femoral, glúteos, abductores/aductores, gemelos, dorsales, espalda alta/media/baja, trapecio, hombros/deltoide posterior, pecho, bíceps, tríceps, antebrazos y core.
- Rotación semanal controlada: conserva aproximadamente 50–60 % y cambia 40–50 % cuando existen alternativas.
- Carga/repeticiones anteriores visibles por serie.
- Sugerencia de referencia basada en historial real; no fuerza progresión automática.
- Edición de kg/repeticiones sin salir de la sesión.
- Botón de serie completada que actualiza en sitio; el modal de entrenamiento no se cierra al tocar fuera.
- Hasta 4 series editables.
- Temporizador de descanso.
- Cambio de ejercicio por: máquina ocupada, máquina averiada, molestia, querer variar o no gustar.
- Alternativas del mismo patrón/familia usando máquinas disponibles.
- Registro de molestias sin penalización.
- Check-in que modifica volumen, número de ejercicios y cardio.
- Mapa muscular por carga reciente (estimación basada en historial, no medición clínica).
- Resumen post-entrenamiento.

## Nutrición

- Desayuno, media mañana, comida, merienda y cena.
- Semana actual y próxima semana.
- Biblioteca amplia + recetas propias editables y eliminables.
- Favoritos, “no repetir”, valoración 1–10 y marcado de comidas realizadas.
- Cambios de comida considerando lo repetido durante la semana.
- Preparación semanal / batch cooking.
- Lista de compra.
- Despensa.

## Evolución y recuperación

- Medidas semanales.
- Comparación con control anterior y primer registro.
- Energía, cansancio, sueño, hinchazón y molestias.
- Avisos prudentes ante cambios amplios de perímetros o bioimpedancia.
- Entrenador85 siempre muestra una pregunta o recomendación contextual; no hay bloque vacío.

## Seguridad de datos

- Nueva clave: `p85coach7_state`.
- Si existe `p85coach6_state`, se copia/migra sin borrar la clave antigua.
- Exportación/importación JSON.
- No usa service worker.

## Archivos a subir a GitHub Pages

- `index.html`
- `app-v7.js`
- `engine-v7.js`
- `data-v7.js`
- `styles-v7.css`
- `manifest-v7.json`
- `icon-v7-192.png`
- `icon-v7-512.png`

No es necesario borrar Safari ni limpiar almacenamiento local.
