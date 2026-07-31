# Proyecto85 V3.1 estable

Versión base para uso diario. Integra entrenamiento flexible, recuperación de sesiones, core en máquinas y poleas, cardio progresivo, nutrición semanal, lista de compra y despensa, evolución, salud, analíticas locales, recordatorios y copias de seguridad.

## Privacidad
El repositorio contiene solo el código. Los datos personales y médicos se guardan en el dispositivo mediante almacenamiento local. No subas analíticas, informes médicos, fotos personales ni copias de seguridad a un repositorio público.

## Actualización en GitHub Pages
Sustituye los archivos actuales por los de esta carpeta. Los datos ya registrados en la aplicación deberían conservarse porque permanecen en el almacenamiento local del navegador.

## Cambios V3.1.2

- Migración real de configuraciones antiguas: completa automáticamente `currentWeight`, `totalWeeks` y otros campos ausentes sin borrar datos locales.
- Registro oficial inicial del 27/07/2026 con 106 kg y todas las métricas disponibles.
- El peso actual se obtiene del último control válido registrado.
- La pantalla de inicio nunca muestra `undefined`; utiliza valores validados o un guion.
- Inicio con peso inicial, peso actual, objetivo, pérdida acumulada, kilos restantes y semana completa.
- Service worker V3.1.2 con activación inmediata y renovación de caché.
