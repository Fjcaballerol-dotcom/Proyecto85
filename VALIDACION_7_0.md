# Validación Proyecto85 Coach 7.0

Fecha de validación: 2026-10-11

## Comprobaciones ejecutadas

### Sintaxis
- `node --check data-v7.js`: OK
- `node --check engine-v7.js`: OK
- `node --check app-v7.js`: OK

### Smoke test de aplicación
Resultado: `SMOKE_V7_OK`

Verificado:
- versión 7.0.0;
- 5 días de entrenamiento;
- todos los días conservan Full Body (piernas, espalda, pecho, hombros, bíceps, tríceps y core);
- 10 ejercicios en sesión normal;
- aparecen accesorios específicos de zonas secundarias;
- nutrición genera 7 días con desayuno, media mañana, comida, merienda y cena;
- existen alternativas de ejercicios.

### Prueba con el backup real disponible
Backup probado: `Proyecto85_backup_2026-09-21.json`.

Resultado:
- 23 sesiones conservadas;
- 4 controles de medidas conservados;
- 35 líneas de compra conservadas;
- 4 elementos de despensa conservados;
- referencia de prensa recuperada: 60 kg;
- clave antigua `p85coach6_state` conservada;
- nueva clave `p85coach7_state` creada.

### Rotación semanal
Semana 1 frente a semana 2:
- día 1: 4 ejercicios cambiados / 6 mantenidos;
- día 2: 5 cambiados / 5 mantenidos;
- día 3: 4 cambiados / 6 mantenidos;
- día 4: 4 cambiados / 6 mantenidos;
- día 5: 4 cambiados / 6 mantenidos.

Cobertura semanal comprobada:
- cuádriceps;
- femoral;
- glúteos;
- abductores/aductores;
- gemelos;
- dorsales;
- espalda alta;
- espalda media;
- espalda baja;
- trapecio;
- hombros;
- deltoide posterior;
- pecho;
- bíceps;
- tríceps;
- antebrazos;
- core.

### Check-in adaptativo
Comprobado:
- Normal: 10 ejercicios, volumen normal.
- Más suave: 9 ejercicios, menos series, cardio cómodo.
- Poco tiempo: 8 ejercicios, versión compacta con cuerpo completo.
- Recuperación baja/dolor alto: 7 ejercicios, volumen mínimo y cardio opcional.

### Corrección del bloqueo del entrenamiento
Cambio estructural aplicado:
- el entrenamiento activo es un modal bloqueado frente a cierres accidentales por toque exterior;
- completar una serie actualiza el botón y el estado sin cerrar ni rerenderizar la sesión;
- cambiar kg/repeticiones guarda directamente el estado sin navegación ni cierre;
- añadir/quitar serie reabre la misma sesión conservando la posición aproximada;
- la sesión activa se guarda automáticamente en `localStorage`.

## Limitación conocida
La conversación libre de Entrenador85 no está conectada directamente a un backend de IA. La app realiza decisiones locales con historial/reglas y prepara contexto para continuar la conversación en ChatGPT. No se simula una IA conectada cuando no la hay.
