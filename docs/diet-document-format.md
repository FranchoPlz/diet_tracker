# Formato estándar de documentos de dieta

Este formato define cómo redactar un plan en DOCX y exportarlo a PDF para que la aplicación reconozca dietas, comidas, opciones, ingredientes y preparaciones de forma determinista.

## Requisitos del documento

- El documento debe contener texto seleccionable. No se admiten páginas escaneadas como imagen.
- El DOCX debe usar párrafos normales y saltos de página. No se deben usar cuadros de texto, columnas, encabezados, pies ni tablas para el contenido de la dieta: al exportarlos, el orden de lectura puede cambiar.
- Cada encabezado estructural debe ocupar su propia línea.
- El PDF debe conservar el texto y las fuentes. La opción habitual es **Guardar como PDF** o **Exportar a PDF**, no imprimir o escanear.
- Las mayúsculas y las tildes son recomendadas como se muestran aquí. El parser admite `OPCION`, pero los documentos nuevos deben escribir `OPCIÓN`.

## Estructura canónica

El orden es: dieta, introducción opcional, comida, opciones e ingredientes.

```text
DIETA 1

Texto introductorio opcional.

ALMUERZO

OPCIÓN 1 – NOMBRE OPCIONAL
-Ingrediente.
-Alternativa A / Alternativa B.

OPCIÓN 2 – OTRO NOMBRE
-Ingrediente.
PREPARACIÓN: Instrucciones de elaboración.

COMIDA
...

DIETA 2
...
```

### Dietas

- Usar `DIETA 1` y `DIETA 2`, cada uno en un párrafo independiente.
- El texto entre `DIETA N` y la primera comida se guarda como introducción.
- No mencionar `DIETA 1` o `DIETA 2` como una línea aislada dentro de otro texto.

### Comidas

Los encabezados admitidos son:

```text
DESAYUNO
ALMUERZO
COMIDA
MERIENDA
CENA
```

- Cada encabezado debe estar solo en su línea.
- Se pueden omitir las comidas que no correspondan.
- Se recomienda mantener el orden anterior.

### Opciones

El formato canónico es:

```text
OPCIÓN 1
OPCIÓN 2 – TORTILLA DE BONIATO
OPCIÓN 3 – PIZZA
```

- Numerar desde 1 y usar números consecutivos dentro de cada comida.
- Si una comida tiene varias opciones, todas deben tener su encabezado `OPCIÓN N`.
- Si una comida tiene una única opción, el encabezado `OPCIÓN 1` puede omitirse.
- Usar un guion medio `–` entre el número y el nombre. El parser también tolera `-`, pero no debe usarse en documentos nuevos.
- No anteponer el tipo de comida: escribir `OPCIÓN 1`, no `COMIDA OPCIÓN 1` ni `CENA 1`.
- El parser normaliza formatos heredados como `COMIDA 1`, `COMIDA OPCIÓN 1` u `OPCIÓN 1 DE COMIDA`, pero solo existen para importar documentos antiguos.

### Ingredientes

Cada grupo de ingredientes ocupa una línea y empieza por `-`.

```text
-150g de Pechuga de pollo.
-1 Huevo.
-2 Cucharadas de tomate triturado.
```

Unidades recomendadas:

- Peso: `g`, `kg`.
- Volumen: `ml`, `l`.
- Unidades contables: `unidad`, `huevo`, `lata`, `paquete`, `vasito`, `loncha`, `cucharada`, etc.
- Fracciones: `1/2`, `¼`, `½`, `¾`.

No separar la cantidad, la unidad y el ingrediente en columnas o cuadros distintos.

#### Alternativas

Las alternativas equivalentes se escriben en la misma línea, separadas por ` / `:

```text
-150g de Pollo / 150g de Pavo / 120g de Ternera.
```

La aplicación mostrará un único selector con esas alternativas. No repetir una alternativa idéntica: durante la importación se eliminan únicamente duplicados textuales exactos dentro de la misma línea.

#### Combinaciones

Los alimentos que se consumen juntos se separan con ` + `:

```text
-1 Huevo + 60g de Pavo.
```

No mezclar el significado de `/` y `+`: `/` significa «elegir una alternativa» y `+` significa «incluir todos los elementos».

### Preparación y notas

La preparación, si existe, va después de todos los ingredientes de la opción:

```text
PREPARACIÓN: Cortar las verduras, mezclar los ingredientes y hornear durante 20 minutos.
```

Puede continuar en los párrafos siguientes. No añadir ingredientes después de `PREPARACIÓN:` dentro de la misma opción.

Una nota asociada a un ingrediente puede escribirse entre paréntesis al final de su línea:

```text
-200g de Garbanzos. (Añadir limón antes de servir).
```

## Secciones posteriores

`SUPLEMENTACIÓN` o `ENTRENAMIENTO`, en una línea independiente, marcan el final de las dietas. La suplementación no se incorpora a la lista de la compra.

## Formato visual recomendado

| Elemento | Estilo recomendado |
|---|---|
| Título del documento | 20–24 pt, negrita |
| `DIETA N` | 18 pt, negrita, salto de página antes de `DIETA 2` |
| Comida | 14–16 pt, negrita, mayúsculas |
| `OPCIÓN N` | 11–12 pt, negrita |
| Ingredientes y preparación | 10–11 pt, interlineado sencillo |
| Márgenes | 18–22 mm |

El estilo visual no interviene en el parser; la estructura de párrafos y el texto sí.

## Lista de validación

Antes de entregar el DOCX o PDF:

1. Seleccionar y copiar texto desde el PDF para confirmar que no es una imagen.
2. Comprobar que cada `DIETA`, comida y `OPCIÓN` queda en una línea independiente al pegar el texto en un editor plano.
3. Verificar que todas las opciones de una comida están numeradas y que no se repiten encabezados ni alternativas.
4. Confirmar que `/` solo separa alternativas y `+` solo combina ingredientes.
5. Abrir el PDF en la aplicación y revisar el número de opciones de cada comida.

## Archivos de referencia

- `samples/OCTUBRE_ESTANDARIZADO.docx`: documento editable siguiendo este formato.
- `samples/OCTUBRE_ESTANDARIZADO.pdf`: exportación PDF del mismo contenido, lista para importar en la aplicación.
- `docs/plantilla-dieta-entrenamiento.docx`: plantilla editable vacía con ejemplos, dos dietas, todas las comidas y secciones de entrenamiento.
