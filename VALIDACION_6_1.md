# Validación Proyecto85 Coach 6.1

- `node --check` en data, engine y app: OK.
- Motor: 5 días Full Body y 8 ejercicios por día.
- Cobertura diaria: Piernas, Espalda, Pecho, Hombros, Bíceps, Tríceps y Core.
- Check-in: normal, día suave y recuperación alteran número de series/cardio sin borrar grupos musculares.
- Sesión activa se persiste en `p85coach6_state`.
- Inputs de kg/repeticiones guardan con `input/change` sin `render()`.
- Añadir/quitar serie vuelve a la misma sesión.
- Molestia durante sesión preserva el borrador activo.
- Historial, medidas y nutrición no se eliminan.

- Test del motor con el backup real: `ENGINE_V61_OK` (5 días × 8 ejercicios, referencia de prensa 60 kg, check-in suave, 7 días de nutrición).
