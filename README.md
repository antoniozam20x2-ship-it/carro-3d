# Deportivo 3D 🏎️ — visor web (demo)

**En línea:** https://carro-3d.vercel.app/

Visor 3D de un carro deportivo **low-poly**, hecho con **Three.js**. Se gira con el
mouse (o con el dedo en el celular) y se acerca con la rueda / pellizco.

- Sin backend. Sitio 100% estático.
- El carro **no** es un archivo de modelo: toda la geometría se genera por código
  (perfil lateral extruido + cajas + cilindros), con `flatShading` para el look low-poly.

## Ver local

Abre `index.html` con un servidor estático (los módulos ES no cargan con `file://`):

```bash
npx serve .
```

## Estructura

```
index.html        marcado y HUD
css/estilo.css    estilos del visor
js/main.js        escena, luces, carro e interacción
```

## Qué incluye

- **Carrocería**: perfil lateral dibujado con `THREE.Shape` (nariz, cofre, cresta del
  guardafango, línea de cintura, cola) y extruido a lo ancho, con los huecos de los
  pasos de rueda recortados en el propio perfil.
- **Cabina**: canopy de cristal más angosto que la carrocería, con techo pintado encima.
- **Ruedas**: llanta, rin, centro y buje concéntricos + pozo de rueda que tapa el hueco.
- **Detalles**: splitter, difusor, faldones, toma de aire, faros y calaveras emisivas,
  alerón, espejos y escapes.
- **Escena**: piso con sombra, fondo con degradado, niebla, luces clave/relleno/contraluz
  y reflejos de estudio con `RoomEnvironment` + `PMREMGenerator`.
- **Interacción**: `OrbitControls` (arrastrar = girar, rueda/pellizco = zoom), con límites
  para no atravesar el piso. Botón "Centrar vista".
- **Encuadre adaptativo**: una vista para pantalla ancha y otra para pantalla vertical
  (celular), recalculadas al girar el teléfono.

## Rendimiento

- Pixel ratio limitado a 2.
- Geometrías de pocos segmentos (arcos de 6, ruedas de 14 caras).
- Sombras en un solo mapa de 2048 px.

## Notas

Modelo y textos de ejemplo. Sin datos reales ni backend.
