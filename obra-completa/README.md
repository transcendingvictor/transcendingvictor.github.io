# Obra completa

Sección de la web con todos los poemas y textos de Víctor.

- `datos/catalogo.csv`: la base de datos, con una fila por pieza (código, fechas, fuente, etiquetas, pista de dedicatoria y texto). Las personas reales de las dedicatorias **no** van aquí, porque el repositorio es público.
- `anotaciones/<código>.md`: la explicación, las anotaciones por verso y las valoraciones con fecha y nota. El formato está en `_PLANTILLA.md`.
- `generar.py`: une las dos cosas en `datos/obra.json`, que es lo que lee la web. Hay que ejecutarlo después de cada cambio: `python obra-completa/generar.py`.
- `index.html` (índice con buscador y filtros) y `poema.html?c=CÓDIGO` (lectura, con un interruptor para ver los comentarios).
