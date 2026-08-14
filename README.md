# Proyecto85 Pro CLEAN 1.2

Esta versión añade un mecanismo de recuperación independiente:

1. Sube TODOS los archivos a GitHub.
2. Abre `reset.html` desde Safari.
3. Pulsa **Limpiar y abrir Clean 1.2**.
4. Debe aparecer `Proyecto85 Pro · Clean 1.2`.

El reset desregistra service workers y borra cachés, pero no borra localStorage.
Además, los archivos principales ahora tienen nombres nuevos:
- app-clean-1-2.js
- styles-clean-1-2.css

Esto evita reutilizar los assets antiguos cacheados.
