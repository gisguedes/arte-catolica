# Imágenes de categorías

Las fotos de las categorías se sirven desde esta carpeta (por ahora en el repositorio). En el futuro se usará un servidor para almacenar todas las fotos.

## Archivos esperados

Cada categoría usa una imagen con el nombre del **alias** de la categoría. Añade aquí los ficheros (por ejemplo JPG o PNG):

| Alias                | Nombre sugerido            |
| -------------------- | -------------------------- |
| sculptures           | `sculptures.jpg`           |
| paintings            | `paintings.jpg`            |
| rosaries-devotionals | `rosaries-devotionals.jpg` |
| icons                | `icons.jpg`                |
| metalwork-silver     | `metalwork-silver.jpg`     |
| books-prints         | `books-prints.jpg`         |
| liturgical-vestments | `liturgical-vestments.jpg` |
| home-decor           | `home-decor.jpg`           |

La aplicación las solicita con la ruta `/images/categories/<alias>.<ext>`. Si no existe el archivo, la card de la categoría se muestra sin imagen.
