# Proyecto85 Coach 6.0

Reconstrucción limpia de Proyecto85. No depende de `app.js` antiguo ni de scripts `enhancements-*`.

## Qué recupera y mejora

- Full Body 5 días: cada día incluye piernas, espalda, pecho, hombros, bíceps, tríceps y core.
- Rotación semanal real usando el equipamiento confirmado del Basic-Fit.
- Sugerencia de carga basada en el último registro disponible y rango de repeticiones visible.
- Check-in de energía, cansancio, sueño, hinchazón y molestias.
- Registro de dolor por ejercicio y exclusión temporal sin penalización.
- Nutrición con desayuno, media mañana, comida, merienda y cena.
- Biblioteca de 56 recetas heredadas de la versión funcional anterior, más recetas propias.
- Sustitución de comidas con 3 alternativas menos repetidas dentro de la semana.
- Compra, despensa y preparación semanal.
- Evolución con medidas y sensaciones.
- Diseño claro y más cálido; no usa el tema negro/verde como base.
- Importación no destructiva desde `p85v5_state` y `p85pro2_state`.

## Archivos de publicación

Subir todos estos archivos a la raíz de GitHub Pages:

- `index.html`
- `data-v6.js`
- `engine-v6.js`
- `app-v6.js`
- `styles-v6.css`
- `manifest-v6.json`
- `icon-v6-192.png`
- `icon-v6-512.png`

No necesita `sw.js`.

## Datos

La versión nueva usa la clave `p85coach6_state`. Lee las claves antiguas para migrar datos, pero no las elimina.

Antes de actualizar, conservar siempre una copia de seguridad JSON exportada desde la app actual.
