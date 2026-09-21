# Validación Proyecto85 Coach 6.0

Fecha de validación: 2026-09-21

## Pruebas realizadas

- Sintaxis JavaScript: `node --check` correcto en `data-v6.js`, `engine-v6.js` y `app-v6.js`.
- Motor de entrenamiento: 5 días generados; los 5 contienen Piernas, Espalda, Pecho, Hombros, Bíceps, Tríceps y Core.
- Volumen base: 7 ejercicios por sesión, con adaptación a 5 o 7 cuando el check-in indica recuperación/día suave.
- Rotación: las cinco sesiones generadas no son copias exactas entre sí.
- Historial de carga: con la copia real del 21/09/2026 se recuperó una referencia de Leg Press de 60 kg desde el historial.
- Nutrición: 7 días completos con desayuno, media mañana, comida, merienda y cena.
- Biblioteca: 56 recetas; tipos presentes: desayuno, media mañana, comida, merienda y cena.
- Variedad: en la semana de prueba se generaron 14 platos principales distintos entre comidas y cenas.
- Migración con la copia real del usuario: 23 sesiones, 4 controles corporales y 11 planes históricos recuperados en la prueba.
- Acciones UI: auditoría estática de todos los `data-action`; no quedaron botones sin manejador.
- Manifest: JSON válido y assets físicos con nombres V6.
- Service worker: no incluido.

## Smoke test

Resultado del smoke test en entorno VM:

`SMOKE_V6_OK`

Comprobaciones incluidas:

- versión 6.0.0;
- biblioteca >= 50 recetas;
- cinco tipos de ingesta;
- cinco sesiones Full Body completas;
- semana nutricional completa;
- estructuras de historial y medidas disponibles tras migración.

## Limitación de validación

Se intentó una prueba visual con Chromium headless en el contenedor, pero el proceso de Chromium no fue estable en ese entorno y terminó por timeout relacionado con el servicio del navegador. Por eso no se declara una validación visual automatizada completa. La lógica, migración, sintaxis, referencias de archivos y flujos principales sí fueron comprobados con tests ejecutables y revisión estática.
