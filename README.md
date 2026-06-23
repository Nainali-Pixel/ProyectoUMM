# Florería Bloom - Proyecto UMM

Proyecto web estático con catálogo de productos, carrito de compras y formulario de checkout.

## Envío del formulario por correo

El formulario de `checkout.html` quedó integrado con FormSubmit.

El pedido **siempre se envía a un solo correo fijo**, definido en el código JavaScript.
El correo que el cliente escribe en el formulario no cambia el destinatario; solo se envía como dato informativo dentro del pedido.

Para cambiar el correo que recibirá todos los pedidos, edita este archivo:

`assets/JS/checkout.js`

Busca esta línea:

```js
const CORREO_RECEPTOR_PEDIDOS = 'correo.destino@ejemplo.com';
```

Reemplaza `correo.destino@ejemplo.com` por el correo real. Ejemplo:

```js
const CORREO_RECEPTOR_PEDIDOS = 'profesor@correo.com';
```

No es necesario cambiar el `action` del formulario en `checkout.html`, porque el JavaScript lo completa automáticamente usando la constante anterior.

## Importante

La primera vez que se envíe el formulario, FormSubmit solicitará activar el correo receptor. Debes revisar la bandeja de entrada del correo configurado y confirmar la activación.

Para que la redirección a `gracias.html` funcione correctamente, se recomienda probar el proyecto publicado en GitHub Pages u otro hosting, no solamente abriendo el HTML como archivo local.
