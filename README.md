# Florería Bloom - Proyecto UMM

Proyecto web estático con catálogo de productos, carrito de compras y formulario de checkout.

## Envío del formulario por correo

El formulario de `checkout.html` quedó integrado con FormSubmit.

Para cambiar el correo que recibirá los pedidos, edita este archivo:

`assets/JS/checkout.js`

Busca esta línea:

```js
const CORREO_DESTINO = 'TU_CORREO@EMAIL.COM';
```

Reemplaza `TU_CORREO@EMAIL.COM` por el correo real. Ejemplo:

```js
const CORREO_DESTINO = 'profesor@correo.com';
```

Además, en `checkout.html` también quedó el mismo correo como respaldo en el atributo `action` del formulario:

```html
action="https://formsubmit.co/TU_CORREO@EMAIL.COM"
```

Puedes reemplazarlo por el mismo correo de destino.

## Importante

La primera vez que se envíe el formulario, FormSubmit solicitará activar el correo destino. Debes revisar la bandeja de entrada del correo configurado y confirmar la activación.

Para que la redirección a `gracias.html` funcione correctamente, se recomienda probar el proyecto publicado en GitHub Pages u otro hosting, no solamente abriendo el HTML como archivo local.
