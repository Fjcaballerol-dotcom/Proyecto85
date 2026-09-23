# Validación Proyecto85 Coach 6.2

- Sintaxis JavaScript: OK.
- 5 días Full Body: OK.
- 9 ejercicios por sesión: OK.
- Cobertura diaria: 2 piernas + 2 espalda + pecho + hombros + bíceps + tríceps + core: OK.
- Check-in adaptativo: conservado.
- Historial/carga de referencia: conservado.
- Edición de kg/repeticiones: no provoca render ni cierre del modal.
- Checkbox de serie: no cierra el modal; el backdrop solo cierra al tocar fuera.
- Persistencia: misma clave `p85coach6_state`.
- Nombres principales de máquinas: español.
- Nutrición y resto de módulos: conservados.
- Sin service worker.

Nota: se ha corregido el fallo estructural del cierre del modal que hacía que cualquier clic dentro de la sesión pudiera propagarse al fondo y cerrar el entrenamiento.
